import type { Metadata } from "next";

import { Adicionar } from "@/components/admin/taxonomia/adicionar";
import { NoTaxonomia } from "@/components/admin/taxonomia/no-taxonomia";
import { carregarArvoreAdmin } from "@/lib/questoes/taxonomia";

export const metadata: Metadata = { title: "Taxonomia" };

export default async function TaxonomiaPage() {
  const { materias, bancas } = await carregarArvoreAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
          Taxonomia
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-marinho-600">
          Matéria, assunto e subassunto organizam o acervo e alimentam os filtros
          do aluno. O número ao lado de cada item é quantas questões apontam para
          ele. <strong className="font-semibold">Desativar</strong> tira dos
          filtros sem perder nada;{" "}
          <strong className="font-semibold">excluir</strong> assunto ou
          subassunto desclassifica as questões de forma definitiva.
        </p>
      </div>

      <section className="rounded-2xl border border-creme-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-marinho-600 uppercase">
          Matérias
        </h2>

        {materias.length === 0 ? (
          <p className="text-sm text-marinho-500">Nenhuma matéria cadastrada.</p>
        ) : (
          <div className="divide-y divide-creme-200">
            {materias.map((materia) => (
              <div key={materia.id} className="py-2">
                <NoTaxonomia
                  nivel="materia"
                  id={materia.id}
                  nome={materia.nome}
                  ativo={materia.ativo}
                  questoes={materia.questoes}
                >
                  <div className="mt-1 ml-5 border-l border-creme-200 pl-4">
                    {materia.assuntos.map((assunto) => (
                      <NoTaxonomia
                        key={assunto.id}
                        nivel="assunto"
                        id={assunto.id}
                        nome={assunto.nome}
                        ativo={assunto.ativo}
                        questoes={assunto.questoes}
                      >
                        <div className="mt-1 ml-5 border-l border-creme-200 pl-4">
                          {assunto.subassuntos.map((sub) => (
                            <NoTaxonomia
                              key={sub.id}
                              nivel="subassunto"
                              id={sub.id}
                              nome={sub.nome}
                              ativo={sub.ativo}
                              questoes={sub.questoes}
                            />
                          ))}

                          <Adicionar nivel="subassunto" paiId={assunto.id} />
                        </div>
                      </NoTaxonomia>
                    ))}

                    <Adicionar nivel="assunto" paiId={materia.id} />
                  </div>
                </NoTaxonomia>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 border-t border-creme-200 pt-3">
          <Adicionar nivel="materia" />
        </div>
      </section>

      <section className="rounded-2xl border border-creme-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold tracking-wide text-marinho-600 uppercase">
          Bancas
        </h2>
        <p className="mb-3 text-sm text-marinho-500">
          Excluir uma banca não apaga questão: elas apenas ficam sem origem.
        </p>

        <div className="divide-y divide-creme-200">
          {bancas.map((banca) => (
            <div key={banca.id} className="py-1">
              <NoTaxonomia
                nivel="banca"
                id={banca.id}
                nome={banca.nome}
                ativo={null}
                questoes={banca.questoes}
              />
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-creme-200 pt-3">
          <Adicionar nivel="banca" />
        </div>
      </section>
    </div>
  );
}
