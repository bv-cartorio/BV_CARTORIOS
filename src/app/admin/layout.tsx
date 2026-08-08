import type { Metadata } from "next";
import Link from "next/link";

import { sair } from "@/app/(auth)/acoes";
import { NavegacaoAdmin } from "@/components/admin/navegacao";
import { exigirPapel } from "@/lib/auth/guardas";

export const metadata: Metadata = {
  title: { default: "Administração", template: "%s · Administração" },
  // Área interna não tem por que aparecer em buscador nenhum.
  robots: { index: false, follow: false },
};

/**
 * Casca da administração.
 *
 * Só `ADMIN` entra: a decisão registrada no roadmap é que não haverá papel
 * intermediário por ora. `EDITOR` continua no enum, dormente, para o dia em que
 * houver uma segunda pessoa escrevendo — abrir depois é trocar esta linha.
 *
 * O cabeçalho é escuro de propósito: quem está aqui edita o que 1.000 alunos
 * vão ler, e não pode confundir esta tela com a área do aluno.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await exigirPapel(["ADMIN"], "/admin");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-creme">
      <header className="bg-marinho-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link
            href="/admin"
            className="text-sm font-bold tracking-tight text-white"
          >
            BV <span className="font-normal text-marinho-200">Administração</span>
          </Link>

          <NavegacaoAdmin />

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/painel"
              className="rounded-lg px-3 py-2 text-sm font-medium text-marinho-100 transition-colors hover:bg-marinho-600/60 hover:text-white"
            >
              Ver como aluno
            </Link>

            <form action={sair}>
              <button
                type="submit"
                className="rounded-lg px-3 py-2 text-sm font-medium text-marinho-200 transition-colors hover:text-white"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="border-b border-creme-200 bg-white px-4 py-1.5">
        <p className="mx-auto max-w-6xl text-xs text-marinho-500">
          Conectado como {usuario.name} ({usuario.email})
        </p>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
