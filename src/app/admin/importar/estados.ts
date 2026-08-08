/**
 * Estado da importação por CSV.
 *
 * Fora de [`acoes.ts`](./acoes.ts) porque arquivo `"use server"` só pode
 * exportar funções assíncronas.
 */
import type { ResultadoImportacao } from "@/lib/questoes/importar";

export type EstadoImportacao = {
  erro?: string;
  resultado?: ResultadoImportacao;
  /** `false` quando foi apenas conferência. */
  gravou?: boolean;
};

export const IMPORTACAO_INICIAL: EstadoImportacao = {};
