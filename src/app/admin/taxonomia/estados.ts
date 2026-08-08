/**
 * Estados e tipos das actions de taxonomia.
 *
 * Ficam fora de [`acoes.ts`](./acoes.ts) porque arquivo `"use server"` só pode
 * exportar funções assíncronas.
 */
export const NIVEIS = ["materia", "assunto", "subassunto", "banca"] as const;

export type Nivel = (typeof NIVEIS)[number];

export const ROTULO_NIVEL: Record<Nivel, string> = {
  materia: "matéria",
  assunto: "assunto",
  subassunto: "subassunto",
  banca: "banca",
};

export type EstadoTaxonomia = { erro?: string; sucesso?: string };

export const TAXONOMIA_INICIAL: EstadoTaxonomia = {};
