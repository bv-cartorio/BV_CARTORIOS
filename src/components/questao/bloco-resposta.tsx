"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo } from "react";

import { responder } from "@/app/painel/questoes/acoes";
import { RESPOSTA_INICIAL } from "@/app/painel/questoes/estados";
import { Alternativas } from "@/components/questao/alternativas";
import { useCota } from "@/components/questao/cota";
import { Resolucao } from "@/components/questao/resolucao";
import type {
  Alternativa,
  MinhaResposta,
  Resolucao as DadosResolucao,
} from "@/lib/questoes/consulta";

type BlocoRespostaProps = {
  questionId: string;
  codigo: number;
  alternativas: Alternativa[];
  /** Resposta que veio do servidor; `null` quando o aluno pediu para refazer. */
  respostaAnterior: MinhaResposta | null;
  resolucaoAnterior: DadosResolucao | null;
  aoRefazer: () => void;
};

/**
 * Resolução de uma questão: alternativas, envio e retorno.
 *
 * Este bloco é remontado a cada "responder de novo" (o pai troca a `key`), o
 * que zera o estado da action sem precisar de um botão de reset que o
 * `useActionState` não oferece.
 */
export function BlocoResposta({
  questionId,
  codigo,
  alternativas,
  respostaAnterior,
  resolucaoAnterior,
  aoRefazer,
}: BlocoRespostaProps) {
  const { registrar } = useCota();
  const acao = useMemo(() => responder.bind(null, questionId), [questionId]);
  const [estado, enviar, pendente] = useActionState(acao, RESPOSTA_INICIAL);

  useEffect(() => {
    if (estado.situacao === "respondida") registrar(estado.restantes);
    if (estado.situacao === "erro" && estado.cotaEsgotada) registrar(0);
  }, [estado, registrar]);

  const resolvida =
    estado.situacao === "respondida"
      ? {
          letra: estado.letra,
          acertei: estado.acertei,
          dados: estado.resolucao,
        }
      : respostaAnterior && resolucaoAnterior
        ? {
            letra: respostaAnterior.letra,
            acertei: respostaAnterior.acertei,
            dados: resolucaoAnterior,
          }
        : null;

  if (resolvida) {
    return (
      <>
        <Alternativas
          codigo={codigo}
          alternativas={alternativas}
          resultado={{
            minhaLetra: resolvida.letra,
            gabarito: resolvida.dados.gabarito,
          }}
        />

        <Resolucao
          codigo={codigo}
          minhaLetra={resolvida.letra}
          acertei={resolvida.acertei}
          dados={resolvida.dados}
        />

        <button
          type="button"
          onClick={aoRefazer}
          className="mt-5 rounded-lg border border-creme-200 px-4 py-2 text-sm font-medium text-marinho-700 transition-colors hover:border-marinho-200 hover:text-marinho-900"
        >
          Responder de novo
        </button>
      </>
    );
  }

  const cotaEsgotada = estado.situacao === "erro" && estado.cotaEsgotada;

  return (
    <form action={enviar}>
      <Alternativas codigo={codigo} alternativas={alternativas} />

      {estado.situacao === "erro" && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-laranja-200 bg-laranja-50 px-4 py-3 text-sm text-laranja-700"
        >
          {estado.mensagem}
          {cotaEsgotada && (
            <>
              {" "}
              <Link href="/assinatura" className="font-medium underline">
                Assine para continuar estudando sem limite
              </Link>
              , ou volte amanhã.
            </>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="mt-4 rounded-lg bg-laranja-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-laranja-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendente ? "Conferindo..." : "Responder"}
      </button>
    </form>
  );
}
