import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { Paginacao } from "@/components/ui/paginacao";
import { Vazio } from "@/components/ui/vazio";
import { exigirUsuario } from "@/lib/auth/guardas";
import { formatarData } from "@/lib/format";
import { buscarAnotacoes } from "@/lib/questoes/anotacoes";
import { urlQuestoes } from "@/lib/questoes/filtros";

export const metadata: Metadata = { title: "Minhas anotações" };

const paginaSchema = z.coerce.number().int().min(1).max(9999).catch(1);

type PageProps = {
  searchParams: Promise<{ pagina?: string | string[] }>;
};

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-creme px-2 py-0.5 text-xs font-medium text-marinho-600">
      {children}
    </span>
  );
}

export default async function AnotacoesPage({ searchParams }: PageProps) {
  const usuario = await exigirUsuario("/painel/anotacoes");
  const { pagina: bruto } = await searchParams;
  const pagina = paginaSchema.parse(Array.isArray(bruto) ? bruto[0] : bruto);

  const resultado = await buscarAnotacoes(usuario.id, pagina);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
          Minhas anotações
        </h1>
        <p className="mt-1.5 text-sm text-marinho-600">
          O que você escreveu, junto da questão que motivou cada anotação.
        </p>
      </div>

      {resultado.anotacoes.length === 0 ? (
        <Vazio titulo="Você ainda não tem anotações">
          <p>
            Ao resolver uma questão, use{" "}
            <strong className="font-semibold">Anotar</strong> para registrar o
            que quiser lembrar quando reencontrá-la.{" "}
            <Link
              href="/painel/questoes"
              className="font-medium underline underline-offset-2"
            >
              Ir para as questões
            </Link>
          </p>
        </Vazio>
      ) : (
        <>
          <p className="text-sm text-marinho-600">
            {resultado.total === 1
              ? "1 questão anotada."
              : `${resultado.total} questões anotadas.`}
          </p>

          <div className="space-y-5">
            {resultado.anotacoes.map((anotacao) => (
              <article
                key={anotacao.questionId}
                className="rounded-2xl border border-creme-200 bg-white p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-marinho-800">
                    Questão {anotacao.codigo}
                  </span>

                  <Etiqueta>{anotacao.materia}</Etiqueta>
                  {anotacao.assunto && <Etiqueta>{anotacao.assunto}</Etiqueta>}
                  {anotacao.subassunto && (
                    <Etiqueta>{anotacao.subassunto}</Etiqueta>
                  )}
                  {anotacao.banca && <Etiqueta>{anotacao.banca}</Etiqueta>}
                  {anotacao.ano && <Etiqueta>{anotacao.ano}</Etiqueta>}
                </div>

                {/* Enunciado em HTML sanitizado na escrita (ver CLAUDE.md). */}
                <div
                  className="conteudo-rico mt-4 text-marinho-800"
                  dangerouslySetInnerHTML={{ __html: anotacao.enunciado }}
                />

                <div className="mt-5 rounded-xl border-l-4 border-laranja-500 bg-creme px-4 py-3">
                  <h2 className="text-xs font-semibold tracking-wide text-marinho-600 uppercase">
                    Sua anotação
                  </h2>

                  {/*
                    Texto simples: `whitespace-pre-wrap` preserva as quebras de
                    linha que o aluno digitou sem que isso vire HTML.
                  */}
                  <p className="mt-1.5 text-sm whitespace-pre-wrap text-marinho-800">
                    {anotacao.conteudo}
                  </p>

                  <p className="mt-2 text-xs text-marinho-500">
                    Atualizada em {formatarData(anotacao.atualizadaEm)}
                  </p>
                </div>

                <Link
                  href={urlQuestoes({ q: String(anotacao.codigo) })}
                  className="mt-4 inline-flex rounded-lg border border-creme-200 px-4 py-2 text-sm font-medium text-marinho-700 transition-colors hover:border-marinho-200 hover:text-marinho-900"
                >
                  Abrir a questão
                </Link>
              </article>
            ))}
          </div>

          <Paginacao
            pagina={resultado.pagina}
            paginas={resultado.paginas}
            href={(numero) =>
              numero > 1 ? `/painel/anotacoes?pagina=${numero}` : "/painel/anotacoes"
            }
          />
        </>
      )}
    </div>
  );
}
