import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { Decisao } from "@/components/admin/reportes/decisao";
import { Paginacao } from "@/components/ui/paginacao";
import { Vazio } from "@/components/ui/vazio";
import { ReportStatus } from "@/generated/prisma/enums";
import { formatarData } from "@/lib/format";
import { buscarReportes } from "@/lib/questoes/reportes";
import {
  ROTULO_MOTIVO,
  ROTULO_SITUACAO_REPORTE,
} from "@/lib/questoes/rotulos";

export const metadata: Metadata = { title: "Reportes" };

const paramsSchema = z.object({
  situacao: z.enum(ReportStatus).or(z.literal("TODOS")).catch("OPEN"),
  pagina: z.coerce.number().int().min(1).max(9999).catch(1),
});

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ESTILO_SITUACAO: Record<ReportStatus, string> = {
  OPEN: "bg-laranja-100 text-laranja-700",
  IN_REVIEW: "bg-marinho-100 text-marinho-800",
  RESOLVED: "bg-creme text-marinho-600",
  REJECTED: "bg-creme-200 text-marinho-500",
};

const ABAS: { valor: ReportStatus | "TODOS"; rotulo: string }[] = [
  { valor: "OPEN", rotulo: "Abertos" },
  { valor: "IN_REVIEW", rotulo: "Em análise" },
  { valor: "RESOLVED", rotulo: "Resolvidos" },
  { valor: "REJECTED", rotulo: "Rejeitados" },
  { valor: "TODOS", rotulo: "Todos" },
];

export default async function ReportesPage({ searchParams }: PageProps) {
  const bruto = Object.fromEntries(
    Object.entries(await searchParams).map(([chave, valor]) => [
      chave,
      Array.isArray(valor) ? valor[0] : valor,
    ]),
  );

  const { situacao, pagina } = paramsSchema.parse(bruto);
  const resultado = await buscarReportes(situacao, pagina);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
          Erros reportados
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-marinho-600">
          O que os alunos apontaram no acervo. Corrigir um gabarito na tela da
          questão recalcula automaticamente o acerto de quem já respondeu.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-creme-200">
        {ABAS.map((aba) => (
          <Link
            key={aba.valor}
            href={`/admin/reportes?situacao=${aba.valor}`}
            aria-current={aba.valor === situacao ? "page" : undefined}
            className={`-mb-px rounded-t-lg border-b-2 px-3.5 py-2 text-sm font-medium transition-colors ${
              aba.valor === situacao
                ? "border-laranja-500 text-marinho-900"
                : "border-transparent text-marinho-500 hover:text-marinho-800"
            }`}
          >
            {aba.rotulo}
          </Link>
        ))}
      </div>

      {resultado.reportes.length === 0 ? (
        <Vazio titulo="Nada nesta fila">
          <p>
            Quando um aluno apontar erro numa questão, o reporte aparece aqui.
          </p>
        </Vazio>
      ) : (
        <ul className="space-y-4">
          {resultado.reportes.map((reporte) => (
            <li
              key={reporte.id}
              className="rounded-2xl border border-creme-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTILO_SITUACAO[reporte.situacao]}`}
                >
                  {ROTULO_SITUACAO_REPORTE[reporte.situacao]}
                </span>

                <span className="text-sm font-semibold text-marinho-800">
                  {ROTULO_MOTIVO[reporte.motivo as keyof typeof ROTULO_MOTIVO]}
                </span>

                <Link
                  href={`/admin/questoes/${reporte.questao.id}`}
                  className="text-sm text-marinho-600 underline-offset-2 hover:underline"
                >
                  Questão {reporte.questao.codigo}
                </Link>

                <span className="rounded-md bg-creme px-2 py-0.5 text-xs text-marinho-500">
                  gabarito {reporte.questao.gabarito}
                </span>

                <span className="ml-auto text-xs text-marinho-400">
                  {formatarData(reporte.criadoEm)}
                </span>
              </div>

              <p className="mt-2 text-sm text-marinho-600">
                {reporte.questao.resumo}
              </p>

              {reporte.mensagem && (
                <blockquote className="mt-3 border-l-4 border-laranja-500 bg-creme px-4 py-2.5 text-sm whitespace-pre-wrap text-marinho-800">
                  {reporte.mensagem}
                </blockquote>
              )}

              <p className="mt-2 text-xs text-marinho-400">
                Reportado por {reporte.aluno}
                {reporte.resolvidoPor &&
                  ` · decidido por ${reporte.resolvidoPor}`}
                {reporte.resolvidoEm &&
                  ` em ${formatarData(reporte.resolvidoEm)}`}
              </p>

              {reporte.notaDeResolucao && (
                <p className="mt-2 rounded-lg bg-creme px-3 py-2 text-sm text-marinho-700">
                  <strong className="font-semibold">Decisão:</strong>{" "}
                  {reporte.notaDeResolucao}
                </p>
              )}

              <div className="mt-3 border-t border-creme-200 pt-3">
                <Decisao id={reporte.id} situacao={reporte.situacao} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Paginacao
        pagina={resultado.pagina}
        paginas={resultado.paginas}
        href={(numero) =>
          `/admin/reportes?situacao=${situacao}${numero > 1 ? `&pagina=${numero}` : ""}`
        }
      />
    </div>
  );
}
