import Link from "next/link";

import { sair } from "@/app/(auth)/acoes";
import { Logo } from "@/components/logo";
import { NavegacaoPainel } from "@/components/painel/navegacao";
import { exigirUsuario } from "@/lib/auth/guardas";

/**
 * Casca da área do aluno.
 *
 * A guarda aqui protege tudo sob `/painel`; cada página repete a sua própria
 * porque é dela que sai o destino para onde voltar depois do login.
 */
export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await exigirUsuario("/painel");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-creme">
      <header className="border-b border-creme-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
          <Link href="/" className="shrink-0">
            <Logo className="h-7 w-auto" />
          </Link>

          <NavegacaoPainel />

          <form action={sair} className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-marinho-500 sm:inline">
              {usuario.name.split(" ")[0]}
            </span>

            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-sm font-medium text-marinho-600 transition-colors hover:bg-creme hover:text-marinho-900"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
