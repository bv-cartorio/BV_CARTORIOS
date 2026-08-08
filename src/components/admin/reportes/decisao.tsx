"use client";

import { useActionState, useState } from "react";

import { decidirReporte } from "@/app/admin/reportes/acoes";
import type { ReportStatus } from "@/generated/prisma/enums";

type DecisaoProps = {
  id: string;
  situacao: ReportStatus;
};

const BOTAO =
  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50";

export function Decisao({ id, situacao }: DecisaoProps) {
  const [estado, decidir, pendente] = useActionState(decidirReporte, {});
  const [fechando, setFechando] = useState<ReportStatus | null>(null);

  if (situacao === "RESOLVED" || situacao === "REJECTED") {
    return (
      <form action={decidir} className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="situacao" value="OPEN" />
        <button
          type="submit"
          disabled={pendente}
          className={`${BOTAO} text-marinho-500 hover:bg-creme hover:text-marinho-900`}
        >
          Reabrir
        </button>
      </form>
    );
  }

  if (fechando) {
    return (
      <form action={decidir} className="w-full space-y-2">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="situacao" value={fechando} />

        <textarea
          name="nota"
          rows={2}
          maxLength={1000}
          autoFocus
          placeholder={
            fechando === "RESOLVED"
              ? "O que foi corrigido? (fica no histórico do reporte)"
              : "Por que o reporte não procede?"
          }
          className="block w-full rounded-lg border border-creme-200 px-3 py-2 text-sm text-marinho-900 outline-none placeholder:text-marinho-300 focus:border-marinho-400 focus:ring-2 focus:ring-marinho-100"
        />

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pendente}
            className={`${BOTAO} bg-marinho-700 text-white hover:bg-marinho-800`}
          >
            {pendente
              ? "Salvando..."
              : fechando === "RESOLVED"
                ? "Marcar como resolvido"
                : "Rejeitar"}
          </button>

          <button
            type="button"
            onClick={() => setFechando(null)}
            className={`${BOTAO} text-marinho-500 hover:text-marinho-900`}
          >
            Cancelar
          </button>

          {estado.erro && (
            <span role="alert" className="text-xs text-laranja-600">
              {estado.erro}
            </span>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {situacao === "OPEN" && (
        <form action={decidir}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="situacao" value="IN_REVIEW" />
          <button
            type="submit"
            disabled={pendente}
            className={`${BOTAO} text-marinho-500 hover:bg-creme hover:text-marinho-900`}
          >
            Pegar para análise
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={() => setFechando("RESOLVED")}
        className={`${BOTAO} text-marinho-700 hover:bg-marinho-50`}
      >
        Resolver
      </button>

      <button
        type="button"
        onClick={() => setFechando("REJECTED")}
        className={`${BOTAO} text-marinho-400 hover:bg-laranja-50 hover:text-laranja-700`}
      >
        Rejeitar
      </button>
    </div>
  );
}
