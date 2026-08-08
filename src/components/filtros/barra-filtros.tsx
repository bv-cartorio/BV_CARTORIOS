"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Selecao } from "@/components/ui/selecao";
import {
  ROTULO_SITUACAO,
  SITUACOES,
  temFiltroAtivo,
  urlQuestoes,
  type Filtros,
  type Situacao,
} from "@/lib/questoes/filtros";
import type { Taxonomia } from "@/lib/questoes/consulta";

type BarraFiltrosProps = {
  taxonomia: Taxonomia;
  filtros: Filtros;
};

export function BarraFiltros({ taxonomia, filtros }: BarraFiltrosProps) {
  const router = useRouter();

  const [materia, setMateria] = useState(filtros.materia ?? "");
  const [assunto, setAssunto] = useState(filtros.assunto ?? "");
  const [subassunto, setSubassunto] = useState(filtros.subassunto ?? "");
  const [banca, setBanca] = useState(filtros.banca ?? "");
  const [ano, setAno] = useState(filtros.ano ? String(filtros.ano) : "");
  const [situacao, setSituacao] = useState<Situacao>(filtros.situacao);
  const [favoritas, setFavoritas] = useState(filtros.favoritas);
  const [busca, setBusca] = useState(filtros.q ?? "");

  const assuntos =
    taxonomia.materias.find((m) => m.id === materia)?.assuntos ?? [];
  const subassuntos =
    assuntos.find((a) => a.id === assunto)?.subassuntos ?? [];

  function aplicar(evento: React.FormEvent) {
    evento.preventDefault();

    // Sempre volta à página 1: manter a página ao trocar de filtro leva a uma
    // lista vazia quando o novo resultado é menor.
    router.push(
      urlQuestoes({
        materia: materia || undefined,
        assunto: assunto || undefined,
        subassunto: subassunto || undefined,
        banca: banca || undefined,
        ano: ano ? Number(ano) : undefined,
        situacao,
        favoritas,
        q: busca.trim() || undefined,
        pagina: 1,
      }),
    );
  }

  return (
    <form
      onSubmit={aplicar}
      className="rounded-2xl border border-creme-200 bg-white p-4 sm:p-5"
    >
      <div>
        <label
          htmlFor="busca"
          className="block text-xs font-medium text-marinho-600"
        >
          Buscar no enunciado ou pelo número da questão
        </label>

        <input
          id="busca"
          name="q"
          type="search"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Ex.: usucapião, 1234"
          className="mt-1 block w-full rounded-lg border border-creme-200 px-3 py-2 text-sm text-marinho-900 outline-none transition-colors placeholder:text-marinho-300 focus:border-marinho-400 focus:ring-2 focus:ring-marinho-100"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Selecao
          rotulo="Matéria"
          name="materia"
          value={materia}
          vazio="Todas as matérias"
          opcoes={taxonomia.materias.map((m) => ({
            valor: m.id,
            rotulo: m.nome,
          }))}
          onChange={(evento) => {
            setMateria(evento.target.value);
            setAssunto("");
            setSubassunto("");
          }}
        />

        <Selecao
          rotulo="Assunto"
          name="assunto"
          value={assunto}
          disabled={assuntos.length === 0}
          vazio={
            materia ? "Todos os assuntos" : "Escolha uma matéria antes"
          }
          opcoes={assuntos.map((a) => ({ valor: a.id, rotulo: a.nome }))}
          onChange={(evento) => {
            setAssunto(evento.target.value);
            setSubassunto("");
          }}
        />

        <Selecao
          rotulo="Subassunto"
          name="subassunto"
          value={subassunto}
          disabled={subassuntos.length === 0}
          vazio={
            assunto ? "Todos os subassuntos" : "Escolha um assunto antes"
          }
          opcoes={subassuntos.map((s) => ({ valor: s.id, rotulo: s.nome }))}
          onChange={(evento) => setSubassunto(evento.target.value)}
        />

        <Selecao
          rotulo="Banca"
          name="banca"
          value={banca}
          vazio="Todas as bancas"
          opcoes={taxonomia.bancas.map((b) => ({
            valor: b.id,
            rotulo: b.nome,
          }))}
          onChange={(evento) => setBanca(evento.target.value)}
        />

        <Selecao
          rotulo="Ano"
          name="ano"
          value={ano}
          vazio="Todos os anos"
          opcoes={taxonomia.anos.map((a) => ({
            valor: String(a),
            rotulo: String(a),
          }))}
          onChange={(evento) => setAno(evento.target.value)}
        />

        <Selecao
          rotulo="Situação"
          name="situacao"
          value={situacao}
          opcoes={SITUACOES.map((s) => ({
            valor: s,
            rotulo: ROTULO_SITUACAO[s],
          }))}
          onChange={(evento) => setSituacao(evento.target.value as Situacao)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-marinho-700">
          <input
            type="checkbox"
            checked={favoritas}
            onChange={(evento) => setFavoritas(evento.target.checked)}
            className="h-4 w-4 rounded border-creme-200 text-marinho-700 focus:ring-marinho-200"
          />
          Só as favoritas
        </label>

        <div className="ml-auto flex items-center gap-3">
          {temFiltroAtivo(filtros) && (
            <Link
              href="/painel/questoes"
              className="text-sm font-medium text-marinho-600 hover:text-marinho-900"
            >
              Limpar filtros
            </Link>
          )}

          <button
            type="submit"
            className="rounded-lg bg-marinho-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-marinho-800"
          >
            Aplicar
          </button>
        </div>
      </div>
    </form>
  );
}
