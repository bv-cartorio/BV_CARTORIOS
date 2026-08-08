"use client";

import { useEffect, useRef } from "react";

type DialogoProps = {
  aberto: boolean;
  titulo: string;
  aoFechar: () => void;
  children: React.ReactNode;
};

/**
 * Diálogo modal sobre o `<dialog>` nativo.
 *
 * O elemento nativo já entrega foco preso, fechamento pelo Esc e a camada de
 * topo — três coisas que uma reimplementação em `div` costuma errar.
 */
export function Dialogo({ aberto, titulo, aoFechar, children }: DialogoProps) {
  const referencia = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = referencia.current;
    if (!dialogo) return;

    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  return (
    <dialog
      ref={referencia}
      // `onClose` cobre também o Esc, que fecha o elemento sem passar por aqui.
      onClose={aoFechar}
      onClick={(evento) => {
        // Clique no fundo tem o próprio `<dialog>` como alvo.
        if (evento.target === referencia.current) aoFechar();
      }}
      aria-label={titulo}
      className="w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-creme-200 bg-white p-0 text-marinho-800 shadow-xl backdrop:bg-marinho-900/40"
    >
      <div className="flex items-start justify-between gap-4 border-b border-creme-200 px-5 py-4">
        <h2 className="font-semibold text-marinho-800">{titulo}</h2>

        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="-m-1 rounded-lg p-1 text-marinho-400 transition-colors hover:bg-creme hover:text-marinho-700"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
