import { createHash, randomBytes } from "node:crypto";

import type { TokenPurpose } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/** Validade dos links enviados por e-mail. */
const VALIDADE_HORAS: Record<TokenPurpose, number> = {
  PASSWORD_RESET: 24,
  EMAIL_VERIFICATION: 72,
};

/**
 * O token viaja no link; o banco guarda apenas o hash.
 *
 * SHA-256 sem sal é adequado aqui — diferente de senha, o token tem 256 bits de
 * entropia, então não há dicionário nem força bruta viável contra ele.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Cria um token de uso único e invalida os anteriores do mesmo propósito.
 *
 * Invalidar os antigos evita que um link pedido semanas atrás continue
 * funcionando depois que a pessoa pediu um novo.
 */
export async function criarToken(
  userId: string,
  purpose: TokenPurpose,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + VALIDADE_HORAS[purpose] * 60 * 60 * 1000,
  );

  await prisma.$transaction([
    prisma.userToken.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.userToken.create({
      data: { userId, purpose, tokenHash: hashToken(token), expiresAt },
    }),
  ]);

  return token;
}

/**
 * Consome um token: devolve o id do usuário e o marca como usado.
 *
 * A marcação acontece na mesma operação da leitura (`updateMany` com filtro de
 * `usedAt: null`), de modo que duas requisições simultâneas com o mesmo link
 * não conseguem ambas ter sucesso.
 */
export async function consumirToken(
  token: string,
  purpose: TokenPurpose,
): Promise<string | null> {
  const tokenHash = hashToken(token);

  const registro = await prisma.userToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, purpose: true, expiresAt: true },
  });

  if (
    !registro ||
    registro.purpose !== purpose ||
    registro.expiresAt < new Date()
  ) {
    return null;
  }

  const consumido = await prisma.userToken.updateMany({
    where: { id: registro.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  return consumido.count === 1 ? registro.userId : null;
}

/** Verifica se o token é válido sem consumi-lo (para renderizar o formulário). */
export async function tokenValido(
  token: string,
  purpose: TokenPurpose,
): Promise<boolean> {
  const registro = await prisma.userToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { purpose: true, expiresAt: true, usedAt: true },
  });

  return Boolean(
    registro &&
      registro.purpose === purpose &&
      registro.usedAt === null &&
      registro.expiresAt > new Date(),
  );
}
