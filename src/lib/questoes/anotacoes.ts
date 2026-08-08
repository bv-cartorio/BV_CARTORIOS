/**
 * Anotações pessoais do aluno, com a questão que cada uma acompanha.
 *
 * Traz o enunciado, mas nunca alternativas, gabarito ou comentário: esta tela é
 * de revisão do que o aluno escreveu, não um atalho para ver a resposta sem
 * responder.
 */
import { prisma } from "@/lib/prisma";

export const ANOTACOES_POR_PAGINA = 10;

export type AnotacaoLista = {
  questionId: string;
  codigo: number;
  enunciado: string;
  materia: string;
  assunto: string | null;
  subassunto: string | null;
  banca: string | null;
  ano: number | null;
  conteudo: string;
  atualizadaEm: Date;
};

export type PaginaDeAnotacoes = {
  anotacoes: AnotacaoLista[];
  total: number;
  pagina: number;
  paginas: number;
};

export async function buscarAnotacoes(
  userId: string,
  pagina: number,
): Promise<PaginaDeAnotacoes> {
  // Questão despublicada some da lista: a anotação segue no banco, mas apontar
  // para uma questão que o aluno não consegue abrir só geraria confusão.
  const where = { userId, question: { status: "PUBLISHED" as const } };

  const [total, registros] = await Promise.all([
    prisma.questionNote.count({ where }),
    prisma.questionNote.findMany({
      where,
      // Mais recente primeiro: revisar começa pelo que se acabou de escrever.
      orderBy: { updatedAt: "desc" },
      skip: (pagina - 1) * ANOTACOES_POR_PAGINA,
      take: ANOTACOES_POR_PAGINA,
      select: {
        content: true,
        updatedAt: true,
        question: {
          select: {
            id: true,
            code: true,
            statement: true,
            year: true,
            subject: { select: { name: true } },
            topic: { select: { name: true } },
            subtopic: { select: { name: true } },
            board: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return {
    anotacoes: registros.map((nota) => ({
      questionId: nota.question.id,
      codigo: nota.question.code,
      enunciado: nota.question.statement,
      materia: nota.question.subject.name,
      assunto: nota.question.topic?.name ?? null,
      subassunto: nota.question.subtopic?.name ?? null,
      banca: nota.question.board?.name ?? null,
      ano: nota.question.year,
      conteudo: nota.content,
      atualizadaEm: nota.updatedAt,
    })),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / ANOTACOES_POR_PAGINA)),
  };
}
