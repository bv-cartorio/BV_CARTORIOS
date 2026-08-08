import type { Metadata } from "next";
import Link from "next/link";

import { verificarEmail } from "@/app/(auth)/acoes";
import { Alerta } from "@/components/ui/alerta";

export const metadata: Metadata = { title: "Confirmação de e-mail" };

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const confirmado = token ? await verificarEmail(token) : false;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
        {confirmado ? "E-mail confirmado" : "Não foi possível confirmar"}
      </h1>

      <Alerta tipo={confirmado ? "sucesso" : "erro"}>
        {confirmado
          ? "Seu endereço de e-mail foi confirmado. Você já pode usar a plataforma normalmente."
          : "Este link de confirmação expirou ou já foi usado."}
      </Alerta>

      <Link
        href={confirmado ? "/painel" : "/entrar"}
        className="block rounded-lg bg-laranja-500 px-4 py-2.5 text-center font-semibold text-white transition-colors hover:bg-laranja-600"
      >
        {confirmado ? "Ir para o painel" : "Ir para o login"}
      </Link>
    </div>
  );
}
