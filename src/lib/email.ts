/**
 * Envio de e-mail transacional.
 *
 * O serviço ainda não foi escolhido (Resend ou Postmark — ver
 * `docs/ROADMAP.md`). Até lá, em desenvolvimento a mensagem é escrita no
 * console, o que permite construir e testar todos os fluxos; em produção o
 * envio falha de forma explícita, para que a ausência de configuração não passe
 * despercebida e alguém fique sem receber o link.
 *
 * Quando o serviço for definido, só esta função muda.
 */
import { getEnv } from "@/lib/env";

type Mensagem = {
  para: string;
  assunto: string;
  texto: string;
};

export async function enviarEmail({
  para,
  assunto,
  texto,
}: Mensagem): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Nenhum serviço de e-mail configurado. Defina o provedor antes de publicar.",
    );
  }

  console.info(
    ["", "─".repeat(70), `E-MAIL para ${para}`, assunto, "", texto, "─".repeat(70), ""].join(
      "\n",
    ),
  );
}

/** URL absoluta usada nos links enviados por e-mail. */
export function urlAbsoluta(caminho: string): string {
  return new URL(caminho, getEnv().APP_URL).toString();
}
