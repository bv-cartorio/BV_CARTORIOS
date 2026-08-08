"use client";

import { useActionState } from "react";

import { definirSenha, type EstadoFormulario } from "@/app/(auth)/acoes";
import { Alerta } from "@/components/ui/alerta";
import { BotaoEnvio } from "@/components/ui/botao-envio";
import { Campo } from "@/components/ui/campo";

const INICIAL: EstadoFormulario = {};

export function FormularioDefinirSenha({ token }: { token: string }) {
  const [estado, acao] = useActionState(definirSenha, INICIAL);

  return (
    <form action={acao} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />

      {estado.erro && <Alerta>{estado.erro}</Alerta>}

      <Campo
        rotulo="Nova senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        ajuda="Pelo menos 8 caracteres."
      />

      <Campo
        rotulo="Repita a nova senha"
        name="confirmacao"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
      />

      <BotaoEnvio carregando="Salvando...">Salvar senha</BotaoEnvio>
    </form>
  );
}
