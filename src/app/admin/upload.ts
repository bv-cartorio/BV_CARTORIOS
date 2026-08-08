"use server";

import { exigirPapel } from "@/lib/auth/guardas";
import { enviarImagem, type ResultadoUpload } from "@/lib/storage";

/**
 * Recebe a imagem do editor e devolve a URL pública.
 *
 * Fica separada das actions de questão porque o editor é reaproveitado — o blog
 * (módulo 9) vai usar o mesmo caminho.
 */
export async function enviarImagemDoEditor(
  dados: FormData,
): Promise<ResultadoUpload> {
  await exigirPapel(["ADMIN"], "/admin");

  const arquivo = dados.get("arquivo");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, erro: "Nenhum arquivo recebido." };
  }

  return enviarImagem(arquivo);
}
