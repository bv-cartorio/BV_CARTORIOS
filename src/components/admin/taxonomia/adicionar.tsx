"use client";

import { useActionState, useState } from "react";

import { criarItem } from "@/app/admin/taxonomia/acoes";
import {
  ROTULO_NIVEL,
  TAXONOMIA_INICIAL,
  type Nivel,
} from "@/app/admin/taxonomia/estados";

type AdicionarProps = {
  nivel: Nivel;
  /** Matéria (para assunto) ou assunto (para subassunto). */
  paiId?: string;
};

export function Adicionar({ nivel, paiId }: AdicionarProps) {
  const [aberto, setAberto] = useState(false);
  const [estado, criar, pendente] = useActionState(
    criarItem,
    TAXONOMIA_INICIAL,
  );

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-1 rounded-md px-2 py-1 text-xs font-medium text-marinho-500 transition-colors hover:bg-creme hover:text-marinho-900"
      >
        + Adicionar {ROTULO_NIVEL[nivel]}
      </button>
    );
  }

  return (
    <form action={criar} className="mt-1 flex flex-wrap items-center gap-2">
      <input type="hidden" name="nivel" value={nivel} />
      {paiId && <input type="hidden" name="paiId" value={paiId} />}

      <input
        name="nome"
        autoFocus
        required
        maxLength={120}
        placeholder={`Nome do ${ROTULO_NIVEL[nivel]}`}
        className="rounded-lg border border-creme-200 px-2.5 py-1 text-sm text-marinho-900 outline-none placeholder:text-marinho-300 focus:border-marinho-400 focus:ring-2 focus:ring-marinho-100"
      />

      <button
        type="submit"
        disabled={pendente}
        className="rounded-md bg-marinho-700 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-marinho-800 disabled:opacity-60"
      >
        {pendente ? "Criando..." : "Criar"}
      </button>

      <button
        type="button"
        onClick={() => setAberto(false)}
        className="rounded-md px-2 py-1 text-xs font-medium text-marinho-500 hover:text-marinho-900"
      >
        Fechar
      </button>

      {estado.erro && (
        <span role="alert" className="text-xs text-laranja-600">
          {estado.erro}
        </span>
      )}
    </form>
  );
}
