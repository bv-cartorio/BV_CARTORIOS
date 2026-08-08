import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FormularioEntrar } from "@/app/(auth)/entrar/formulario";
import { obterUsuario } from "@/lib/auth/sessao";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  if (await obterUsuario()) redirect("/painel");

  const { destino } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
        Entrar
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-marinho-600">
        Acesse sua área de estudos.
      </p>

      <FormularioEntrar destino={destino} />
    </>
  );
}
