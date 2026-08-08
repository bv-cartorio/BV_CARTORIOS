/**
 * Vídeo de resolução.
 *
 * O banco guarda apenas `videoId` + `videoProvider` (ver CLAUDE.md): arquivo de
 * vídeo nunca é hospedado pela aplicação. Aqui só se monta a URL do player.
 *
 * Panda e Mux ficam sem URL de propósito: o player do Panda depende do
 * identificador da biblioteca da conta e o do Mux exige o componente próprio —
 * dois dados que só existem depois da escolha do serviço de vídeo, pendência
 * registrada no roadmap para o módulo 3. Enquanto isso, `null` faz a interface
 * simplesmente não exibir o bloco, em vez de mostrar um player quebrado.
 */
import type { VideoProvider } from "@/generated/prisma/enums";

export function urlDeEmbed(
  provider: VideoProvider,
  videoId: string,
): string | null {
  const id = encodeURIComponent(videoId);

  switch (provider) {
    case "YOUTUBE":
      // Domínio sem cookie: não marca o aluno com cookie de publicidade.
      return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
    case "VIMEO":
      return `https://player.vimeo.com/video/${id}`;
    case "PANDA":
    case "MUX":
      return null;
  }
}
