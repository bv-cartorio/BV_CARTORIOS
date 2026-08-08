import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";

import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const COOKIE = "bv_sessao";
/** Uma sessão dura 30 dias sem interação. */
const DURACAO_DIAS = 30;

export type UsuarioSessao = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Abre a sessão e grava o cookie.
 *
 * O cookie leva um token aleatório opaco; o banco guarda só o hash. Assim, um
 * vazamento do banco não permite forjar sessão de ninguém — e por isso não é
 * preciso assinar o cookie com segredo algum.
 */
export async function criarSessao(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000);

  const cabecalhos = await headers();

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ip: cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: cabecalhos.get("user-agent")?.slice(0, 500) ?? null,
    },
  });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Usuário da requisição atual, ou `null`.
 *
 * `cache` do React garante uma única consulta por requisição, mesmo que vários
 * componentes chamem esta função.
 */
export const obterUsuario = cache(async (): Promise<UsuarioSessao | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;

  if (!token) return null;

  const sessao = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!sessao || sessao.expiresAt < new Date() || sessao.user.deletedAt) {
    return null;
  }

  const { id, name, email, role } = sessao.user;
  return { id, name, email, role };
});

/** Encerra a sessão atual e apaga o cookie. */
export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  jar.delete(COOKIE);
}

/** Encerra todas as sessões do usuário — usado ao trocar a senha. */
export async function encerrarTodasAsSessoes(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}
