import type { Metadata } from "next";
import Link from "next/link";

import { sair } from "@/app/(auth)/acoes";
import { Logo } from "@/components/logo";
import { Alerta } from "@/components/ui/alerta";
import { assinaturaVigente, exigirUsuario } from "@/lib/auth/guardas";
import { formatarData } from "@/lib/format";

export const metadata: Metadata = { title: "Painel" };

export default async function PainelPage() {
  const usuario = await exigirUsuario("/painel");
  const assinatura = await assinaturaVigente(usuario.id);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-creme">
      <header className="border-b border-creme-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/">
            <Logo className="h-7 w-auto" />
          </Link>

          <form action={sair}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-sm font-medium text-marinho-600 transition-colors hover:bg-creme hover:text-marinho-900"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
          Olá, {usuario.name.split(" ")[0]}
        </h1>

        <div className="mt-6 space-y-4">
          {assinatura ? (
            <Alerta tipo="sucesso">
              Plano <strong>{assinatura.plan.name}</strong> ativo até{" "}
              {formatarData(assinatura.endsAt)}.
              {!assinatura.autoRenew &&
                " A renovação automática está desligada."}
            </Alerta>
          ) : (
            <Alerta tipo="aviso">
              Você ainda não tem uma assinatura ativa. O acervo completo é
              liberado com qualquer um dos planos.{" "}
              <Link href="/#planos" className="font-medium underline">
                Ver planos
              </Link>
            </Alerta>
          )}

          <div className="rounded-2xl border border-creme-200 bg-white p-6">
            <h2 className="font-semibold text-marinho-800">Em construção</h2>
            <p className="mt-2 text-sm text-marinho-600">
              A área de estudos — busca de questões, cadernos, simulados e
              estatísticas — entra nos próximos módulos. Esta tela existe hoje
              para exercitar o controle de acesso.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
