"use client";

import Link from "next/link";
import { useActionState } from "react";

import { cadastrar, type EstadoFormulario } from "@/app/(auth)/acoes";
import { Alerta } from "@/components/ui/alerta";
import { BotaoEnvio } from "@/components/ui/botao-envio";
import { Campo } from "@/components/ui/campo";

const INICIAL: EstadoFormulario = {};

export function FormularioCadastrar() {
  const [estado, acao] = useActionState(cadastrar, INICIAL);

  if (estado.sucesso) {
    return <Alerta tipo="sucesso">{estado.sucesso}</Alerta>;
  }

  return (
    <form action={acao} className="space-y-4" noValidate>
      {estado.erro && <Alerta>{estado.erro}</Alerta>}

      <Campo
        rotulo="Nome completo"
        name="nome"
        autoComplete="name"
        required
        placeholder="Maria de Souza"
        defaultValue={estado.valores?.nome}
      />

      <Campo
        rotulo="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="voce@exemplo.com"
        ajuda="Se você já comprou na Hotmart, use o mesmo e-mail da compra."
        defaultValue={estado.valores?.email}
      />

      <Campo
        rotulo="Senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        ajuda="Pelo menos 8 caracteres."
      />

      <BotaoEnvio carregando="Criando conta...">Criar conta</BotaoEnvio>

      <p className="pt-2 text-center text-sm text-marinho-500">
        Já tem conta?{" "}
        <Link
          href="/entrar"
          className="font-medium text-marinho-700 hover:text-marinho-900"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
