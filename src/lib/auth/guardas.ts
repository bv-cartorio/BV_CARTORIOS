import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";
import { obterUsuario, type UsuarioSessao } from "@/lib/auth/sessao";
import { prisma } from "@/lib/prisma";

/**
 * Exige sessão. Redireciona para o login preservando o destino, para que a
 * pessoa volte ao ponto onde estava depois de entrar.
 */
export async function exigirUsuario(destino?: string): Promise<UsuarioSessao> {
  const usuario = await obterUsuario();

  if (!usuario) {
    const query = destino ? `?destino=${encodeURIComponent(destino)}` : "";
    redirect(`/entrar${query}`);
  }

  return usuario;
}

/**
 * Exige um dos papéis informados.
 *
 * O `destino` é repassado ao login: sem ele, quem chega direto a `/admin` sem
 * sessão entra e cai no painel do aluno, tendo de navegar de novo até onde
 * queria. Quem tem sessão mas não tem o papel vai para o painel — está
 * autenticado, só não é lugar dele.
 */
export async function exigirPapel(
  papeis: Role[],
  destino?: string,
): Promise<UsuarioSessao> {
  const usuario = await exigirUsuario(destino);

  if (!papeis.includes(usuario.role)) {
    redirect("/painel");
  }

  return usuario;
}

/**
 * Assinatura vigente do usuário, ou `null`.
 *
 * `PAST_DUE` conta como ativa de propósito: é o pagamento atrasado em carência,
 * e cortar o acesso de quem está prestes a regularizar gera mais atrito do que
 * protege. Quem cancelou também mantém acesso até `endsAt` — pagou pelo período.
 *
 * Enquanto o módulo da Hotmart não existir, esta consulta simplesmente não
 * encontra nada; quando ele entrar, passa a encontrar sem que a guarda mude.
 */
export async function assinaturaVigente(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "PAST_DUE"] },
      endsAt: { gt: new Date() },
    },
    orderBy: { endsAt: "desc" },
    select: {
      id: true,
      endsAt: true,
      status: true,
      autoRenew: true,
      plan: { select: { name: true, slug: true } },
    },
  });
}

export async function temAssinaturaVigente(userId: string): Promise<boolean> {
  return (await assinaturaVigente(userId)) !== null;
}

/**
 * Exige sessão **e** assinatura vigente. Quem tem conta mas não assinou é
 * levado aos planos, não à tela de login — já está autenticado.
 */
export async function exigirAssinatura(
  destino?: string,
): Promise<UsuarioSessao> {
  const usuario = await exigirUsuario(destino);

  if (!(await temAssinaturaVigente(usuario.id))) {
    redirect("/assinatura");
  }

  return usuario;
}
