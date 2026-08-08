/**
 * Consultas do acervo pela ótica da administração.
 *
 * Separado de [`consulta.ts`](./consulta.ts) de propósito: lá o `where` fixa
 * `status: PUBLISHED` e esconde o gabarito até a resposta, que é exatamente o
 * que o aluno precisa e exatamente o que atrapalha aqui. Enfiar um `if` na
 * consulta do aluno para servir aos dois seria o começo de um vazamento.
 */
import type { Prisma } from "@/generated/prisma/client";
import type { QuestionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const QUESTOES_POR_PAGINA_ADMIN = 20;

export type FiltrosAdmin = {
  status?: QuestionStatus;
  materia?: string;
  banca?: string;
  q?: string;
  pagina: number;
};

export type QuestaoAdminLista = {
  id: string;
  codigo: number;
  resumo: string;
  status: QuestionStatus;
  materia: string;
  assunto: string | null;
  banca: string | null;
  ano: number | null;
  respostas: number;
  reportesAbertos: number;
  atualizadaEm: Date;
};

function montarWhereAdmin(filtros: FiltrosAdmin): Prisma.QuestionWhereInput {
  const where: Prisma.QuestionWhereInput = {};

  if (filtros.status) where.status = filtros.status;
  if (filtros.materia) where.subjectId = filtros.materia;
  if (filtros.banca) where.boardId = filtros.banca;

  if (filtros.q) {
    const codigo = Number(filtros.q);
    const alternativas: Prisma.QuestionWhereInput[] = [
      { statement: { contains: filtros.q, mode: "insensitive" } },
      { explanation: { contains: filtros.q, mode: "insensitive" } },
      { source: { contains: filtros.q, mode: "insensitive" } },
    ];

    if (Number.isInteger(codigo) && codigo > 0) {
      alternativas.unshift({ code: codigo });
    }

    where.OR = alternativas;
  }

  return where;
}

/** Primeiras palavras do enunciado, sem marcação, para a listagem. */
function resumir(html: string, limite = 160): string {
  const texto = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  return texto.length > limite ? `${texto.slice(0, limite)}…` : texto;
}

export async function buscarQuestoesAdmin(filtros: FiltrosAdmin) {
  const where = montarWhereAdmin(filtros);

  const [total, registros] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      // Editar é trabalho de fila: o que mexeu por último vem primeiro.
      orderBy: { updatedAt: "desc" },
      skip: (filtros.pagina - 1) * QUESTOES_POR_PAGINA_ADMIN,
      take: QUESTOES_POR_PAGINA_ADMIN,
      select: {
        id: true,
        code: true,
        statement: true,
        status: true,
        year: true,
        updatedAt: true,
        subject: { select: { name: true } },
        topic: { select: { name: true } },
        board: { select: { name: true } },
        _count: { select: { answers: true } },
        reports: {
          where: { status: { in: ["OPEN", "IN_REVIEW"] } },
          select: { id: true },
        },
      },
    }),
  ]);

  return {
    questoes: registros.map<QuestaoAdminLista>((q) => ({
      id: q.id,
      codigo: q.code,
      resumo: resumir(q.statement),
      status: q.status,
      materia: q.subject.name,
      assunto: q.topic?.name ?? null,
      banca: q.board?.name ?? null,
      ano: q.year,
      respostas: q._count.answers,
      reportesAbertos: q.reports.length,
      atualizadaEm: q.updatedAt,
    })),
    total,
    pagina: filtros.pagina,
    paginas: Math.max(1, Math.ceil(total / QUESTOES_POR_PAGINA_ADMIN)),
  };
}

/** Questão completa para o formulário de edição. */
export async function obterQuestaoParaEdicao(id: string) {
  const questao = await prisma.question.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      type: true,
      statement: true,
      explanation: true,
      answerKey: true,
      status: true,
      difficulty: true,
      year: true,
      source: true,
      videoId: true,
      videoProvider: true,
      subjectId: true,
      topicId: true,
      subtopicId: true,
      boardId: true,
      publishedAt: true,
      alternatives: {
        orderBy: { letter: "asc" },
        select: { letter: true, text: true },
      },
      _count: { select: { answers: true } },
    },
  });

  return questao;
}

export type QuestaoParaEdicao = NonNullable<
  Awaited<ReturnType<typeof obterQuestaoParaEdicao>>
>;
