"use client";

import Link from "next/link";
import { useActionState } from "react";

import { entrar, type EstadoFormulario } from "@/app/(auth)/acoes";
import { Alerta } from "@/components/ui/alerta";
import { BotaoEnvio } from "@/components/ui/botao-envio";
import { Campo } from "@/components/ui/campo";

const INICIAL: EstadoFormulario = {};

export function FormularioEntrar({ destino }: { destino?: string }) {
  const [estado, acao] = useActionState(entrar, INICIAL);

  return (
    <form action={acao} className="space-y-4" noValidate>
      {destino && <input type="hidden" name="destino" value={destino} />}

      {estado.erro && <Alerta>{estado.erro}</Alerta>}

      <Campo
        rotulo="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="voce@exemplo.com"
        defaultValue={estado.valores?.email}
      />

      <Campo
        rotulo="Senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        required
      />

      <BotaoEnvio carregando="Entrando...">Entrar</BotaoEnvio>

      <div className="flex flex-col gap-2 pt-2 text-center text-sm">
        <Link
          href="/recuperar-senha"
          className="text-marinho-600 hover:text-marinho-900"
        >
          Esqueci minha senha
        </Link>
        <p className="text-marinho-500">
          Ainda não tem conta?{" "}
          <Link
            href="/cadastrar"
            className="font-medium text-marinho-700 hover:text-marinho-900"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </form>
  );
}
