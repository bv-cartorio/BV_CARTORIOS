"use client";

import { useState } from "react";

import type { Letter, QuestionType } from "@/generated/prisma/enums";
import type { Alternativa } from "@/lib/questoes/consulta";

type Resultado = { minhaLetra: Letter; gabarito: Letter };

type AlternativasProps = {
  codigo: number;
  tipo: QuestionType;
  alternativas: Alternativa[];
  /** Ausente enquanto a questão não foi respondida. */
  resultado?: Resultado;
};

const CAIXA =
  "flex items-start gap-3 rounded-xl border px-4 py-3 text-marinho-800 transition-colors";

const LETRA =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors";

/**
 * O texto da alternativa é HTML sanitizado na escrita (ver o schema), mesmo
 * quando na prática é uma frase simples. Renderizar como HTML mantém o mesmo
 * contrato do enunciado e do comentário.
 */
function Texto({ html, riscada }: { html: string; riscada?: boolean }) {
  const conteudo = (
    <span className="conteudo-rico" dangerouslySetInnerHTML={{ __html: html }} />
  );

  return (
    <span
      className={`min-w-0 flex-1 text-sm ${
        riscada ? "text-marinho-400 line-through" : ""
      }`}
    >
      {/* `<s>` para quem usa leitor de tela ouvir que a alternativa foi
          descartada — o risco não pode ser só uma pista visual. */}
      {riscada ? <s>{conteudo}</s> : conteudo}
    </span>
  );
}

function IconeTesoura() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <circle cx="5.25" cy="14.75" r="2.25" />
      <circle cx="14.75" cy="14.75" r="2.25" />
      <path d="M6.85 13.15L15.5 3.5M13.15 13.15L4.5 3.5" />
    </svg>
  );
}

function IconeDesfazer() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M4 8.5h8a3.75 3.75 0 010 7.5H8" />
      <path d="M7 5.5l-3 3 3 3" />
    </svg>
  );
}

export function Alternativas({
  codigo,
  tipo,
  alternativas,
  resultado,
}: AlternativasProps) {
  const certoErrado = tipo === "TRUE_FALSE";

  /**
   * Alternativas riscadas pelo aluno.
   *
   * É rascunho de quem está resolvendo, não dado: vive só aqui, some ao
   * recarregar e não vai ao banco. Depois de responder perde a função, então
   * guardar isso custaria uma tabela para nada.
   */
  const [riscadas, setRiscadas] = useState<ReadonlySet<Letter>>(new Set());

  function alternarRisco(letra: Letter) {
    setRiscadas((atuais) => {
      const proximas = new Set(atuais);
      if (!proximas.delete(letra)) proximas.add(letra);
      return proximas;
    });
  }

  function desfazerRisco(letra: Letter) {
    setRiscadas((atuais) => {
      if (!atuais.has(letra)) return atuais;
      const proximas = new Set(atuais);
      proximas.delete(letra);
      return proximas;
    });
  }

  if (resultado) {
    return (
      <ul className="mt-4 space-y-2">
        {alternativas.map(({ letra, texto }) => {
          const correta = letra === resultado.gabarito;
          const minha = letra === resultado.minhaLetra;

          return (
            <li
              key={letra}
              className={`${CAIXA} ${
                correta
                  ? "border-marinho-300 bg-marinho-50"
                  : minha
                    ? "border-laranja-300 bg-laranja-50"
                    : "border-creme-200 bg-white"
              }`}
            >
              {/* Em certo/errado a letra não diz nada ao aluno: o que importa
                  é a palavra, que já está no texto da alternativa. */}
              {!certoErrado && (
                <span
                  className={`${LETRA} ${
                    correta
                      ? "bg-marinho-700 text-white"
                      : minha
                        ? "bg-laranja-500 text-white"
                        : "bg-creme text-marinho-600"
                  }`}
                >
                  {letra}
                </span>
              )}

              <Texto html={texto} />

              {(correta || minha) && (
                <span
                  className={`shrink-0 text-xs font-semibold ${
                    correta ? "text-marinho-700" : "text-laranja-600"
                  }`}
                >
                  {correta ? "Gabarito" : "Sua resposta"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  // Certo/errado são duas opções, não uma lista: viram dois botões largos, sem
  // letra e sem tesoura — riscar uma de duas alternativas não ajuda ninguém.
  if (certoErrado) {
    return (
      <fieldset className="mt-4">
        <legend className="sr-only">Resposta da questão {codigo}</legend>

        <div className="flex flex-wrap gap-3">
          {alternativas.map(({ letra, texto }) => (
            <label key={letra} className="min-w-32 flex-1 cursor-pointer">
              <input
                type="radio"
                name="letra"
                value={letra}
                required
                className="peer sr-only"
              />

              <span className="flex items-center justify-center rounded-xl border border-creme-200 bg-white px-6 py-4 text-sm font-semibold text-marinho-800 transition-colors hover:border-marinho-200 peer-checked:border-marinho-400 peer-checked:bg-marinho-50 peer-focus-visible:ring-2 peer-focus-visible:ring-marinho-200">
                <span dangerouslySetInnerHTML={{ __html: texto }} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset className="mt-4">
      <legend className="sr-only">Alternativas da questão {codigo}</legend>

      <div className="space-y-2">
        {alternativas.map(({ letra, texto }) => {
          const riscada = riscadas.has(letra);

          return (
            <div key={letra} className="group flex items-start gap-1">
              <label className="block min-w-0 flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="letra"
                  value={letra}
                  required
                  // Escolher uma alternativa riscada é mudar de ideia: o risco
                  // sai sozinho, em vez de brigar com quem acabou de decidir.
                  onChange={() => desfazerRisco(letra)}
                  className="peer sr-only"
                />

                <span
                  className={`${CAIXA} border-creme-200 bg-white hover:border-marinho-200 peer-checked:border-marinho-400 peer-checked:bg-marinho-50 peer-focus-visible:ring-2 peer-focus-visible:ring-marinho-200 ${
                    riscada ? "bg-creme/60" : ""
                  }`}
                >
                  <span
                    className={`${LETRA} ${
                      riscada
                        ? "bg-creme-200 text-marinho-400"
                        : "bg-creme text-marinho-700"
                    }`}
                  >
                    {letra}
                  </span>

                  <Texto html={texto} riscada={riscada} />
                </span>
              </label>

              <button
                type="button"
                onClick={() => alternarRisco(letra)}
                aria-pressed={riscada}
                aria-label={
                  riscada
                    ? `Desfazer o risco da alternativa ${letra}`
                    : `Riscar a alternativa ${letra}`
                }
                title={riscada ? "Desfazer risco" : "Riscar alternativa"}
                className={`mt-2.5 shrink-0 rounded-lg p-1.5 transition-colors focus-visible:opacity-100 ${
                  riscada
                    ? "text-laranja-600 hover:bg-laranja-50"
                    : // Discreta no computador, sempre visível no toque: onde
                      // não há hover, um botão escondido é um botão inexistente.
                      "text-marinho-300 opacity-100 hover:bg-creme hover:text-marinho-600 sm:opacity-0 sm:group-hover:opacity-100"
                }`}
              >
                {riscada ? <IconeDesfazer /> : <IconeTesoura />}
              </button>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
