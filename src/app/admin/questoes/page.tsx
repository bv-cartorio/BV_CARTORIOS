import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { AcoesLinha } from "@/components/admin/questoes/acoes-linha";
import { Paginacao } from "@/components/ui/paginacao";
import { Vazio } from "@/components/ui/vazio";
import { QuestionStatus } from "@/generated/prisma/enums";
import { formatarData } from "@/lib/format";
import { buscarQuestoesAdmin } from "@/lib/questoes/admin";
import { carregarTaxonomia } from "@/lib/questoes/consulta";
import { ESTILO_STATUS, ROTULO_STATUS } from "@/lib/questoes/rotulos";

export const metadata: Metadata = { title: "Questões" };

const filtrosSchema = z.object({
  status: z.enum(QuestionStatus).optional().catch(undefined),
  materia: z.string().trim().min(1).optional().catch(undefined),
  banca: z.string().trim().min(1).optional().catch(undefined),
  q: z.string().trim().min(1).max(120).optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).max(9999).catch(1),
});

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const CAMPO =
  "rounded-lg border border-creme-200 bg-white px-3 py-2 text-sm text-marinho-900 outline-none focus:border-marinho-400 focus:ring-2 focus:ring-marinho-100";

export default async function QuestoesAdminPage({ searchParams }: PageProps) {
  const bruto = Object.fromEntries(
    Object.entries(await searchParams).map(([chave, valor]) => [
      chave,
      Array.isArray(valor) ? valor[0] : valor,
    ]),
  );

  const filtros = filtrosSchema.parse(bruto);

  const [resultado, taxonomia] = await Promise.all([
    buscarQuestoesAdmin(filtros),
    carregarTaxonomia(),
  ]);

  function urlPagina(pagina: number): string {
    const params = new URLSearchParams();
    if (filtros.status) params.set("status", filtros.status);
    if (filtros.materia) params.set("materia", filtros.materia);
    if (filtros.banca) params.set("banca", filtros.banca);
    if (filtros.q) params.set("q", filtros.q);
    if (pagina > 1) params.set("pagina", String(pagina));
    const query = params.toString();
    return query ? `/admin/questoes?${query}` : "/admin/questoes";
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
          Questões
        </h1>

        <Link
          href="/admin/questoes/nova"
          className="rounded-lg bg-laranja-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-laranja-600"
        >
          Nova questão
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-2 rounded-2xl border border-creme-200 bg-white p-4"
      >
        <div className="min-w-56 flex-1">
          <label
            htmlFor="q"
            className="block text-xs font-medium text-marinho-600"
          >
            Busca
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filtros.q ?? ""}
            placeholder="Texto, comentário, origem ou número"
            className={`${CAMPO} mt-1 w-full`}
          />
        </div>

        <div>
          <label
            htmlFor="status"
            className="block text-xs font-medium text-marinho-600"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filtros.status ?? ""}
            className={`${CAMPO} mt-1`}
          >
            <option value="">Todos</option>
            {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="materia"
            className="block text-xs font-medium text-marinho-600"
          >
            Matéria
          </label>
          <select
            id="materia"
            name="materia"
            defaultValue={filtros.materia ?? ""}
            className={`${CAMPO} mt-1`}
          >
            <option value="">Todas</option>
            {taxonomia.materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-marinho-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marinho-800"
        >
          Filtrar
        </button>

        <Link
          href="/admin/questoes"
          className="px-2 py-2 text-sm font-medium text-marinho-600 hover:text-marinho-900"
        >
          Limpar
        </Link>
      </form>

      <p className="text-sm text-marinho-600">
        {resultado.total === 1
          ? "1 questão."
          : `${resultado.total} questões.`}
      </p>

      {resultado.questoes.length === 0 ? (
        <Vazio titulo="Nenhuma questão com esses filtros">
          <p>
            Ajuste a busca ou{" "}
            <Link
              href="/admin/questoes/nova"
              className="font-medium underline underline-offset-2"
            >
              cadastre uma questão
            </Link>
            .
          </p>
        </Vazio>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-creme-200 bg-white">
          <ul className="divide-y divide-creme-200">
            {resultado.questoes.map((questao) => (
              <li key={questao.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/questoes/${questao.id}`}
                        className="text-sm font-semibold text-marinho-800 hover:underline"
                      >
                        Questão {questao.codigo}
                      </Link>

                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTILO_STATUS[questao.status]}`}
                      >
                        {ROTULO_STATUS[questao.status]}
                      </span>

                      {questao.reportesAbertos > 0 && (
                        <Link
                          href="/admin/reportes"
                          className="rounded-md bg-laranja-100 px-2 py-0.5 text-xs font-medium text-laranja-700"
                        >
                          {questao.reportesAbertos} reporte(s)
                        </Link>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-marinho-600">
                      {questao.resumo}
                    </p>

                    <p className="mt-1 text-xs text-marinho-400">
                      {[
                        questao.materia,
                        questao.assunto,
                        questao.banca,
                        questao.ano,
                        `${questao.respostas} resposta(s)`,
                        `editada em ${formatarData(questao.atualizadaEm)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Link
                      href={`/admin/questoes/${questao.id}`}
                      className="rounded-md px-2 py-1 text-xs font-medium text-marinho-700 transition-colors hover:bg-creme"
                    >
                      Editar
                    </Link>

                    <AcoesLinha
                      id={questao.id}
                      codigo={questao.codigo}
                      status={questao.status}
                      respostas={questao.respostas}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Paginacao
        pagina={resultado.pagina}
        paginas={resultado.paginas}
        href={urlPagina}
      />
    </div>
  );
}
