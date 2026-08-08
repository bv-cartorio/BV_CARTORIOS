"use client";

import { useState } from "react";

import { AcoesQuestao } from "@/components/questao/acoes-questao";
import { BlocoResposta } from "@/components/questao/bloco-resposta";
import type { Difficulty } from "@/generated/prisma/enums";
import type { QuestaoLista } from "@/lib/questoes/consulta";

const DIFICULDADE: Record<Difficulty, string> = {
  EASY: "Fácil",
  MEDIUM: "Média",
  HARD: "Difícil",
};

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-creme px-2 py-0.5 text-xs font-medium text-marinho-600">
      {children}
    </span>
  );
}

export function CartaoQuestao({ questao }: { questao: QuestaoLista }) {
  // Trocar a tentativa remonta o bloco de resposta e descarta o resultado
  // anterior — é o "responder de novo".
  const [tentativa, setTentativa] = useState(0);

  return (
    <article className="rounded-2xl border border-creme-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-marinho-800">
          Questão {questao.codigo}
        </span>

        <Etiqueta>{questao.materia}</Etiqueta>
        {questao.assunto && <Etiqueta>{questao.assunto}</Etiqueta>}
        {questao.subassunto && <Etiqueta>{questao.subassunto}</Etiqueta>}
        {questao.banca && <Etiqueta>{questao.banca}</Etiqueta>}
        {questao.ano && <Etiqueta>{questao.ano}</Etiqueta>}
        {questao.dificuldade && (
          <Etiqueta>{DIFICULDADE[questao.dificuldade]}</Etiqueta>
        )}
      </div>

      {questao.origem && (
        <p className="mt-1 text-xs text-marinho-500">{questao.origem}</p>
      )}

      {/* Enunciado em HTML sanitizado na escrita (ver CLAUDE.md). */}
      <div
        className="conteudo-rico mt-4 text-marinho-800"
        dangerouslySetInnerHTML={{ __html: questao.enunciado }}
      />

      <BlocoResposta
        key={tentativa}
        questionId={questao.id}
        codigo={questao.codigo}
        tipo={questao.tipo}
        alternativas={questao.alternativas}
        respostaAnterior={tentativa === 0 ? questao.minhaResposta : null}
        resolucaoAnterior={tentativa === 0 ? questao.resolucao : null}
        aoRefazer={() => setTentativa((atual) => atual + 1)}
      />

      <AcoesQuestao
        questionId={questao.id}
        codigo={questao.codigo}
        favoritaInicial={questao.favorita}
        anotacaoInicial={questao.anotacao}
      />
    </article>
  );
}
