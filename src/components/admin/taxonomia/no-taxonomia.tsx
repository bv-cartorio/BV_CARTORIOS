"use client";

import { useActionState, useState, useTransition } from "react";

import {
  alternarAtivo,
  excluirItem,
  renomearItem,
} from "@/app/admin/taxonomia/acoes";
import {
  ROTULO_NIVEL,
  TAXONOMIA_INICIAL,
  type Nivel,
} from "@/app/admin/taxonomia/estados";
import { Dialogo } from "@/components/ui/dialogo";

type NoProps = {
  nivel: Nivel;
  id: string;
  nome: string;
  /** `null` para banca, que não tem ativação. */
  ativo: boolean | null;
  questoes: number;
  children?: React.ReactNode;
};

const BOTAO =
  "rounded-md px-2 py-1 text-xs font-medium text-marinho-500 transition-colors hover:bg-creme hover:text-marinho-900";

/** Frase de impacto da exclusão, que muda conforme o nível. */
function avisoDeExclusao(nivel: Nivel, questoes: number): string {
  if (questoes === 0) return "Nenhuma questão usa este item.";

  const plural = questoes === 1 ? "questão" : "questões";

  if (nivel === "materia") {
    return `${questoes} ${plural} usam esta matéria. O banco recusa a exclusão — reclassifique antes, ou apenas desative.`;
  }

  if (nivel === "banca") {
    return `${questoes} ${plural} ficarão sem banca. A questão continua no acervo, só perde a origem.`;
  }

  return `${questoes} ${plural} ficarão sem ${ROTULO_NIVEL[nivel]}. Elas continuam no acervo, mas perdem esse nível de classificação — e isso não pode ser desfeito.`;
}

export function NoTaxonomia({
  nivel,
  id,
  nome,
  ativo,
  questoes,
  children,
}: NoProps) {
  const [renomeando, setRenomeando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [pendenteAtivo, iniciar] = useTransition();

  const [estadoNome, salvarNome] = useActionState(
    renomearItem,
    TAXONOMIA_INICIAL,
  );
  const [estadoExcluir, excluir, excluindo] = useActionState(
    excluirItem,
    TAXONOMIA_INICIAL,
  );

  const inativo = ativo === false;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 py-1.5">
        {renomeando ? (
          <form
            action={salvarNome}
            onSubmit={() => setRenomeando(false)}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="nivel" value={nivel} />
            <input type="hidden" name="id" value={id} />
            <input
              name="nome"
              defaultValue={nome}
              autoFocus
              required
              maxLength={120}
              className="rounded-lg border border-creme-200 px-2.5 py-1 text-sm text-marinho-900 outline-none focus:border-marinho-400 focus:ring-2 focus:ring-marinho-100"
            />
            <button
              type="submit"
              className="rounded-md bg-marinho-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-marinho-800"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setRenomeando(false)}
              className={BOTAO}
            >
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <span
              className={`text-sm ${
                inativo
                  ? "text-marinho-400 line-through"
                  : "font-medium text-marinho-800"
              }`}
            >
              {nome}
            </span>

            <span className="rounded-md bg-creme px-1.5 py-0.5 text-xs text-marinho-500">
              {questoes}
            </span>

            {inativo && (
              <span className="rounded-md bg-creme-200 px-1.5 py-0.5 text-xs text-marinho-500">
                inativo
              </span>
            )}

            <button
              type="button"
              onClick={() => setRenomeando(true)}
              className={BOTAO}
            >
              Renomear
            </button>

            {ativo !== null && (
              <button
                type="button"
                disabled={pendenteAtivo}
                onClick={() => iniciar(() => alternarAtivo(nivel, id).then(() => {}))}
                className={BOTAO}
              >
                {ativo ? "Desativar" : "Ativar"}
              </button>
            )}

            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="rounded-md px-2 py-1 text-xs font-medium text-marinho-400 transition-colors hover:bg-laranja-50 hover:text-laranja-700"
            >
              Excluir
            </button>
          </>
        )}

        {estadoNome.erro && (
          <span role="alert" className="text-xs text-laranja-600">
            {estadoNome.erro}
          </span>
        )}

        {estadoExcluir.erro && (
          <span role="alert" className="text-xs text-laranja-600">
            {estadoExcluir.erro}
          </span>
        )}
      </div>

      {children}

      <Dialogo
        aberto={confirmando}
        titulo={`Excluir ${ROTULO_NIVEL[nivel]} “${nome}”`}
        aoFechar={() => setConfirmando(false)}
      >
        <p className="text-sm text-marinho-700">
          {avisoDeExclusao(nivel, questoes)}
        </p>

        {(nivel === "materia" || nivel === "assunto") && (
          <p className="mt-2 text-sm text-marinho-600">
            Os níveis abaixo deste também são apagados.
          </p>
        )}

        <form
          action={excluir}
          onSubmit={() => setConfirmando(false)}
          className="mt-4 flex items-center gap-3"
        >
          <input type="hidden" name="nivel" value={nivel} />
          <input type="hidden" name="id" value={id} />

          <button
            type="submit"
            disabled={excluindo}
            className="rounded-lg bg-laranja-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-laranja-600 disabled:opacity-60"
          >
            {excluindo ? "Excluindo..." : "Excluir mesmo assim"}
          </button>

          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-marinho-600 hover:text-marinho-900"
          >
            Cancelar
          </button>
        </form>
      </Dialogo>
    </div>
  );
}
