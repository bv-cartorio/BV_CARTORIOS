import { z } from "zod";

/**
 * Validação das variáveis de ambiente do servidor.
 *
 * Falha cedo e com mensagem clara em vez de quebrar em runtime no meio de uma
 * requisição. Toda nova variável precisa ser documentada em `.env.example`.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL deve ser uma URL de conexão válida"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** URL pública da aplicação, usada em e-mails e callbacks de webhook. */
  APP_URL: z.string().url().default("http://localhost:3000"),
});

type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    const detalhes = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${detalhes}`);
  }

  cached = parsed.data;
  return cached;
}
