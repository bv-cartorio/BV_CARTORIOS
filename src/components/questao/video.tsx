type VideoProps = {
  /** URL de embed já resolvida — ver [`lib/video.ts`](../../lib/video.ts). */
  url: string;
  codigo: number;
};

export function Video({ url, codigo }: VideoProps) {
  return (
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
  );
}
