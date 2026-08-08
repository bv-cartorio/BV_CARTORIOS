/**
 * Armazenamento de imagens (Cloudflare R2, compatível com a API do S3).
 *
 * A aplicação nunca serve o arquivo: guarda no bucket e grava a URL pública
 * dentro do HTML do enunciado. Escolhemos R2 por ser independente de onde a
 * aplicação vai rodar — a hospedagem ainda é pendência do roadmap.
 *
 * Enquanto as credenciais não existirem, `configurado()` devolve `false` e o
 * upload falha com mensagem explícita, no mesmo espírito de `lib/email.ts`: é
 * melhor uma recusa clara do que uma imagem que some depois.
 */
import { createHash, randomBytes } from "node:crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { z } from "zod";

const envSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  /** Domínio público do bucket, ex.: https://arquivos.bvcartorio.com */
  R2_PUBLIC_URL: z.string().url(),
});

type Config = z.infer<typeof envSchema>;

function lerConfig(): Config | null {
  const parsed = envSchema.safeParse(process.env);
  return parsed.success ? parsed.data : null;
}

export function configurado(): boolean {
  return lerConfig() !== null;
}

/** Tipos aceitos. SVG fica de fora: é documento com script, não imagem. */
const TIPOS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

export type ResultadoUpload =
  | { ok: true; url: string }
  | { ok: false; erro: string };

let cliente: S3Client | null = null;

function obterCliente(config: Config): S3Client {
  cliente ??= new S3Client({
    region: "auto",
    endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
  });

  return cliente;
}

/**
 * Sobe a imagem e devolve a URL pública.
 *
 * O nome do arquivo é derivado do conteúdo (hash) mais um sufixo aleatório:
 * subir a mesma imagem duas vezes não gera colisão, e o nome original — que
 * pode trazer acento, espaço ou o nome de um aluno — nunca vaza para a URL.
 */
export async function enviarImagem(
  arquivo: File,
  prefixo = "questoes",
): Promise<ResultadoUpload> {
  const config = lerConfig();

  if (!config) {
    return {
      ok: false,
      erro: "Armazenamento de imagens não configurado. Preencha as variáveis R2_* (ver .env.example).",
    };
  }

  const extensao = TIPOS.get(arquivo.type);

  if (!extensao) {
    return {
      ok: false,
      erro: "Formato não aceito. Use JPG, PNG, WebP ou GIF.",
    };
  }

  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return {
      ok: false,
      erro: `Imagem acima de ${TAMANHO_MAXIMO_BYTES / 1024 / 1024} MB. Reduza antes de enviar.`,
    };
  }

  const conteudo = Buffer.from(await arquivo.arrayBuffer());
  const digest = createHash("sha256").update(conteudo).digest("hex").slice(0, 16);
  const chave = `${prefixo}/${digest}-${randomBytes(4).toString("hex")}.${extensao}`;

  await obterCliente(config).send(
    new PutObjectCommand({
      Bucket: config.R2_BUCKET,
      Key: chave,
      Body: conteudo,
      ContentType: arquivo.type,
      // Imagem de questão não muda depois de publicada: cache longo no CDN.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return {
    ok: true,
    url: `${config.R2_PUBLIC_URL.replace(/\/$/, "")}/${chave}`,
  };
}
