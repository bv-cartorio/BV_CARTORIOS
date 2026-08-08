import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

/** Falhas toleradas na janela, por e-mail e por IP. */
const LIMITE_POR_EMAIL = 5;
const LIMITE_POR_IP = 20;
const JANELA_MINUTOS = 15;

export async function obterIp(): Promise<string | null> {
  const cabecalhos = await headers();
  return cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

/**
 * Verifica se o login deve ser barrado por excesso de tentativas.
 *
 * Dois limites: um por e-mail, que trava o ataque a uma conta específica, e um
 * por IP, mais folgado, contra varredura de várias contas a partir da mesma
 * origem. O limite por IP precisa ser generoso — cartório, escritório e rede
 * corporativa saem todos pelo mesmo endereço.
 */
export async function loginBloqueado(
  email: string,
  ip: string | null,
): Promise<boolean> {
  const desde = new Date(Date.now() - JANELA_MINUTOS * 60 * 1000);

  const [falhasEmail, falhasIp] = await Promise.all([
    prisma.loginAttempt.count({
      where: { email, succeeded: false, createdAt: { gte: desde } },
    }),
    ip
      ? prisma.loginAttempt.count({
          where: { ip, succeeded: false, createdAt: { gte: desde } },
        })
      : Promise.resolve(0),
  ]);

  return falhasEmail >= LIMITE_POR_EMAIL || falhasIp >= LIMITE_POR_IP;
}

export async function registrarTentativa(
  email: string,
  ip: string | null,
  succeeded: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({ data: { email, ip, succeeded } });
}

/**
 * Limpa o histórico de falhas do e-mail após um login bem-sucedido, para que
 * tentativas antigas não contem contra a pessoa legítima.
 */
export async function limparFalhas(email: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { email, succeeded: false } });
}

export const MINUTOS_DE_BLOQUEIO = JANELA_MINUTOS;
