"use client";

import Link from "next/link";
import { useActionState, useMemo } from "react";

import { salvarAnotacao } from "@/app/painel/questoes/acoes";
import { ANOTACAO_INICIAL } from "@/app/painel/questoes/estados";

type AnotacaoProps = {
  questionId: string;
  codigo: number;
  inicial: string | null;
};

/** Anotação pessoal do aluno. Texto simples: não aceita nem renderiza HTML. */
export function Anotacao({ questionId, codigo, inicial }: AnotacaoProps) {
  const acao = useMemo(() => salvarAnotacao.bind(null, questionId), [questionId]);
  const [estado, enviar, pendente] = useActionState(acao, ANOTACAO_INICIAL);

  // O servidor apara espaços e trata anotação em branco como pedido de apagar,
  // então o texto que vale é o que ele devolveu. O campo fica não controlado e
  // a `key` o remonta quando o conteúdo gravado muda — digitar não dispara
  // re-render, e o React 19 já reseta o formulário ao fim da action.
  const conteudo = estado.conteudo ?? inicial ?? "";

  return (
    <form action={enviar} className="mt-4">
      <label
        htmlFor={`anotacao-${questionId}`}
        className="block text-sm font-medium text-marinho-800"
      >
        Sua anotação sobre a questão {codigo}
      </label>

      <textarea
        key={conteudo}
        id={`anotacao-${questionId}`}
        name="conteudo"
        rows={4}
        maxLength={5000}
        defaultValue={conteudo}
        placeholder="Registre o que você quer lembrar quando reencontrar esta questão."
        className="mt-1.5 block w-full rounded-lg border border-creme-200 px-3 py-2.5 text-sm text-marinho-900 outline-none transition-colors placeholder:text-marinho-300 focus:border-marinho-400 focus:ring-2 focus:ring-marinho-100"
      />

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-marinho-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marinho-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendente ? "Salvando..." : "Salvar anotação"}
        </button>

        {estado.erro && (
          <span role="alert" className="text-sm text-laranja-600">
            {estado.erro}
          </span>
        )}

        {estado.salva && !estado.erro && (
          <span role="status" className="text-sm text-marinho-600">
            {estado.conteudo ? "Anotação salva." : "Anotação apagada."}
          </span>
        )}

        <Link
          href="/painel/anotacoes"
          className="ml-auto text-sm font-medium text-marinho-600 hover:text-marinho-900"
        >
          Ver todas as anotações
        </Link>
      </div>
    </form>
  );
}
