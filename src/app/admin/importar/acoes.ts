"use server";

import { revalidatePath } from "next/cache";

import type { EstadoImportacao } from "@/app/admin/importar/estados";
import { exigirPapel } from "@/lib/auth/guardas";
import { processarCsv } from "@/lib/questoes/importar";

const LIMITE_BYTES = 10 * 1024 * 1024;

export async function importarCsv(
  _anterior: EstadoImportacao,
  dados: FormData,
): Promise<EstadoImportacao> {
  await exigirPapel(["ADMIN"], "/admin/importar");

  const arquivo = dados.get("arquivo");
  const gravar = dados.get("gravar") === "1";

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Escolha um arquivo CSV." };
  }

  if (arquivo.size > LIMITE_BYTES) {
    return { erro: "Arquivo acima de 10 MB. Divida a planilha em partes." };
  }

  try {
    const resultado = await processarCsv(await arquivo.arrayBuffer(), gravar);

    if (gravar) {
      revalidatePath("/admin/questoes");
      revalidatePath("/painel/questoes");
    }

    return { resultado, gravou: gravar };
  } catch (erro) {
    return {
      erro:
        erro instanceof Error
          ? `Falha ao processar: ${erro.message}`
          : "Falha ao processar o arquivo.",
    };
  }
}
