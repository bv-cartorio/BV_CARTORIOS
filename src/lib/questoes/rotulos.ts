/**
 * Rótulos em pt-BR dos enums do domínio.
 *
 * Models e enums ficam em inglês (convenção do projeto); tudo que a pessoa lê
 * vem daqui. Arquivo sem dependência de servidor de propósito — é importado
 * tanto por página quanto por componente de cliente.
 */
import type {
  Difficulty,
  QuestionStatus,
  QuestionType,
  ReportReason,
  ReportStatus,
} from "@/generated/prisma/enums";

export const ROTULO_STATUS: Record<QuestionStatus, string> = {
  DRAFT: "Rascunho",
  REVIEW: "Em revisão",
  PUBLISHED: "Publicada",
  DISABLED: "Desativada",
};

export const ROTULO_DIFICULDADE: Record<Difficulty, string> = {
  EASY: "Fácil",
  MEDIUM: "Média",
  HARD: "Difícil",
};

export const ROTULO_TIPO: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Múltipla escolha (A a E)",
  TRUE_FALSE: "Certo ou errado",
};

export const ROTULO_MOTIVO: Record<ReportReason, string> = {
  WRONG_ANSWER_KEY: "Gabarito incorreto",
  TYPO: "Erro de digitação",
  OUTDATED: "Legislação ou jurisprudência desatualizada",
  BAD_CLASSIFICATION: "Matéria ou assunto errado",
  BROKEN_MEDIA: "Imagem ou vídeo com problema",
  OTHER: "Outro",
};

export const ROTULO_SITUACAO_REPORTE: Record<ReportStatus, string> = {
  OPEN: "Aberto",
  IN_REVIEW: "Em análise",
  RESOLVED: "Resolvido",
  REJECTED: "Rejeitado",
};

/** Texto e cor de cada status, para as etiquetas das listagens. */
export const ESTILO_STATUS: Record<QuestionStatus, string> = {
  DRAFT: "bg-creme text-marinho-600",
  REVIEW: "bg-laranja-100 text-laranja-700",
  PUBLISHED: "bg-marinho-100 text-marinho-800",
  DISABLED: "bg-creme-200 text-marinho-500",
};
