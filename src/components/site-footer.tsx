import Link from "next/link";

export function SiteFooter() {
  const ano = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-marinho-100 bg-marinho-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="text-sm font-semibold text-marinho-800">
            BV Cartórios
          </span>
          <p className="mt-2 text-sm text-marinho-600">
            Preparação para concursos de serviços notariais e de registro.
          </p>
        </div>

        <nav aria-label="Plataforma">
          <h2 className="text-sm font-semibold text-marinho-800">Plataforma</h2>
          <ul className="mt-2 space-y-2 text-sm text-marinho-600">
            <li>
              <Link href="/#planos" className="hover:text-marinho-900">
                Planos
              </Link>
            </li>
            <li>
              <Link href="/entrar" className="hover:text-marinho-900">
                Área do aluno
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-marinho-900">
                Blog
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Institucional">
          <h2 className="text-sm font-semibold text-marinho-800">
            Institucional
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-marinho-600">
            <li>
              <Link href="/termos" className="hover:text-marinho-900">
                Termos de uso
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="hover:text-marinho-900">
                Política de privacidade
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-marinho-800">Contato</h2>
          <p className="mt-2 text-sm text-marinho-600">
            <a
              href="mailto:contato@bvcartorio.com"
              className="hover:text-marinho-900"
            >
              contato@bvcartorio.com
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-marinho-100 py-6 text-center text-xs text-marinho-500">
        © {ano} BV Cartórios. Todos os direitos reservados.
      </div>
    </footer>
  );
}
