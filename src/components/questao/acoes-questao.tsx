"use client";

import { useState, useTransition } from "react";

import { alternarFavorita } from "@/app/painel/questoes/acoes";
import { Anotacao } from "@/components/questao/anotacao";
import { Reportar } from "@/components/questao/reportar";

type AcoesQuestaoProps = {
  questionId: string;
  codigo: number;
  favoritaInicial: boolean;
  anotacaoInicial: string | null;
};

const BOTAO =
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors";

const NEUTRO = `${BOTAO} text-marinho-600 hover:bg-creme hover:text-marinho-900`;

/** Favoritar, anotar e reportar erro. */
export function AcoesQuestao({
  questionId,
  codigo,
  favoritaInicial,
  anotacaoInicial,
}: AcoesQuestaoProps) {
  const [favorita, setFavorita] = useState(favoritaInicial);
  const [, iniciar] = useTransition();
  const [anotando, setAnotando] = useState(false);
  const [reportando, setReportando] = useState(false);

  function alternar() {
    // Vira na hora e o servidor confirma logo em seguida: favoritar é
    // reversível e barato, não vale prender a interface esperando a resposta.
    setFavorita((atual) => !atual);

    iniciar(async () => {
      const resultado = await alternarFavorita(questionId);
      setFavorita(resultado.favorita);
    });
  }

  const temAnotacao = Boolean(anotacaoInicial);

  return (
    <div className="mt-5 border-t border-creme-200 pt-3">
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={alternar}
          aria-pressed={favorita}
          className={
            favorita
              ? `${BOTAO} text-laranja-600 hover:bg-laranja-50`
              : NEUTRO
          }
        >
          <svg
            viewBox="0 0 20 20"
            fill={favorita ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M10 2.5l2.3 4.7 5.2.75-3.75 3.65.9 5.15L10 14.3l-4.65 2.45.9-5.15L1.5 7.95l5.2-.75L10 2.5z" />
          </svg>
          {favorita ? "Favoritada" : "Favoritar"}
        </button>

        <button
          type="button"
          onClick={() => setAnotando((aberto) => !aberto)}
          aria-expanded={anotando}
          className={NEUTRO}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M4 3.5h12v13l-3-2-3 2-3-2-3 2v-13z" />
            <path d="M7.5 7.5h5M7.5 10.5h5" />
          </svg>
          {temAnotacao ? "Ver anotação" : "Anotar"}
        </button>

        <button
          type="button"
          onClick={() => setReportando(true)}
          className={NEUTRO}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M4.5 17V3.5h11l-2 3.25 2 3.25h-11" />
          </svg>
          Reportar erro
        </button>
      </div>

      {anotando && (
        <Anotacao
          questionId={questionId}
          codigo={codigo}
          inicial={anotacaoInicial}
        />
      )}

      <Reportar
        questionId={questionId}
        codigo={codigo}
        aberto={reportando}
        aoFechar={() => setReportando(false)}
      />
    </div>
  );
}
