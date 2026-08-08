import Link from "next/link";

import { Logo } from "@/components/logo";

export function SiteFooter() {
  const ano = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-marinho-800 text-marinho-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo variante="clara" className="h-9 w-auto" />
          <p className="mt-3 text-sm text-marinho-300">
            Preparação para concursos de serviços notariais e de registro.
          </p>
        </div>

        <nav aria-label="Plataforma">
          <h2 className="text-sm font-semibold text-white">Plataforma</h2>
          <ul className="mt-2 space-y-2 text-sm text-marinho-300">
            <li>
              <Link href="/#planos" className="hover:text-white">
                Planos
              </Link>
            </li>
            <li>
              <Link href="/entrar" className="hover:text-white">
                Área do aluno
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white">
                Blog
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Institucional">
          <h2 className="text-sm font-semibold text-white">
            Institucional
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-marinho-300">
            <li>
              <Link href="/termos" className="hover:text-white">
                Termos de uso
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="hover:text-white">
                Política de privacidade
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-white">Contato</h2>
          <p className="mt-2 text-sm text-marinho-300">
            <a
              href="mailto:contato@bvcartorio.com"
              className="hover:text-white"
            >
              contato@bvcartorio.com
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-marinho-700 py-6 text-center text-xs text-marinho-400">
        © {ano} BV Cartórios. Todos os direitos reservados.
      </div>
    </footer>
  );
}
