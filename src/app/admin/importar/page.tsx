import type { Metadata } from "next";
import Link from "next/link";

import { FormularioImportacao } from "@/components/admin/importar/formulario";

export const metadata: Metadata = { title: "Importar questões" };

const COLUNAS: { nome: string; obrigatoria?: boolean; descricao: string }[] = [
  { nome: "enunciado", obrigatoria: true, descricao: "Texto da questão. Aceita HTML simples." },
  { nome: "materia", obrigatoria: true, descricao: "Nome exato da matéria já cadastrada." },
  { nome: "gabarito", obrigatoria: true, descricao: "A a E; em certo/errado aceita “certo” ou “errado”." },
  { nome: "tipo", descricao: "“multipla” (padrão) ou “certo_errado”." },
  { nome: "alternativa_a … alternativa_e", descricao: "Ignoradas em certo/errado. Em branco = alternativa inexistente." },
  { nome: "comentario", descricao: "Obrigatório se o status for “publicada”." },
  { nome: "assunto", descricao: "Precisa existir dentro da matéria informada." },
  { nome: "subassunto", descricao: "Precisa existir dentro do assunto informado." },
  { nome: "banca", descricao: "Criada automaticamente se ainda não existir." },
  { nome: "ano", descricao: "Ano da prova, entre 1980 e 2100." },
  { nome: "origem", descricao: "“ENAC 2024 — TJSP”, “Inédita” etc." },
  { nome: "dificuldade", descricao: "“facil”, “media” ou “dificil”." },
  { nome: "status", descricao: "“rascunho” (padrão), “revisao”, “publicada” ou “desativada”." },
  { nome: "codigo", descricao: "Número da questão. Se já existir, a linha atualiza em vez de duplicar." },
];

export default function ImportarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
          Importar questões
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-marinho-600">
          Para carregar lotes de questões de uma planilha. A migração do sistema
          legado é outra coisa e roda por script — esta tela é para o dia a dia
          editorial.
        </p>
      </div>

      <FormularioImportacao />

      <section className="rounded-2xl border border-creme-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-marinho-600 uppercase">
          Colunas aceitas
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-creme-200">
                <th className="py-2 pr-4 text-left font-semibold text-marinho-700">
                  Coluna
                </th>
                <th className="py-2 text-left font-semibold text-marinho-700">
                  O que espera
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-creme-200">
              {COLUNAS.map((coluna) => (
                <tr key={coluna.nome}>
                  <td className="py-2 pr-4 align-top whitespace-nowrap">
                    <code className="rounded bg-creme px-1.5 py-0.5 text-xs text-marinho-800">
                      {coluna.nome}
                    </code>
                    {coluna.obrigatoria && (
                      <span className="ml-1.5 text-xs font-medium text-laranja-600">
                        obrigatória
                      </span>
                    )}
                  </td>
                  <td className="py-2 align-top text-marinho-600">
                    {coluna.descricao}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-marinho-600">
          Matéria, assunto e subassunto <strong>não</strong> são criados na
          importação: um erro de digitação viraria uma matéria nova, e é assim
          que a classificação apodrece. Cadastre antes em{" "}
          <Link
            href="/admin/taxonomia"
            className="font-medium underline underline-offset-2"
          >
            Taxonomia
          </Link>
          . Banca é exceção, porque é uma lista rasa e sem hierarquia a quebrar.
        </p>
      </section>
    </div>
  );
}
