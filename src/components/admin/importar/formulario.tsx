"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { importarCsv } from "@/app/admin/importar/acoes";
import { IMPORTACAO_INICIAL } from "@/app/admin/importar/estados";

export function FormularioImportacao() {
  const [estado, enviar, pendente] = useActionState(
    importarCsv,
    IMPORTACAO_INICIAL,
  );
  const [gravar, setGravar] = useState(false);

  const resultado = estado.resultado;
  const semProblemas = resultado?.problemas.length === 0;

  return (
    <div className="space-y-5">
      <form
        action={enviar}
        className="space-y-4 rounded-2xl border border-creme-200 bg-white p-5"
      >
        <div>
          <label
            htmlFor="arquivo"
            className="block text-sm font-medium text-marinho-800"
          >
            Arquivo CSV
          </label>
          <input
            id="arquivo"
            name="arquivo"
            type="file"
            accept=".csv,text/csv"
            required
            className="mt-1.5 block w-full rounded-lg border border-creme-200 px-3 py-2 text-sm text-marinho-700 file:mr-3 file:rounded-md file:border-0 file:bg-creme file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-marinho-700"
          />
          <p className="mt-1.5 text-xs text-marinho-500">
            Aceita separador <code className="rounded bg-creme px-1">;</code> ou{" "}
            <code className="rounded bg-creme px-1">,</code>, e arquivo salvo em
            UTF-8 ou Windows-1252 (o padrão do Excel em português).
          </p>
        </div>

        <label className="flex items-start gap-2 text-sm text-marinho-700">
          <input
            type="checkbox"
            name="gravar"
            value="1"
            checked={gravar}
            onChange={(evento) => setGravar(evento.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-creme-200 text-marinho-700 focus:ring-marinho-200"
          />
          <span>
            <strong className="font-semibold">Gravar no banco.</strong> Sem
            marcar, o arquivo é apenas conferido e nada é alterado — é o modo
            recomendado na primeira passada.
          </span>
        </label>

        <button
          type="submit"
          disabled={pendente}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
            gravar
              ? "bg-laranja-500 hover:bg-laranja-600"
              : "bg-marinho-700 hover:bg-marinho-800"
          }`}
        >
          {pendente
            ? "Processando..."
            : gravar
              ? "Importar de verdade"
              : "Conferir arquivo"}
        </button>
      </form>

      {estado.erro && (
        <div
          role="alert"
          className="rounded-lg border border-laranja-200 bg-laranja-50 px-4 py-3 text-sm text-laranja-700"
        >
          {estado.erro}
        </div>
      )}

      {resultado && (
        <div className="space-y-4 rounded-2xl border border-creme-200 bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-marinho-600 uppercase">
              {estado.gravou ? "Importação concluída" : "Conferência"}
            </h2>

            {!estado.gravou && (
              <span className="rounded-md bg-creme px-2 py-0.5 text-xs font-medium text-marinho-600">
                nada foi gravado
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-creme-200 p-4">
              <p className="text-2xl font-bold text-marinho-800">
                {resultado.totalLinhas}
              </p>
              <p className="text-sm text-marinho-600">linhas no arquivo</p>
            </div>

            <div className="rounded-xl border border-creme-200 p-4">
              <p className="text-2xl font-bold text-marinho-800">
                {resultado.validas}
              </p>
              <p className="text-sm text-marinho-600">válidas</p>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                semProblemas ? "border-creme-200" : "border-laranja-300"
              }`}
            >
              <p
                className={`text-2xl font-bold ${
                  semProblemas ? "text-marinho-800" : "text-laranja-600"
                }`}
              >
                {resultado.problemas.length}
              </p>
              <p className="text-sm text-marinho-600">com problema</p>
            </div>
          </div>

          {estado.gravou && (
            <div className="rounded-lg border border-marinho-200 bg-marinho-50 px-4 py-3 text-sm text-marinho-800">
              <p>
                {resultado.criadas} questão(ões) criada(s) e{" "}
                {resultado.atualizadas} atualizada(s).{" "}
                <Link href="/admin/questoes" className="font-medium underline">
                  Ver no acervo
                </Link>
              </p>

              {resultado.bancasCriadas &&
                resultado.bancasCriadas.length > 0 && (
                  <p className="mt-1.5">
                    Bancas criadas automaticamente:{" "}
                    {resultado.bancasCriadas.join(", ")}.
                  </p>
                )}

              {resultado.sequenciaAjustada && (
                <p className="mt-1.5">
                  O arquivo trazia números de questão explícitos, então a
                  sequência do banco foi realinhada — a próxima questão criada
                  pela tela não vai colidir.
                </p>
              )}
            </div>
          )}

          {resultado.problemas.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-marinho-800">
                Linhas recusadas
              </h3>
              <p className="mb-2 text-xs text-marinho-500">
                Cada linha é avaliada sozinha: as válidas entram, estas ficam de
                fora. Corrija e importe de novo só as corrigidas.
              </p>

              <div className="max-h-96 overflow-y-auto rounded-lg border border-creme-200">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-creme">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-marinho-700">
                        Linha
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-marinho-700">
                        Problema
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-creme-200">
                    {resultado.problemas.map((problema, indice) => (
                      <tr key={`${problema.linha}-${indice}`}>
                        <td className="px-3 py-2 text-marinho-500 tabular-nums">
                          {problema.linha}
                        </td>
                        <td className="px-3 py-2 text-marinho-800">
                          {problema.mensagem}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
