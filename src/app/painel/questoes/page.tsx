import type { Metadata } from "next";
import Link from "next/link";

import { BarraFiltros } from "@/components/filtros/barra-filtros";
import { CartaoQuestao } from "@/components/questao/cartao-questao";
import { ProvedorCota, SeloCota } from "@/components/questao/cota";
import { Paginacao } from "@/components/ui/paginacao";
import { Vazio } from "@/components/ui/vazio";
import { exigirUsuario } from "@/lib/auth/guardas";
import { situacaoDeAcesso } from "@/lib/questoes/acesso";
import { buscarQuestoes, carregarTaxonomia } from "@/lib/questoes/consulta";
import { lerFiltros, temFiltroAtivo, urlQuestoes } from "@/lib/questoes/filtros";

export const metadata: Metadata = { title: "Questões" };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function QuestoesPage({ searchParams }: PageProps) {
  const usuario = await exigirUsuario("/painel/questoes");
  const filtros = lerFiltros(await searchParams);

  const [taxonomia, resultado, acesso] = await Promise.all([
    carregarTaxonomia(),
    buscarQuestoes(filtros, usuario.id),
    situacaoDeAcesso(usuario.id),
  ]);

  const filtrado = temFiltroAtivo(filtros);

  return (
    <ProvedorCota
      inicial={{ assinante: acesso.assinante, restantes: acesso.restantes }}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
            Questões
          </h1>
          <SeloCota />
        </div>

        <BarraFiltros taxonomia={taxonomia} filtros={filtros} />

        <p className="text-sm text-marinho-600">
          {resultado.total === 0
            ? "Nenhuma questão encontrada."
            : `${resultado.total} ${resultado.total === 1 ? "questão encontrada" : "questões encontradas"}.`}
        </p>

        {resultado.questoes.length === 0 ? (
          <Vazio
            titulo={
              filtrado
                ? "Nenhuma questão com esses filtros"
                : "Nenhuma questão publicada ainda"
            }
          >
            {filtrado ? (
              <p>
                Tente afrouxar a busca —{" "}
                <Link
                  href="/painel/questoes"
                  className="font-medium underline underline-offset-2"
                >
                  limpar os filtros
                </Link>{" "}
                mostra o acervo inteiro.
              </p>
            ) : (
              <p>
                O acervo está sendo publicado. Assim que houver questões, elas
                aparecem aqui.
              </p>
            )}
          </Vazio>
        ) : (
          <div className="space-y-5">
            {resultado.questoes.map((questao) => (
              <CartaoQuestao key={questao.id} questao={questao} />
            ))}
          </div>
        )}

        <Paginacao
          pagina={resultado.pagina}
          paginas={resultado.paginas}
          href={(pagina) => urlQuestoes({ ...filtros, pagina })}
        />
      </div>
    </ProvedorCota>
  );
}
