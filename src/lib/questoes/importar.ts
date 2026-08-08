/**
 * Importação de questões por CSV.
 *
 * Pensado para a planilha que o professor já usa, não para um formato ideal:
 * aceita `;` ou `,` como separador (o Excel em pt-BR exporta com `;`) e trata
 * arquivo salvo em Windows-1252, que é o que sai de "CSV (separado por
 * vírgulas)" numa máquina brasileira.
 *
 * Toda execução tem dois modos: **conferir**, que valida e não grava nada, e
 * **importar**. O padrão da tela é conferir — importar 5.000 linhas erradas é
 * caro de desfazer.
 */
import Papa from "papaparse";

import type {
  Difficulty,
  Letter,
  QuestionStatus,
  QuestionType,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { sanitizarHtml, vazioAposSanitizar } from "@/lib/sanitizar";
import { slugify } from "@/lib/slug";

export const COLUNAS_ACEITAS = [
  "codigo",
  "tipo",
  "enunciado",
  "alternativa_a",
  "alternativa_b",
  "alternativa_c",
  "alternativa_d",
  "alternativa_e",
  "gabarito",
  "comentario",
  "materia",
  "assunto",
  "subassunto",
  "banca",
  "ano",
  "origem",
  "dificuldade",
  "status",
] as const;

export type ProblemaLinha = {
  linha: number;
  mensagem: string;
};

export type ResultadoImportacao = {
  totalLinhas: number;
  validas: number;
  problemas: ProblemaLinha[];
  /** Preenchido só quando gravou. */
  criadas?: number;
  atualizadas?: number;
  bancasCriadas?: string[];
  sequenciaAjustada?: boolean;
};

type Linha = Record<string, string | undefined>;

/**
 * Decodifica o arquivo tentando UTF-8 e caindo para Windows-1252.
 *
 * O sinal de que a tentativa falhou é o caractere de substituição: quando o
 * texto tem `�`, o arquivo não era UTF-8.
 */
function decodificar(bytes: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  if (!utf8.includes("�")) return utf8;
  return new TextDecoder("windows-1252").decode(bytes);
}

function normalizarCabecalho(cabecalho: string): string {
  return slugify(cabecalho).replace(/-/g, "_");
}

const TIPOS: Record<string, QuestionType> = {
  multipla: "MULTIPLE_CHOICE",
  multipla_escolha: "MULTIPLE_CHOICE",
  certo_errado: "TRUE_FALSE",
  certo_ou_errado: "TRUE_FALSE",
};

const STATUS: Record<string, QuestionStatus> = {
  rascunho: "DRAFT",
  revisao: "REVIEW",
  publicada: "PUBLISHED",
  publicado: "PUBLISHED",
  desativada: "DISABLED",
};

const DIFICULDADES: Record<string, Difficulty> = {
  facil: "EASY",
  media: "MEDIUM",
  medio: "MEDIUM",
  dificil: "HARD",
};

const LETRAS: Letter[] = ["A", "B", "C", "D", "E"];

function chave(valor: string | undefined): string {
  return slugify(valor ?? "").replace(/-/g, "_");
}

type Preparada = {
  linha: number;
  codigo: number | null;
  tipo: QuestionType;
  enunciado: string;
  comentario: string;
  gabarito: Letter;
  alternativas: { letra: Letter; texto: string }[];
  subjectId: string;
  topicId: string | null;
  subtopicId: string | null;
  bancaNome: string | null;
  ano: number | null;
  origem: string | null;
  dificuldade: Difficulty | null;
  status: QuestionStatus;
};

/** Índice da taxonomia por slug, para casar os nomes vindos da planilha. */
async function indexarTaxonomia() {
  const materias = await prisma.subject.findMany({
    select: {
      id: true,
      slug: true,
      topics: {
        select: {
          id: true,
          slug: true,
          subtopics: { select: { id: true, slug: true } },
        },
      },
    },
  });

  const porMateria = new Map<
    string,
    {
      id: string;
      assuntos: Map<string, { id: string; subassuntos: Map<string, string> }>;
    }
  >();

  for (const materia of materias) {
    porMateria.set(materia.slug, {
      id: materia.id,
      assuntos: new Map(
        materia.topics.map((assunto) => [
          assunto.slug,
          {
            id: assunto.id,
            subassuntos: new Map(
              assunto.subtopics.map((sub) => [sub.slug, sub.id]),
            ),
          },
        ]),
      ),
    });
  }

  return porMateria;
}

export async function processarCsv(
  conteudo: ArrayBuffer,
  gravar: boolean,
): Promise<ResultadoImportacao> {
  const texto = decodificar(conteudo);

  const analise = Papa.parse<Linha>(texto, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizarCabecalho,
  });

  const linhas = analise.data;
  const problemas: ProblemaLinha[] = [];
  const preparadas: Preparada[] = [];

  const taxonomia = await indexarTaxonomia();

  const bancasExistentes = new Map(
    (await prisma.board.findMany({ select: { id: true, slug: true, name: true } })).map(
      (b) => [b.slug, b],
    ),
  );

  linhas.forEach((linha, indice) => {
    // +2: a linha 1 é o cabeçalho e as pessoas contam a partir de 1.
    const numero = indice + 2;
    const erro = (mensagem: string) => problemas.push({ linha: numero, mensagem });

    const enunciado = sanitizarHtml(linha.enunciado);
    if (vazioAposSanitizar(enunciado)) {
      erro("Enunciado vazio.");
      return;
    }

    const tipo = linha.tipo ? TIPOS[chave(linha.tipo)] : "MULTIPLE_CHOICE";
    if (!tipo) {
      erro(`Tipo "${linha.tipo}" desconhecido. Use "multipla" ou "certo_errado".`);
      return;
    }

    // Gabarito aceita a letra ou, em certo/errado, a palavra.
    const bruto = chave(linha.gabarito);
    let gabarito: Letter | null = null;

    if (tipo === "TRUE_FALSE") {
      if (bruto === "certo" || bruto === "a") gabarito = "A";
      else if (bruto === "errado" || bruto === "b") gabarito = "B";
    } else if (LETRAS.includes(bruto.toUpperCase() as Letter)) {
      gabarito = bruto.toUpperCase() as Letter;
    }

    if (!gabarito) {
      erro(`Gabarito "${linha.gabarito ?? ""}" inválido para o tipo informado.`);
      return;
    }

    const alternativas =
      tipo === "TRUE_FALSE"
        ? [
            { letra: "A" as Letter, texto: "Certo" },
            { letra: "B" as Letter, texto: "Errado" },
          ]
        : LETRAS.map((letra) => ({
            letra,
            texto: sanitizarHtml(linha[`alternativa_${letra.toLowerCase()}`]),
          })).filter((a) => a.texto.length > 0);

    if (tipo === "MULTIPLE_CHOICE" && alternativas.length < 2) {
      erro("Menos de duas alternativas preenchidas.");
      return;
    }

    if (!alternativas.some((a) => a.letra === gabarito)) {
      erro(`Gabarito ${gabarito} aponta para uma alternativa vazia.`);
      return;
    }

    const materia = taxonomia.get(slugify(linha.materia ?? ""));
    if (!materia) {
      erro(
        `Matéria "${linha.materia ?? ""}" não existe. Cadastre-a em Taxonomia antes de importar.`,
      );
      return;
    }

    let topicId: string | null = null;
    let subtopicId: string | null = null;

    if (linha.assunto) {
      const assunto = materia.assuntos.get(slugify(linha.assunto));
      if (!assunto) {
        erro(`Assunto "${linha.assunto}" não existe nessa matéria.`);
        return;
      }
      topicId = assunto.id;

      if (linha.subassunto) {
        const sub = assunto.subassuntos.get(slugify(linha.subassunto));
        if (!sub) {
          erro(`Subassunto "${linha.subassunto}" não existe nesse assunto.`);
          return;
        }
        subtopicId = sub;
      }
    } else if (linha.subassunto) {
      erro("Subassunto informado sem assunto.");
      return;
    }

    const status = linha.status ? STATUS[chave(linha.status)] : "DRAFT";
    if (!status) {
      erro(`Status "${linha.status}" desconhecido.`);
      return;
    }

    const comentario = sanitizarHtml(linha.comentario);
    if (status === "PUBLISHED" && vazioAposSanitizar(comentario)) {
      erro("Não é possível publicar sem comentário.");
      return;
    }

    const dificuldade = linha.dificuldade
      ? (DIFICULDADES[chave(linha.dificuldade)] ?? null)
      : null;

    if (linha.dificuldade && !dificuldade) {
      erro(`Dificuldade "${linha.dificuldade}" desconhecida.`);
      return;
    }

    const ano = linha.ano ? Number(linha.ano) : null;
    if (ano !== null && (!Number.isInteger(ano) || ano < 1980 || ano > 2100)) {
      erro(`Ano "${linha.ano}" inválido.`);
      return;
    }

    const codigo = linha.codigo ? Number(linha.codigo) : null;
    if (codigo !== null && (!Number.isInteger(codigo) || codigo < 1)) {
      erro(`Código "${linha.codigo}" inválido.`);
      return;
    }

    preparadas.push({
      linha: numero,
      codigo,
      tipo,
      enunciado,
      comentario,
      gabarito,
      alternativas,
      subjectId: materia.id,
      topicId,
      subtopicId,
      bancaNome: linha.banca?.trim() || null,
      ano,
      origem: linha.origem?.trim() || null,
      dificuldade,
      status,
    });
  });

  const base: ResultadoImportacao = {
    totalLinhas: linhas.length,
    validas: preparadas.length,
    problemas,
  };

  if (!gravar || preparadas.length === 0) return base;

  // ------------------------------------------------------------------
  // Gravação
  // ------------------------------------------------------------------

  const bancasCriadas: string[] = [];

  // Banca ausente é criada — é o que `docs/MIGRACAO.md` já previa. Matéria não:
  // criar taxonomia a partir de erro de digitação é como a classificação apodrece.
  for (const preparada of preparadas) {
    if (!preparada.bancaNome) continue;
    const slug = slugify(preparada.bancaNome);
    if (bancasExistentes.has(slug)) continue;

    const criada = await prisma.board.create({
      data: { name: preparada.bancaNome, slug },
      select: { id: true, slug: true, name: true },
    });

    bancasExistentes.set(slug, criada);
    bancasCriadas.push(criada.name);
  }

  let criadas = 0;
  let atualizadas = 0;
  let usouCodigoExplicito = false;

  for (const p of preparadas) {
    const boardId = p.bancaNome
      ? (bancasExistentes.get(slugify(p.bancaNome))?.id ?? null)
      : null;

    const comuns = {
      type: p.tipo,
      statement: p.enunciado,
      explanation: p.comentario,
      answerKey: p.gabarito,
      status: p.status,
      subjectId: p.subjectId,
      topicId: p.topicId,
      subtopicId: p.subtopicId,
      boardId,
      year: p.ano,
      source: p.origem,
      difficulty: p.dificuldade,
      publishedAt: p.status === "PUBLISHED" ? new Date() : null,
    };

    const existente = p.codigo
      ? await prisma.question.findUnique({
          where: { code: p.codigo },
          select: { id: true },
        })
      : null;

    let questionId: string;

    if (existente) {
      await prisma.question.update({ where: { id: existente.id }, data: comuns });
      await prisma.alternative.deleteMany({ where: { questionId: existente.id } });
      questionId = existente.id;
      atualizadas++;
    } else {
      const criada = await prisma.question.create({
        data: p.codigo ? { ...comuns, code: p.codigo } : comuns,
        select: { id: true },
      });
      questionId = criada.id;
      criadas++;
      if (p.codigo) usouCodigoExplicito = true;
    }

    await prisma.alternative.createMany({
      data: p.alternativas.map((a) => ({
        questionId,
        letter: a.letra,
        text: a.texto,
      })),
    });
  }

  // `questions.code` é SERIAL. Inserir um valor explícito NÃO avança a
  // sequência, então a próxima questão criada pela tela nasceria com um código
  // já ocupado e estouraria o índice único. Realinhar aqui é o que impede isso.
  if (usouCodigoExplicito) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('questions', 'code'), COALESCE((SELECT MAX(code) FROM questions), 1))`,
    );
  }

  return {
    ...base,
    criadas,
    atualizadas,
    bancasCriadas,
    sequenciaAjustada: usouCodigoExplicito,
  };
}
