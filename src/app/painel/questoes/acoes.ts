"use server";

import { z } from "zod";

import type {
  EstadoAnotacao,
  EstadoReporte,
  EstadoResposta,
} from "@/app/painel/questoes/estados";
import { Letter, ReportReason } from "@/generated/prisma/enums";
import { exigirUsuario } from "@/lib/auth/guardas";
import { prisma } from "@/lib/prisma";
import { podeResponder, situacaoDeAcesso } from "@/lib/questoes/acesso";
import { carregarResolucoes } from "@/lib/questoes/consulta";
import { COTA_DIARIA_GRATUITA } from "@/lib/questoes/cota";

const DESTINO = "/painel/questoes";

/** Confere que a questão existe e está publicada antes de gravar qualquer coisa. */
async function questaoPublicada(questionId: string) {
  return prisma.question.findFirst({
    where: { id: questionId, status: "PUBLISHED" },
    select: { id: true, answerKey: true },
  });
}

// ---------------------------------------------------------------------------
// Responder
// ---------------------------------------------------------------------------

/**
 * Registra a resposta e devolve a resolução.
 *
 * A correção é feita **aqui**, comparando com `Question.answerKey` — nunca no
 * cliente. O gabarito e o comentário só entram na resposta desta action; antes
 * disso não existem no HTML da página.
 */
export async function responder(
  questionId: string,
  _anterior: EstadoResposta,
  dados: FormData,
): Promise<EstadoResposta> {
  const usuario = await exigirUsuario(DESTINO);
  const letra = z.enum(Letter).safeParse(dados.get("letra"));

  if (!letra.success) {
    return { situacao: "erro", mensagem: "Escolha uma alternativa." };
  }

  const questao = await questaoPublicada(questionId);

  if (!questao) {
    return { situacao: "erro", mensagem: "Esta questão não está disponível." };
  }

  const acesso = await podeResponder(usuario.id, questao.id);

  if (!acesso.liberado) {
    return {
      situacao: "erro",
      cotaEsgotada: true,
      mensagem: `Você já respondeu as ${COTA_DIARIA_GRATUITA} questões gratuitas de hoje.`,
    };
  }

  const acertei = letra.data === questao.answerKey;

  await prisma.answer.create({
    data: {
      userId: usuario.id,
      questionId: questao.id,
      letter: letra.data,
      isCorrect: acertei,
    },
  });

  const resolucao = (await carregarResolucoes([questao.id])).get(questao.id);

  if (!resolucao) {
    return { situacao: "erro", mensagem: "Não foi possível carregar o comentário." };
  }

  // Relido depois de gravar para o contador da página refletir esta resposta.
  const depois = await situacaoDeAcesso(usuario.id);

  return {
    situacao: "respondida",
    letra: letra.data,
    acertei,
    resolucao,
    restantes: depois.restantes,
  };
}

// ---------------------------------------------------------------------------
// Favoritas
// ---------------------------------------------------------------------------

export async function alternarFavorita(
  questionId: string,
): Promise<{ favorita: boolean }> {
  const usuario = await exigirUsuario(DESTINO);
  const chave = { userId_questionId: { userId: usuario.id, questionId } };

  const existente = await prisma.favorite.findUnique({
    where: chave,
    select: { questionId: true },
  });

  if (existente) {
    await prisma.favorite.delete({ where: chave });
    return { favorita: false };
  }

  if (!(await questaoPublicada(questionId))) return { favorita: false };

  await prisma.favorite.create({
    data: { userId: usuario.id, questionId },
  });

  return { favorita: true };
}

// ---------------------------------------------------------------------------
// Anotação
// ---------------------------------------------------------------------------

const anotacaoSchema = z.string().trim().max(5000, "A anotação ficou longa demais.");

/**
 * Salva a anotação pessoal do aluno. Texto simples — não passa por
 * `.conteudo-rico` nem aceita HTML, então não há o que sanitizar.
 */
export async function salvarAnotacao(
  questionId: string,
  _anterior: EstadoAnotacao,
  dados: FormData,
): Promise<EstadoAnotacao> {
  const usuario = await exigirUsuario(DESTINO);
  const conteudo = anotacaoSchema.safeParse(dados.get("conteudo") ?? "");

  if (!conteudo.success) {
    return { erro: conteudo.error.issues[0]?.message ?? "Anotação inválida." };
  }

  const chave = { userId_questionId: { userId: usuario.id, questionId } };

  // Anotação em branco é pedido de apagar, não de guardar texto vazio.
  if (conteudo.data === "") {
    await prisma.questionNote.deleteMany({
      where: { userId: usuario.id, questionId },
    });
    return { salva: true, conteudo: "" };
  }

  if (!(await questaoPublicada(questionId))) {
    return { erro: "Esta questão não está disponível." };
  }

  await prisma.questionNote.upsert({
    where: chave,
    create: { userId: usuario.id, questionId, content: conteudo.data },
    update: { content: conteudo.data },
  });

  return { salva: true, conteudo: conteudo.data };
}

// ---------------------------------------------------------------------------
// Reportar erro
// ---------------------------------------------------------------------------

const reporteSchema = z
  .object({
    motivo: z.enum(ReportReason),
    mensagem: z.string().trim().max(1000).optional(),
  })
  .refine((d) => d.motivo !== "OTHER" || Boolean(d.mensagem), {
    message: "Descreva o problema para o motivo “Outro”.",
    path: ["mensagem"],
  });

export async function reportarErro(
  questionId: string,
  _anterior: EstadoReporte,
  dados: FormData,
): Promise<EstadoReporte> {
  const usuario = await exigirUsuario(DESTINO);

  const entrada = reporteSchema.safeParse({
    motivo: dados.get("motivo"),
    mensagem: dados.get("mensagem") || undefined,
  });

  if (!entrada.success) {
    return { erro: entrada.error.issues[0]?.message ?? "Escolha um motivo." };
  }

  if (!(await questaoPublicada(questionId))) {
    return { erro: "Esta questão não está disponível." };
  }

  // Um reporte aberto por aluno e questão já basta: o segundo não acrescenta
  // informação e só engrossa a fila da revisão editorial.
  const aberto = await prisma.questionReport.findFirst({
    where: {
      userId: usuario.id,
      questionId,
      status: { in: ["OPEN", "IN_REVIEW"] },
    },
    select: { id: true },
  });

  if (aberto) return { enviado: true };

  await prisma.questionReport.create({
    data: {
      userId: usuario.id,
      questionId,
      reason: entrada.data.motivo,
      message: entrada.data.mensagem ?? null,
    },
  });

  return { enviado: true };
}
