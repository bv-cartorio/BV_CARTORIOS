import type { Letter } from "@/generated/prisma/enums";
import { Video } from "@/components/questao/video";
import type { Resolucao as DadosResolucao } from "@/lib/questoes/consulta";

type ResolucaoProps = {
  codigo: number;
  minhaLetra: Letter;
  acertei: boolean;
  dados: DadosResolucao;
};

export function Resolucao({
  codigo,
  minhaLetra,
  acertei,
  dados,
}: ResolucaoProps) {
  return (
    <div className="mt-5 border-t border-creme-200 pt-5">
      <div
        role="status"
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-4 py-3 text-sm ${
          acertei
            ? "border-marinho-200 bg-marinho-50 text-marinho-800"
            : "border-laranja-200 bg-laranja-50 text-laranja-700"
        }`}
      >
        <strong className="font-semibold">
          {acertei ? "Você acertou." : "Você errou."}
        </strong>
        <span>
          Sua resposta: <strong className="font-semibold">{minhaLetra}</strong>.
          {!acertei && (
            <>
              {" "}
              Gabarito:{" "}
              <strong className="font-semibold">{dados.gabarito}</strong>.
            </>
          )}
        </span>
      </div>

      <h4 className="mt-5 mb-2 text-sm font-semibold text-marinho-800">
        Comentário do professor
      </h4>

      {/*
        HTML já sanitizado na escrita (ver CLAUDE.md); aqui é só renderização.
        A classe `.conteudo-rico` dá a tipografia definida em globals.css.
      */}
      <div
        className="conteudo-rico text-marinho-700"
        dangerouslySetInnerHTML={{ __html: dados.comentario }}
      />

      {dados.video && (
        <Video
          id={dados.video.id}
          provider={dados.video.provider}
          codigo={codigo}
        />
      )}
    </div>
  );
}
