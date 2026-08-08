import type { Letter } from "@/generated/prisma/enums";
import { Video } from "@/components/questao/video";
import { Abas, type Aba } from "@/components/ui/abas";
import type { Resolucao as DadosResolucao } from "@/lib/questoes/consulta";
import { urlDeEmbed } from "@/lib/video";

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
  // A URL é resolvida aqui, e não dentro do player, porque é ela que decide se
  // a aba de vídeo existe. Provedor ainda sem player (Panda, Mux) não ganha aba.
  const urlVideo = dados.video
    ? urlDeEmbed(dados.video.provider, dados.video.id)
    : null;

  const abas: Aba[] = [
    {
      id: "comentario",
      rotulo: "Gabarito comentado",
      conteudo: (
        /*
          HTML já sanitizado na escrita (ver CLAUDE.md); aqui é só renderização.
          A classe `.conteudo-rico` dá a tipografia definida em globals.css.
        */
        <div
          className="conteudo-rico text-marinho-700"
          dangerouslySetInnerHTML={{ __html: dados.comentario }}
        />
      ),
    },
  ];

  if (urlVideo) {
    abas.push({
      id: "video",
      rotulo: "Resolução em vídeo",
      conteudo: <Video url={urlVideo} codigo={codigo} />,
    });
  }

  return (
    <div className="mt-5 border-t border-creme-200 pt-5">
      <div
        role="status"
        className={`mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-4 py-3 text-sm ${
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

      <Abas abas={abas} rotulo={`Resolução da questão ${codigo}`} />
    </div>
  );
}
