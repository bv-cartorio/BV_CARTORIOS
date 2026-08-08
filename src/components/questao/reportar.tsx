"use client";

import { useActionState, useMemo } from "react";

import { reportarErro } from "@/app/painel/questoes/acoes";
import { REPORTE_INICIAL } from "@/app/painel/questoes/estados";
import { Dialogo } from "@/components/ui/dialogo";
import { Selecao } from "@/components/ui/selecao";
import type { ReportReason } from "@/generated/prisma/enums";

/** Rótulos em pt-BR do enum `ReportReason`. */
const MOTIVOS: { valor: ReportReason; rotulo: string }[] = [
  { valor: "WRONG_ANSWER_KEY", rotulo: "Gabarito incorreto" },
  { valor: "TYPO", rotulo: "Erro de digitação no enunciado ou comentário" },
  { valor: "OUTDATED", rotulo: "Legislação ou jurisprudência desatualizada" },
  { valor: "BAD_CLASSIFICATION", rotulo: "Matéria ou assunto errado" },
  { valor: "BROKEN_MEDIA", rotulo: "Imagem ou vídeo com problema" },
  { valor: "OTHER", rotulo: "Outro" },
];

type ReportarProps = {
  questionId: string;
  codigo: number;
  aberto: boolean;
  aoFechar: () => void;
};

export function Reportar({
  questionId,
  codigo,
  aberto,
  aoFechar,
}: ReportarProps) {
  const acao = useMemo(() => reportarErro.bind(null, questionId), [questionId]);
  const [estado, enviar, pendente] = useActionState(acao, REPORTE_INICIAL);

  return (
    <Dialogo
      aberto={aberto}
      titulo={`Reportar erro na questão ${codigo}`}
      aoFechar={aoFechar}
    >
      {estado.enviado ? (
        <div className="space-y-4">
          <p className="text-sm text-marinho-600">
            Obrigado. O reporte foi para a fila de revisão editorial — se a
            correção proceder, a questão é ajustada para todo mundo.
          </p>

          <button
            type="button"
            onClick={aoFechar}
            className="rounded-lg bg-marinho-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marinho-800"
          >
            Fechar
          </button>
        </div>
      ) : (
        <form action={enviar} className="space-y-4">
          <Selecao
            rotulo="Qual é o problema?"
            name="motivo"
            required
            defaultValue=""
            vazio="Selecione o motivo"
            opcoes={MOTIVOS.map((m) => ({ valor: m.valor, rotulo: m.rotulo }))}
          />

          <div>
            <label
              htmlFor={`reporte-${questionId}`}
              className="block text-xs font-medium text-marinho-600"
            >
              Detalhes (obrigatório para “Outro”)
            </label>

            <textarea
              id={`reporte-${questionId}`}
              name="mensagem"
              rows={4}
              maxLength={1000}
              placeholder="Aponte o trecho e o que está errado. Quanto mais específico, mais rápida a correção."
              className="mt-1 block w-full rounded-lg border border-creme-200 px-3 py-2 text-sm text-marinho-900 outline-none transition-colors placeholder:text-marinho-300 focus:border-marinho-400 focus:ring-2 focus:ring-marinho-100"
            />
          </div>

          {estado.erro && (
            <p role="alert" className="text-sm text-laranja-600">
              {estado.erro}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pendente}
              className="rounded-lg bg-laranja-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-laranja-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendente ? "Enviando..." : "Enviar reporte"}
            </button>

            <button
              type="button"
              onClick={aoFechar}
              className="rounded-lg px-3 py-2 text-sm font-medium text-marinho-600 transition-colors hover:text-marinho-900"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Dialogo>
  );
}
