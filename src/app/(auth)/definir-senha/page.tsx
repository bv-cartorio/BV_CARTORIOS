import type { Metadata } from "next";
import Link from "next/link";

import { FormularioDefinirSenha } from "@/app/(auth)/definir-senha/formulario";
import { Alerta } from "@/components/ui/alerta";
import { tokenValido } from "@/lib/auth/tokens";

export const metadata: Metadata = { title: "Definir senha" };

export default async function DefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token || !(await tokenValido(token, "PASSWORD_RESET"))) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
          Link inválido
        </h1>
        <Alerta>
          Este link expirou ou já foi usado. Peça um novo para definir sua senha.
        </Alerta>
        <Link
          href="/recuperar-senha"
          className="block rounded-lg bg-laranja-500 px-4 py-2.5 text-center font-semibold text-white transition-colors hover:bg-laranja-600"
        >
          Pedir novo link
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
        Definir senha
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-marinho-600">
        Escolha a senha que você usará para entrar na plataforma.
      </p>

      <FormularioDefinirSenha token={token} />
    </>
  );
}
