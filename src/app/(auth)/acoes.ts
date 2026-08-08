"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { criarSessao, encerrarSessao, encerrarTodasAsSessoes } from "@/lib/auth/sessao";
import { hashSenha, senhaSchema, verificarSenha } from "@/lib/auth/senha";
import { consumirToken, criarToken } from "@/lib/auth/tokens";
import {
  limparFalhas,
  loginBloqueado,
  MINUTOS_DE_BLOQUEIO,
  obterIp,
  registrarTentativa,
} from "@/lib/auth/limite";
import { enviarEmail, urlAbsoluta } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export type EstadoFormulario = {
  erro?: string;
  sucesso?: string;
  /**
   * O React 19 limpa o formulário ao fim de uma action. Devolver o que a pessoa
   * digitou (menos a senha) evita obrigá-la a redigitar tudo depois de um erro.
   */
  valores?: { email?: string; nome?: string };
};

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Informe um e-mail válido");

/** Destinos aceitos após o login: apenas caminhos internos. */
function destinoSeguro(valor: FormDataEntryValue | null): string {
  const destino = typeof valor === "string" ? valor : "";
  return destino.startsWith("/") && !destino.startsWith("//")
    ? destino
    : "/painel";
}

// ---------------------------------------------------------------------------
// Entrar
// ---------------------------------------------------------------------------

export async function entrar(
  _estado: EstadoFormulario,
  dados: FormData,
): Promise<EstadoFormulario> {
  const digitado =
    typeof dados.get("email") === "string" ? String(dados.get("email")) : "";
  const email = emailSchema.safeParse(digitado);
  const senha = z.string().min(1).safeParse(dados.get("senha"));

  if (!email.success || !senha.success) {
    return { erro: "Informe e-mail e senha.", valores: { email: digitado } };
  }

  const ip = await obterIp();

  if (await loginBloqueado(email.data, ip)) {
    return {
      erro: `Muitas tentativas seguidas. Aguarde ${MINUTOS_DE_BLOQUEIO} minutos e tente de novo, ou redefina sua senha.`,
      valores: { email: digitado },
    };
  }

  const usuario = await prisma.user.findUnique({
    where: { email: email.data },
    select: { id: true, password: true, deletedAt: true },
  });

  const senhaConfere = await verificarSenha(
    senha.data,
    usuario?.password ?? null,
  );

  if (!usuario || usuario.deletedAt || !senhaConfere) {
    await registrarTentativa(email.data, ip, false);
    // Mensagem única de propósito: dizer qual dos dois está errado entrega
    // a quem tenta invadir a informação de que o e-mail existe.
    return { erro: "E-mail ou senha incorretos.", valores: { email: digitado } };
  }

  await registrarTentativa(email.data, ip, true);
  await limparFalhas(email.data);
  await prisma.user.update({
    where: { id: usuario.id },
    data: { lastLoginAt: new Date() },
  });
  await criarSessao(usuario.id);

  redirect(destinoSeguro(dados.get("destino")));
}

// ---------------------------------------------------------------------------
// Criar conta
// ---------------------------------------------------------------------------

const cadastroSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  email: emailSchema,
  senha: senhaSchema,
});

export async function cadastrar(
  _estado: EstadoFormulario,
  dados: FormData,
): Promise<EstadoFormulario> {
  const entrada = cadastroSchema.safeParse({
    nome: dados.get("nome"),
    email: dados.get("email"),
    senha: dados.get("senha"),
  });

  const digitados = {
    nome: String(dados.get("nome") ?? ""),
    email: String(dados.get("email") ?? ""),
  };

  if (!entrada.success) {
    return {
      erro: entrada.error.issues[0]?.message ?? "Dados inválidos.",
      valores: digitados,
    };
  }

  const { nome, email, senha } = entrada.data;

  const existente = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  });

  if (existente) {
    // Conta sem senha utilizável é de quem comprou na Hotmart ou veio da
    // migração e nunca definiu uma. Em vez de barrar, mandamos o link.
    if (!existente.password) {
      await enviarLinkDeSenha(existente.id, email, nome);
      return {
        sucesso:
          "Você já tem uma conta criada pela sua compra. Enviamos um e-mail com o link para definir sua senha.",
      };
    }

    return {
      erro: "Já existe uma conta com este e-mail. Use “Entrar” ou recupere sua senha.",
      valores: digitados,
    };
  }

  const usuario = await prisma.user.create({
    data: { name: nome, email, password: await hashSenha(senha) },
    select: { id: true },
  });

  const token = await criarToken(usuario.id, "EMAIL_VERIFICATION");
  await enviarEmail({
    para: email,
    assunto: "Confirme seu e-mail — BV Cartórios",
    texto: [
      `Olá, ${nome}.`,
      "",
      "Confirme seu endereço de e-mail para concluir a criação da sua conta:",
      urlAbsoluta(`/verificar-email?token=${token}`),
      "",
      "Se não foi você quem criou a conta, ignore esta mensagem.",
    ].join("\n"),
  });

  await criarSessao(usuario.id);
  redirect("/painel");
}

// ---------------------------------------------------------------------------
// Recuperar senha
// ---------------------------------------------------------------------------

export async function pedirRecuperacao(
  _estado: EstadoFormulario,
  dados: FormData,
): Promise<EstadoFormulario> {
  const email = emailSchema.safeParse(dados.get("email"));

  // Resposta idêntica exista ou não a conta: a tela de recuperação não pode
  // virar um verificador de quais e-mails estão cadastrados.
  const resposta = {
    sucesso:
      "Se houver uma conta com esse e-mail, enviamos um link para definir uma nova senha. Verifique também a caixa de spam.",
  };

  if (!email.success) return resposta;

  const usuario = await prisma.user.findUnique({
    where: { email: email.data },
    select: { id: true, name: true, deletedAt: true },
  });

  if (usuario && !usuario.deletedAt) {
    await enviarLinkDeSenha(usuario.id, email.data, usuario.name);
  }

  return resposta;
}

async function enviarLinkDeSenha(
  userId: string,
  email: string,
  nome: string,
): Promise<void> {
  const token = await criarToken(userId, "PASSWORD_RESET");

  await enviarEmail({
    para: email,
    assunto: "Definir sua senha — BV Cartórios",
    texto: [
      `Olá, ${nome}.`,
      "",
      "Use o link abaixo para definir sua senha de acesso:",
      urlAbsoluta(`/definir-senha?token=${token}`),
      "",
      "O link vale por 24 horas e só pode ser usado uma vez.",
      "Se não foi você quem pediu, ignore esta mensagem — sua senha atual continua valendo.",
    ].join("\n"),
  });
}

// ---------------------------------------------------------------------------
// Definir senha
// ---------------------------------------------------------------------------

export async function definirSenha(
  _estado: EstadoFormulario,
  dados: FormData,
): Promise<EstadoFormulario> {
  const token = z.string().min(1).safeParse(dados.get("token"));
  const senha = senhaSchema.safeParse(dados.get("senha"));
  const confirmacao = dados.get("confirmacao");

  if (!token.success) {
    return { erro: "Link inválido. Peça um novo." };
  }

  if (!senha.success) {
    return { erro: senha.error.issues[0]?.message ?? "Senha inválida." };
  }

  if (senha.data !== confirmacao) {
    return { erro: "As senhas não coincidem." };
  }

  const userId = await consumirToken(token.data, "PASSWORD_RESET");

  if (!userId) {
    return {
      erro: "Este link expirou ou já foi usado. Peça um novo em “Esqueci minha senha”.",
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: await hashSenha(senha.data),
      mustResetPassword: false,
      // Definir a senha por um link enviado ao endereço prova o controle dele.
      emailVerifiedAt: new Date(),
    },
  });

  // Trocar a senha derruba as demais sessões: se alguém havia entrado
  // indevidamente, perde o acesso agora.
  await encerrarTodasAsSessoes(userId);
  await criarSessao(userId);

  redirect("/painel");
}

// ---------------------------------------------------------------------------
// Verificar e-mail e sair
// ---------------------------------------------------------------------------

export async function verificarEmail(token: string): Promise<boolean> {
  const userId = await consumirToken(token, "EMAIL_VERIFICATION");

  if (!userId) return false;

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });

  return true;
}

export async function sair(): Promise<void> {
  await encerrarSessao();
  redirect("/");
}
