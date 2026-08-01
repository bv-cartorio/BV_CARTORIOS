import Link from "next/link";

const LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#planos", label: "Planos" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-marinho-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-marinho-700 font-semibold text-dourado-300">
            BV
          </span>
          <span className="text-base font-semibold tracking-tight text-marinho-800">
            BV Cartórios
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-marinho-600 transition-colors hover:text-marinho-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/entrar"
            className="rounded-lg px-3 py-2 text-sm font-medium text-marinho-700 transition-colors hover:bg-marinho-50"
          >
            Entrar
          </Link>
          <Link
            href="/#planos"
            className="rounded-lg bg-marinho-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marinho-800"
          >
            Assinar
          </Link>
        </div>
      </div>
    </header>
  );
}
