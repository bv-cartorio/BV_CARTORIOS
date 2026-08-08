"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/admin", rotulo: "Início" },
  { href: "/admin/questoes", rotulo: "Questões" },
  { href: "/admin/taxonomia", rotulo: "Taxonomia" },
  { href: "/admin/reportes", rotulo: "Reportes" },
  { href: "/admin/importar", rotulo: "Importar" },
];

export function NavegacaoAdmin() {
  const caminho = usePathname();

  return (
    <nav aria-label="Administração" className="flex flex-wrap items-center gap-1">
      {ITENS.map((item) => {
        const ativo =
          item.href === "/admin"
            ? caminho === "/admin"
            : caminho.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              ativo
                ? "bg-marinho-600 text-white"
                : "text-marinho-100 hover:bg-marinho-600/60 hover:text-white"
            }`}
          >
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
