/**
 * Estados das actions de questão.
 *
 * Fora de [`acoes.ts`](./acoes.ts) porque arquivo `"use server"` só pode
 * exportar funções assíncronas.
 */
export type EstadoQuestao = {
  erro?: string;
  /** Preenchido quando a gravação corrigiu respostas antigas de alunos. */
  aviso?: string;
};

export const QUESTAO_INICIAL: EstadoQuestao = {};

/** O que o botão de envio pede. O status final é decidido no servidor. */
export const ACOES_SALVAR = [
  "rascunho",
  "revisao",
  "publicar",
  "desativar",
] as const;

export type AcaoSalvar = (typeof ACOES_SALVAR)[number];
