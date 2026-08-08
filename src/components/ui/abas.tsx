"use client";

import { useId, useRef, useState } from "react";

export type Aba = {
  id: string;
  rotulo: string;
  conteudo: React.ReactNode;
};

type AbasProps = {
  abas: Aba[];
  /** Nome do conjunto, lido por quem usa leitor de tela. */
  rotulo: string;
};

/**
 * Abas no padrão ARIA: seta esquerda/direita troca, Home e End vão às pontas e
 * só a aba ativa entra na ordem do Tab. Um `<div role="tablist">` sem isso é
 * uma lista de botões que finge ser abas.
 */
export function Abas({ abas, rotulo }: AbasProps) {
  const base = useId();
  const [ativa, setAtiva] = useState(abas[0]?.id ?? "");
  const botoes = useRef<Record<string, HTMLButtonElement | null>>({});

  const atual = abas.some((aba) => aba.id === ativa) ? ativa : abas[0]?.id;

  function aoTeclar(evento: React.KeyboardEvent<HTMLDivElement>) {
    const indice = abas.findIndex((aba) => aba.id === atual);
    let destino = -1;

    if (evento.key === "ArrowRight") destino = (indice + 1) % abas.length;
    if (evento.key === "ArrowLeft") {
      destino = (indice - 1 + abas.length) % abas.length;
    }
    if (evento.key === "Home") destino = 0;
    if (evento.key === "End") destino = abas.length - 1;

    if (destino < 0) return;

    evento.preventDefault();
    const alvo = abas[destino];
    setAtiva(alvo.id);
    botoes.current[alvo.id]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={rotulo}
        onKeyDown={aoTeclar}
        className="flex flex-wrap gap-1 border-b border-creme-200"
      >
        {abas.map((aba) => {
          const selecionada = aba.id === atual;

          return (
            <button
              key={aba.id}
              type="button"
              role="tab"
              id={`${base}-${aba.id}-aba`}
              aria-selected={selecionada}
              aria-controls={`${base}-${aba.id}-painel`}
              tabIndex={selecionada ? 0 : -1}
              ref={(elemento) => {
                botoes.current[aba.id] = elemento;
              }}
              onClick={() => setAtiva(aba.id)}
              className={`-mb-px rounded-t-lg border-b-2 px-3.5 py-2 text-sm font-medium transition-colors ${
                selecionada
                  ? "border-laranja-500 text-marinho-900"
                  : "border-transparent text-marinho-500 hover:text-marinho-800"
              }`}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>

      {abas.map((aba) => (
        <div
          key={aba.id}
          role="tabpanel"
          id={`${base}-${aba.id}-painel`}
          aria-labelledby={`${base}-${aba.id}-aba`}
          hidden={aba.id !== atual}
          className="pt-4"
        >
          {aba.conteudo}
        </div>
      ))}
    </div>
  );
}
