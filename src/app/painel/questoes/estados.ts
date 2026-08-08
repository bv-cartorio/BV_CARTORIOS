/**
 * Estados das server actions da área de questões.
 *
 * Ficam fora de [`acoes.ts`](./acoes.ts) porque um arquivo `"use server"` só
 * pode exportar funções assíncronas — constante e tipo precisam de outra casa.
 */
import type { Letter } from "@/generated/prisma/enums";
import type { Resolucao } from "@/lib/questoes/consulta";

export type EstadoResposta =
  | { situacao: "inicial" }
  | { situacao: "erro"; mensagem: string; cotaEsgotada?: boolean }
  | {
      situacao: "respondida";
      letra: Letter;
      acertei: boolean;
      resolucao: Resolucao;
      /** Saldo da cota gratuita depois desta resposta; `null` para assinante. */
      restantes: number | null;
    };

export const RESPOSTA_INICIAL: EstadoResposta = { situacao: "inicial" };

export type EstadoAnotacao = {
  erro?: string;
  salva?: boolean;
  /** Conteúdo em vigor depois da ação — vazio quando a anotação foi apagada. */
  conteudo?: string;
};

export const ANOTACAO_INICIAL: EstadoAnotacao = {};

export type EstadoReporte = { erro?: string; enviado?: boolean };

export const REPORTE_INICIAL: EstadoReporte = {};
