"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/painel", rotulo: "Início" },
  { href: "/painel/questoes", rotulo: "Questões" },
];

export function NavegacaoPainel() {
  const caminho = usePathname();

  return (
    <nav aria-label="Área do aluno" className="flex items-center gap-1">
      {ITENS.map((item) => {
        const ativo =
          item.href === "/painel"
            ? caminho === "/painel"
            : caminho.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              ativo
                ? "bg-creme text-marinho-900"
                : "text-marinho-600 hover:bg-creme hover:text-marinho-900"
            }`}
          >
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
