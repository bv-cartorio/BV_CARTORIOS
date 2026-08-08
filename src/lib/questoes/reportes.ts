/**
 * Fila de erros reportados pelos alunos.
 *
 * O módulo 2 já grava `QuestionReport` desde que o aluno tem como reportar;
 * até aqui nada consumia essa fila. É esta tela que fecha o ciclo.
 */
import type { ReportStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const REPORTES_POR_PAGINA = 20;

export type ReporteLista = {
  id: string;
  motivo: string;
  mensagem: string | null;
  situacao: ReportStatus;
  criadoEm: Date;
  resolvidoEm: Date | null;
  notaDeResolucao: string | null;
  aluno: string;
  resolvidoPor: string | null;
  questao: {
    id: string;
    codigo: number;
    resumo: string;
    gabarito: string;
  };
};

function resumir(html: string, limite = 200): string {
  const texto = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return texto.length > limite ? `${texto.slice(0, limite)}…` : texto;
}

export async function buscarReportes(
  situacao: ReportStatus | "TODOS",
  pagina: number,
) {
  const where = situacao === "TODOS" ? {} : { status: situacao };

  const [total, registros] = await Promise.all([
    prisma.questionReport.count({ where }),
    prisma.questionReport.findMany({
      where,
      // Os abertos primeiro, e dentro de cada grupo o mais antigo antes: quem
      // reportou há mais tempo espera há mais tempo.
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      skip: (pagina - 1) * REPORTES_POR_PAGINA,
      take: REPORTES_POR_PAGINA,
      select: {
        id: true,
        reason: true,
        message: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        resolutionNote: true,
        user: { select: { name: true, email: true } },
        resolvedBy: { select: { name: true } },
        question: {
          select: {
            id: true,
            code: true,
            statement: true,
            answerKey: true,
          },
        },
      },
    }),
  ]);

  return {
    reportes: registros.map<ReporteLista>((r) => ({
      id: r.id,
      motivo: r.reason,
      mensagem: r.message,
      situacao: r.status,
      criadoEm: r.createdAt,
      resolvidoEm: r.resolvedAt,
      notaDeResolucao: r.resolutionNote,
      aluno: `${r.user.name} (${r.user.email})`,
      resolvidoPor: r.resolvedBy?.name ?? null,
      questao: {
        id: r.question.id,
        codigo: r.question.code,
        resumo: resumir(r.question.statement),
        gabarito: r.question.answerKey,
      },
    })),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / REPORTES_POR_PAGINA)),
  };
}
