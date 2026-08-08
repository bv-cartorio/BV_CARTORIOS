"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { salvarQuestao } from "@/app/admin/questoes/acoes";
import { QUESTAO_INICIAL } from "@/app/admin/questoes/estados";
import { EditorRico } from "@/components/admin/editor/editor-rico";
import { Selecao } from "@/components/ui/selecao";
import type { Letter, QuestionType } from "@/generated/prisma/enums";
import type { QuestaoParaEdicao } from "@/lib/questoes/admin";
import type { Taxonomia } from "@/lib/questoes/consulta";
import { ROTULO_DIFICULDADE, ROTULO_TIPO } from "@/lib/questoes/rotulos";

const LETRAS: Letter[] = ["A", "B", "C", "D", "E"];

type FormularioProps = {
  taxonomia: Taxonomia;
  questao?: QuestaoParaEdicao;
  imagensLigadas: boolean;
};

const CAMPO =
  "mt-1 block w-full rounded-lg border border-creme-200 px-3 py-2 text-sm text-marinho-900 outline-none transition-colors placeholder:text-marinho-300 focus:border-marinho-400 focus:ring-2 focus:ring-marinho-100";

const ROTULO = "block text-xs font-medium text-marinho-600";

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-creme-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-marinho-600 uppercase">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function FormularioQuestao({
  taxonomia,
  questao,
  imagensLigadas,
}: FormularioProps) {
  const acao = useMemo(
    () => salvarQuestao.bind(null, questao?.id ?? null),
    [questao?.id],
  );
  const [estado, salvar, pendente] = useActionState(acao, QUESTAO_INICIAL);

  const [tipo, setTipo] = useState<QuestionType>(
    questao?.type ?? "MULTIPLE_CHOICE",
  );
  const [gabarito, setGabarito] = useState<Letter>(questao?.answerKey ?? "A");
  const [materia, setMateria] = useState(questao?.subjectId ?? "");
  const [assunto, setAssunto] = useState(questao?.topicId ?? "");
  const [subassunto, setSubassunto] = useState(questao?.subtopicId ?? "");

  const assuntos =
    taxonomia.materias.find((m) => m.id === materia)?.assuntos ?? [];
  const subassuntos = assuntos.find((a) => a.id === assunto)?.subassuntos ?? [];

  const textoDe = (letra: Letter) =>
    questao?.alternatives.find((a) => a.letter === letra)?.text ?? "";

  function trocarTipo(novo: QuestionType) {
    setTipo(novo);
    // Certo/errado só tem A e B: um gabarito em C, D ou E ficaria apontando
    // para alternativa que deixou de existir.
    if (novo === "TRUE_FALSE" && gabarito !== "A" && gabarito !== "B") {
      setGabarito("A");
    }
  }

  const respondida = (questao?._count.answers ?? 0) > 0;

  return (
    <form action={salvar} className="space-y-5">
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="gabarito" value={gabarito} />
      <input type="hidden" name="materiaId" value={materia} />
      <input type="hidden" name="assuntoId" value={assunto} />
      <input type="hidden" name="subassuntoId" value={subassunto} />

      {estado.erro && (
        <div
          role="alert"
          className="rounded-lg border border-laranja-200 bg-laranja-50 px-4 py-3 text-sm text-laranja-700"
        >
          {estado.erro}
        </div>
      )}

      {estado.aviso && (
        <div
          role="status"
          className="rounded-lg border border-marinho-200 bg-marinho-50 px-4 py-3 text-sm text-marinho-800"
        >
          {estado.aviso}{" "}
          <Link href="/admin/questoes" className="font-medium underline">
            Voltar à lista
          </Link>
        </div>
      )}

      <Secao titulo="Formato">
        <div className="flex flex-wrap gap-2">
          {(["MULTIPLE_CHOICE", "TRUE_FALSE"] as QuestionType[]).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => trocarTipo(opcao)}
              aria-pressed={tipo === opcao}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                tipo === opcao
                  ? "border-marinho-400 bg-marinho-50 text-marinho-900"
                  : "border-creme-200 text-marinho-600 hover:border-marinho-200"
              }`}
            >
              {ROTULO_TIPO[opcao]}
            </button>
          ))}
        </div>

        {respondida && (
          <p className="mt-3 text-xs text-marinho-500">
            Esta questão já foi respondida {questao?._count.answers} vez(es).
            Alterar o gabarito recalcula o acerto dessas respostas.
          </p>
        )}
      </Secao>

      <Secao titulo="Enunciado">
        <EditorRico
          name="enunciado"
          rotulo="Texto da questão"
          conteudoInicial={questao?.statement}
          imagensLigadas={imagensLigadas}
          ajuda={
            imagensLigadas
              ? undefined
              : "Envio de imagem desligado: faltam as variáveis R2_* no ambiente."
          }
        />
      </Secao>

      <Secao titulo="Alternativas e gabarito">
        {tipo === "TRUE_FALSE" ? (
          <div className="flex flex-wrap gap-2">
            {(["A", "B"] as Letter[]).map((letra) => (
              <button
                key={letra}
                type="button"
                onClick={() => setGabarito(letra)}
                aria-pressed={gabarito === letra}
                className={`rounded-lg border px-6 py-3 text-sm font-semibold transition-colors ${
                  gabarito === letra
                    ? "border-marinho-400 bg-marinho-50 text-marinho-900"
                    : "border-creme-200 text-marinho-600 hover:border-marinho-200"
                }`}
              >
                {letra === "A" ? "Certo" : "Errado"}
              </button>
            ))}

            <p className="mt-2 w-full text-xs text-marinho-500">
              Escolha qual é a afirmação correta. As duas alternativas são fixas
              — não há texto a escrever.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {LETRAS.map((letra) => (
              <div key={letra} className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setGabarito(letra)}
                  aria-pressed={gabarito === letra}
                  aria-label={`Marcar ${letra} como gabarito`}
                  title="Marcar como gabarito"
                  className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    gabarito === letra
                      ? "bg-marinho-700 text-white"
                      : "bg-creme text-marinho-600 hover:bg-creme-200"
                  }`}
                >
                  {letra}
                </button>

                <textarea
                  name={`alternativa_${letra}`}
                  rows={2}
                  defaultValue={textoDe(letra)}
                  placeholder={`Texto da alternativa ${letra}`}
                  className={`${CAMPO} mt-0`}
                />
              </div>
            ))}

            <p className="text-xs text-marinho-500">
              Clique na letra para definir o gabarito. Alternativa em branco é
              ignorada — dá para ter questões de quatro alternativas.
            </p>
          </div>
        )}
      </Secao>

      <Secao titulo="Comentário do professor">
        <EditorRico
          name="comentario"
          rotulo="Fundamentação, doutrina e jurisprudência"
          conteudoInicial={questao?.explanation}
          imagensLigadas={imagensLigadas}
          ajuda="Obrigatório para publicar. Em rascunho pode ficar pendente."
        />
      </Secao>

      <Secao titulo="Classificação">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Selecao
            rotulo="Matéria"
            id="materia"
            value={materia}
            required
            vazio="Escolha a matéria"
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
            id="assunto"
            value={assunto}
            disabled={assuntos.length === 0}
            vazio={materia ? "Sem assunto" : "Escolha a matéria antes"}
            opcoes={assuntos.map((a) => ({ valor: a.id, rotulo: a.nome }))}
            onChange={(evento) => {
              setAssunto(evento.target.value);
              setSubassunto("");
            }}
          />

          <Selecao
            rotulo="Subassunto"
            id="subassunto"
            value={subassunto}
            disabled={subassuntos.length === 0}
            vazio={assunto ? "Sem subassunto" : "Escolha o assunto antes"}
            opcoes={subassuntos.map((s) => ({ valor: s.id, rotulo: s.nome }))}
            onChange={(evento) => setSubassunto(evento.target.value)}
          />

          <Selecao
            rotulo="Banca"
            name="bancaId"
            defaultValue={questao?.boardId ?? ""}
            vazio="Sem banca"
            opcoes={taxonomia.bancas.map((b) => ({
              valor: b.id,
              rotulo: b.nome,
            }))}
          />

          <div>
            <label htmlFor="ano" className={ROTULO}>
              Ano da prova
            </label>
            <input
              id="ano"
              name="ano"
              type="number"
              min={1980}
              max={2100}
              defaultValue={questao?.year ?? ""}
              placeholder="2024"
              className={CAMPO}
            />
          </div>

          <Selecao
            rotulo="Dificuldade"
            name="dificuldade"
            defaultValue={questao?.difficulty ?? ""}
            vazio="Não classificada"
            opcoes={(["EASY", "MEDIUM", "HARD"] as const).map((d) => ({
              valor: d,
              rotulo: ROTULO_DIFICULDADE[d],
            }))}
          />

          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="origem" className={ROTULO}>
              Origem
            </label>
            <input
              id="origem"
              name="origem"
              maxLength={160}
              defaultValue={questao?.source ?? ""}
              placeholder="ENAC 2024 — TJSP, ou Inédita"
              className={CAMPO}
            />
          </div>
        </div>
      </Secao>

      <Secao titulo="Vídeo de resolução">
        <div className="grid gap-3 sm:grid-cols-2">
          <Selecao
            rotulo="Provedor"
            name="videoProvider"
            defaultValue={questao?.videoProvider ?? ""}
            vazio="Sem vídeo"
            opcoes={[
              { valor: "YOUTUBE", rotulo: "YouTube" },
              { valor: "VIMEO", rotulo: "Vimeo" },
              { valor: "PANDA", rotulo: "Panda Video (player pendente)" },
              { valor: "MUX", rotulo: "Mux (player pendente)" },
            ]}
          />

          <div>
            <label htmlFor="videoId" className={ROTULO}>
              ID do vídeo
            </label>
            <input
              id="videoId"
              name="videoId"
              maxLength={120}
              defaultValue={questao?.videoId ?? ""}
              placeholder="dQw4w9WgXcQ"
              className={CAMPO}
            />
            <p className="mt-1.5 text-xs text-marinho-500">
              Só o identificador, nunca a URL inteira — a aplicação não hospeda
              vídeo.
            </p>
          </div>
        </div>
      </Secao>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-2xl border border-creme-200 bg-white/95 p-4 backdrop-blur">
        <button
          type="submit"
          name="acao"
          value="publicar"
          disabled={pendente}
          className="rounded-lg bg-laranja-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-laranja-600 disabled:opacity-60"
        >
          {pendente ? "Salvando..." : "Publicar"}
        </button>

        <button
          type="submit"
          name="acao"
          value="revisao"
          disabled={pendente}
          className="rounded-lg border border-creme-200 px-4 py-2.5 text-sm font-medium text-marinho-700 transition-colors hover:border-marinho-200 disabled:opacity-60"
        >
          Enviar para revisão
        </button>

        <button
          type="submit"
          name="acao"
          value="rascunho"
          disabled={pendente}
          className="rounded-lg border border-creme-200 px-4 py-2.5 text-sm font-medium text-marinho-700 transition-colors hover:border-marinho-200 disabled:opacity-60"
        >
          Salvar rascunho
        </button>

        {questao?.status === "PUBLISHED" && (
          <button
            type="submit"
            name="acao"
            value="desativar"
            disabled={pendente}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-marinho-500 transition-colors hover:text-laranja-700 disabled:opacity-60"
          >
            Desativar
          </button>
        )}

        <Link
          href="/admin/questoes"
          className="ml-auto text-sm font-medium text-marinho-600 hover:text-marinho-900"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
