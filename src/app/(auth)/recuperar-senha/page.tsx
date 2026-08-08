import type { Metadata } from "next";

import { FormularioRecuperar } from "@/app/(auth)/recuperar-senha/formulario";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
        Recuperar senha
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-marinho-600">
        Informe seu e-mail e enviaremos um link para definir uma nova senha.
      </p>

      <FormularioRecuperar />
    </>
  );
}
