import type { VideoProvider } from "@/generated/prisma/enums";
import { urlDeEmbed } from "@/lib/video";

type VideoProps = {
  id: string;
  provider: VideoProvider;
  codigo: number;
};

/** Vídeo de resolução da questão. Some quando o provedor ainda não tem player. */
export function Video({ id, provider, codigo }: VideoProps) {
  const url = urlDeEmbed(provider, id);

  if (!url) return null;

  return (
    <div className="mt-5">
      <h4 className="mb-2 text-sm font-semibold text-marinho-800">
        Resolução em vídeo
      </h4>

      <div className="aspect-video overflow-hidden rounded-xl border border-creme-200 bg-marinho-900">
        <iframe
          src={url}
          title={`Resolução em vídeo da questão ${codigo}`}
          // `lazy` evita baixar o player das questões que o aluno nem rolou.
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
