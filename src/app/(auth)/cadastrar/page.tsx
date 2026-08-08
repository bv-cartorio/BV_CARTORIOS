import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FormularioCadastrar } from "@/app/(auth)/cadastrar/formulario";
import { obterUsuario } from "@/lib/auth/sessao";

export const metadata: Metadata = { title: "Criar conta" };

export default async function CadastrarPage() {
  if (await obterUsuario()) redirect("/painel");

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
        Criar conta
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-marinho-600">
        A conta é gratuita. O acervo completo é liberado com a assinatura.
      </p>

      <FormularioCadastrar />
    </>
  );
}
