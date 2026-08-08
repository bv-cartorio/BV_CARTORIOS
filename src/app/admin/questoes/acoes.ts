"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { EstadoQuestao } from "@/app/admin/questoes/estados";
import { Letter, QuestionStatus, QuestionType } from "@/generated/prisma/enums";
import { exigirPapel } from "@/lib/auth/guardas";
import { prisma } from "@/lib/prisma";
import { sanitizarHtml, vazioAposSanitizar } from "@/lib/sanitizar";

const CAMINHO = "/admin/questoes";

const LETRAS: Letter[] = ["A", "B", "C", "D", "E"];

/** Texto das duas alternativas fixas de uma questão certo/errado. */
const CERTO_ERRADO: Record<"A" | "B", string> = {
  A: "Certo",
  B: "Errado",
};

const STATUS_POR_ACAO: Record<string, QuestionStatus> = {
  rascunho: "DRAFT",
  revisao: "REVIEW",
  publicar: "PUBLISHED",
  desativar: "DISABLED",
};

const opcional = (max: number) =>
  z.string().trim().min(1).max(max).optional().catch(undefined);

const formSchema = z.object({
  tipo: z.enum(QuestionType).catch("MULTIPLE_CHOICE"),
  enunciado: z.string(),
  comentario: z.string(),
  gabarito: z.enum(Letter),
  materiaId: z.string().trim().min(1, "Escolha a matéria"),
  assuntoId: opcional(40),
  subassuntoId: opcional(40),
  bancaId: opcional(40),
  ano: z.coerce.number().int().min(1980).max(2100).optional().catch(undefined),
  origem: opcional(160),
  dificuldade: z.enum(["EASY", "MEDIUM", "HARD"]).optional().catch(undefined),
  videoId: opcional(120),
  videoProvider: z
    .enum(["PANDA", "MUX", "VIMEO", "YOUTUBE"])
    .optional()
    .catch(undefined),
});

function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor : "";
}

/**
 * Monta as alternativas conforme o formato.
 *
 * Certo/errado é uma questão de duas alternativas fixas — ver o comentário do
 * enum `QuestionType` no schema. O texto não vem do formulário: quem edita
 * escolhe só qual das duas é a correta.
 */
function montarAlternativas(
  tipo: QuestionType,
  dados: FormData,
): { letra: Letter; texto: string }[] {
  if (tipo === "TRUE_FALSE") {
    return [
      { letra: "A", texto: CERTO_ERRADO.A },
      { letra: "B", texto: CERTO_ERRADO.B },
    ];
  }

  return LETRAS.map((letra) => ({
    letra,
    texto: sanitizarHtml(texto(dados, `alternativa_${letra}`)),
  })).filter((a) => a.texto.length > 0);
}

/**
 * Recalcula o acerto das respostas já dadas quando o gabarito muda.
 *
 * Sem isso, corrigir um gabarito errado — que é justamente o motivo de reporte
 * mais comum — deixaria o histórico e as estatísticas de todo mundo apoiados na
 * resposta antiga. O aluno que acertou continuaria marcado como quem errou.
 */
async function realinharRespostas(
  questionId: string,
  gabarito: Letter,
): Promise<number> {
  const desalinhadas = await prisma.answer.count({
    where: {
      questionId,
      OR: [
        { letter: gabarito, isCorrect: false },
        { letter: { not: gabarito }, isCorrect: true },
      ],
    },
  });

  if (desalinhadas === 0) return 0;

  await prisma.$transaction([
    prisma.answer.updateMany({
      where: { questionId, letter: gabarito },
      data: { isCorrect: true },
    }),
    prisma.answer.updateMany({
      where: { questionId, letter: { not: gabarito } },
      data: { isCorrect: false },
    }),
  ]);

  return desalinhadas;
}

export async function salvarQuestao(
  questionId: string | null,
  _anterior: EstadoQuestao,
  dados: FormData,
): Promise<EstadoQuestao> {
  const usuario = await exigirPapel(["ADMIN"], CAMINHO);

  const entrada = formSchema.safeParse({
    tipo: dados.get("tipo"),
    enunciado: texto(dados, "enunciado"),
    comentario: texto(dados, "comentario"),
    gabarito: dados.get("gabarito"),
    materiaId: dados.get("materiaId"),
    assuntoId: dados.get("assuntoId"),
    subassuntoId: dados.get("subassuntoId"),
    bancaId: dados.get("bancaId"),
    ano: dados.get("ano"),
    origem: dados.get("origem"),
    dificuldade: dados.get("dificuldade"),
    videoId: dados.get("videoId"),
    videoProvider: dados.get("videoProvider"),
  });

  if (!entrada.success) {
    return { erro: entrada.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const dadosForm = entrada.data;
  const acao = String(dados.get("acao") ?? "rascunho");
  const status = STATUS_POR_ACAO[acao] ?? "DRAFT";

  if (vazioAposSanitizar(dadosForm.enunciado)) {
    return { erro: "O enunciado está vazio." };
  }

  const alternativas = montarAlternativas(dadosForm.tipo, dados);

  if (dadosForm.tipo === "MULTIPLE_CHOICE" && alternativas.length < 2) {
    return { erro: "Preencha ao menos duas alternativas." };
  }

  if (!alternativas.some((a) => a.letra === dadosForm.gabarito)) {
    return {
      erro: `O gabarito aponta para a alternativa ${dadosForm.gabarito}, que está vazia.`,
    };
  }

  // Publicar sem comentário deixaria o aluno sem a resolução — o produto inteiro
  // se apoia nela. Em rascunho e revisão o campo pode ficar pendente.
  if (status === "PUBLISHED" && vazioAposSanitizar(dadosForm.comentario)) {
    return {
      erro: "Não dá para publicar sem o comentário do professor. Salve como rascunho enquanto ele não estiver pronto.",
    };
  }

  // Vídeo só faz sentido com os dois campos: id sem provedor não toca.
  if (Boolean(dadosForm.videoId) !== Boolean(dadosForm.videoProvider)) {
    return { erro: "Informe o provedor e o ID do vídeo, ou deixe os dois em branco." };
  }

  const comuns = {
    type: dadosForm.tipo,
    statement: sanitizarHtml(dadosForm.enunciado),
    explanation: sanitizarHtml(dadosForm.comentario),
    answerKey: dadosForm.gabarito,
    status,
    subjectId: dadosForm.materiaId,
    topicId: dadosForm.assuntoId ?? null,
    subtopicId: dadosForm.subassuntoId ?? null,
    boardId: dadosForm.bancaId ?? null,
    year: dadosForm.ano ?? null,
    source: dadosForm.origem ?? null,
    difficulty: dadosForm.dificuldade ?? null,
    videoId: dadosForm.videoId ?? null,
    videoProvider: dadosForm.videoProvider ?? null,
  };

  let id = questionId;
  let corrigidas = 0;

  if (id) {
    const atual = await prisma.question.findUnique({
      where: { id },
      select: { publishedAt: true },
    });

    if (!atual) return { erro: "Questão não encontrada." };

    await prisma.question.update({
      where: { id },
      data: {
        ...comuns,
        // A data da primeira publicação não se reescreve a cada edição.
        publishedAt:
          status === "PUBLISHED" ? (atual.publishedAt ?? new Date()) : atual.publishedAt,
      },
    });

    await prisma.alternative.deleteMany({ where: { questionId: id } });
    corrigidas = await realinharRespostas(id, dadosForm.gabarito);
  } else {
    const criada = await prisma.question.create({
      data: {
        ...comuns,
        authorId: usuario.id,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
      select: { id: true },
    });

    id = criada.id;
  }

  await prisma.alternative.createMany({
    data: alternativas.map((a) => ({
      questionId: id!,
      letter: a.letra,
      text: a.texto,
    })),
  });

  revalidatePath(CAMINHO);
  revalidatePath("/painel/questoes");

  if (corrigidas > 0) {
    // Não redireciona: o aviso precisa ser lido.
    return {
      aviso: `Questão salva. O gabarito mudou, então ${corrigidas} ${corrigidas === 1 ? "resposta de aluno foi recalculada" : "respostas de alunos foram recalculadas"}.`,
    };
  }

  redirect(CAMINHO);
}

// ---------------------------------------------------------------------------
// Mudança de status pela listagem
// ---------------------------------------------------------------------------

export async function alterarStatus(
  questionId: string,
  novo: QuestionStatus,
): Promise<void> {
  await exigirPapel(["ADMIN"], CAMINHO);

  const atual = await prisma.question.findUnique({
    where: { id: questionId },
    select: { publishedAt: true, explanation: true },
  });

  if (!atual) return;

  if (novo === "PUBLISHED" && vazioAposSanitizar(atual.explanation)) return;

  await prisma.question.update({
    where: { id: questionId },
    data: {
      status: novo,
      publishedAt:
        novo === "PUBLISHED" ? (atual.publishedAt ?? new Date()) : atual.publishedAt,
    },
  });

  revalidatePath(CAMINHO);
  revalidatePath("/painel/questoes");
}

// ---------------------------------------------------------------------------
// Exclusão
// ---------------------------------------------------------------------------

/**
 * Exclui a questão.
 *
 * Questão já respondida por aluno não se apaga: `Answer` cai junto por cascata,
 * e com ela o histórico e o percentual de acerto de quem estudou. O caminho para
 * tirar de circulação é `DISABLED`.
 */
export async function excluirQuestao(
  questionId: string,
): Promise<{ erro?: string }> {
  await exigirPapel(["ADMIN"], CAMINHO);

  const respostas = await prisma.answer.count({ where: { questionId } });

  if (respostas > 0) {
    return {
      erro: `Esta questão já foi respondida ${respostas} ${respostas === 1 ? "vez" : "vezes"}. Apagá-la levaria junto o histórico desses alunos — use "Desativar".`,
    };
  }

  await prisma.question.delete({ where: { id: questionId } });

  revalidatePath(CAMINHO);
  return {};
}
