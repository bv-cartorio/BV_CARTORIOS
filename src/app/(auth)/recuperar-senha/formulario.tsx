"use client";

import Link from "next/link";
import { useActionState } from "react";

import { pedirRecuperacao, type EstadoFormulario } from "@/app/(auth)/acoes";
import { Alerta } from "@/components/ui/alerta";
import { BotaoEnvio } from "@/components/ui/botao-envio";
import { Campo } from "@/components/ui/campo";

const INICIAL: EstadoFormulario = {};

export function FormularioRecuperar() {
  const [estado, acao] = useActionState(pedirRecuperacao, INICIAL);

  if (estado.sucesso) {
    return (
      <div className="space-y-4">
        <Alerta tipo="sucesso">{estado.sucesso}</Alerta>
        <Link
          href="/entrar"
          className="block text-center text-sm text-marinho-600 hover:text-marinho-900"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4" noValidate>
      <Campo
        rotulo="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="voce@exemplo.com"
      />

      <BotaoEnvio>Enviar link</BotaoEnvio>

      <p className="pt-2 text-center text-sm">
        <Link href="/entrar" className="text-marinho-600 hover:text-marinho-900">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
