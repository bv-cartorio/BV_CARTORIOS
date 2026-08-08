"use client";

import { useFormStatus } from "react-dom";

type BotaoEnvioProps = {
  children: React.ReactNode;
  carregando?: string;
};

/**
 * Botão de envio que se desabilita enquanto a action roda.
 *
 * Além do retorno visual, isso evita o clique duplo — que num formulário de
 * cadastro criaria duas contas e num de login gastaria duas tentativas.
 */
export function BotaoEnvio({
  children,
  carregando = "Enviando...",
}: BotaoEnvioProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-laranja-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-laranja-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? carregando : children}
    </button>
  );
}
