"use client";

import { useState, useTransition } from "react";

import { alterarStatus, excluirQuestao } from "@/app/admin/questoes/acoes";
import { Dialogo } from "@/components/ui/dialogo";
import type { QuestionStatus } from "@/generated/prisma/enums";

type AcoesLinhaProps = {
  id: string;
  codigo: number;
  status: QuestionStatus;
  respostas: number;
};

const BOTAO =
  "rounded-md px-2 py-1 text-xs font-medium text-marinho-500 transition-colors hover:bg-creme hover:text-marinho-900 disabled:opacity-40";

export function AcoesLinha({ id, codigo, status, respostas }: AcoesLinhaProps) {
  const [pendente, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function mudar(novo: QuestionStatus) {
    iniciar(async () => {
      await alterarStatus(id, novo);
    });
  }

  function apagar() {
    setErro(null);
    iniciar(async () => {
      const resultado = await excluirQuestao(id);
      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }
      setConfirmando(false);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status !== "PUBLISHED" && (
        <button
          type="button"
          disabled={pendente}
          onClick={() => mudar("PUBLISHED")}
          className={BOTAO}
        >
          Publicar
        </button>
      )}

      {status === "PUBLISHED" && (
        <button
          type="button"
          disabled={pendente}
          onClick={() => mudar("DISABLED")}
          className={BOTAO}
        >
          Desativar
        </button>
      )}

      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="rounded-md px-2 py-1 text-xs font-medium text-marinho-400 transition-colors hover:bg-laranja-50 hover:text-laranja-700"
      >
        Excluir
      </button>

      <Dialogo
        aberto={confirmando}
        titulo={`Excluir a questão ${codigo}`}
        aoFechar={() => setConfirmando(false)}
      >
        {respostas > 0 ? (
          <p className="text-sm text-marinho-700">
            Esta questão já foi respondida{" "}
            <strong className="font-semibold">{respostas}</strong>{" "}
            {respostas === 1 ? "vez" : "vezes"}. Apagá-la levaria junto o
            histórico desses alunos, então a exclusão está bloqueada. Use{" "}
            <strong className="font-semibold">Desativar</strong> para tirá-la de
            circulação preservando as estatísticas.
          </p>
        ) : (
          <p className="text-sm text-marinho-700">
            Nenhum aluno respondeu esta questão. A exclusão é definitiva.
          </p>
        )}

        {erro && (
          <p role="alert" className="mt-3 text-sm text-laranja-600">
            {erro}
          </p>
        )}

        <div className="mt-4 flex items-center gap-3">
          {respostas === 0 && (
            <button
              type="button"
              disabled={pendente}
              onClick={apagar}
              className="rounded-lg bg-laranja-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-laranja-600 disabled:opacity-60"
            >
              {pendente ? "Excluindo..." : "Excluir"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-marinho-600 hover:text-marinho-900"
          >
            Fechar
          </button>
        </div>
      </Dialogo>
    </div>
  );
}
