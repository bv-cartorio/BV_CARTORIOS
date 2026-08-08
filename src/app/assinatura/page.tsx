import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { assinaturaVigente } from "@/lib/auth/guardas";
import { exigirUsuario } from "@/lib/auth/guardas";
import { formatarData } from "@/lib/format";

export const metadata: Metadata = { title: "Sua assinatura" };

/**
 * Destino de quem tem conta mas não tem assinatura vigente. Por ora explica a
 * situação e leva aos planos; no módulo da Hotmart passa a mostrar também os
 * dados da cobrança e o link para a área de assinaturas da Hotmart.
 */
export default async function AssinaturaPage() {
  const usuario = await exigirUsuario("/assinatura");
  const assinatura = await assinaturaVigente(usuario.id);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-creme">
      <header className="border-b border-creme-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/painel">
            <Logo className="h-7 w-auto" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
          Sua assinatura
        </h1>

        {assinatura ? (
          <div className="mt-6 rounded-2xl border border-creme-200 bg-white p-6">
            <p className="text-marinho-700">
              Plano <strong>{assinatura.plan.name}</strong>, vigente até{" "}
              {formatarData(assinatura.endsAt)}.
            </p>
            <Link
              href="/painel"
              className="mt-6 inline-block rounded-lg bg-marinho-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-marinho-800"
            >
              Voltar ao painel
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-creme-200 bg-white p-6">
            <p className="text-marinho-700">
              Sua conta está criada, mas ainda sem assinatura ativa. Escolha um
              plano para liberar o acervo completo de questões comentadas.
            </p>
            <p className="mt-3 text-sm text-marinho-500">
              Já comprou e continua vendo esta mensagem? Verifique se a compra
              foi feita com o mesmo e-mail desta conta ({usuario.email}) e fale
              com a gente se precisar corrigir.
            </p>
            <Link
              href="/#planos"
              className="mt-6 inline-block rounded-lg bg-laranja-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-laranja-600"
            >
              Ver planos
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
