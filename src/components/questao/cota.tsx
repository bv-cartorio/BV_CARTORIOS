"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { COTA_DIARIA_GRATUITA } from "@/lib/questoes/cota";

export type EstadoCota = {
  assinante: boolean;
  /** Questões gratuitas que ainda cabem hoje; `null` quando não há limite. */
  restantes: number | null;
};

type Valor = {
  cota: EstadoCota;
  /** Chamado por cada questão respondida, com o saldo devolvido pelo servidor. */
  registrar: (restantes: number | null) => void;
};

const SEM_LIMITE: Valor = {
  cota: { assinante: true, restantes: null },
  registrar: () => {},
};

const Contexto = createContext<Valor>(SEM_LIMITE);

/**
 * Saldo da cota gratuita compartilhado pela página.
 *
 * Cada cartão responde de forma independente, mas o contador é um só. Sem um
 * estado comum, o selo no topo continuaria mostrando o número do carregamento
 * enquanto o aluno gasta a cota logo abaixo.
 */
export function ProvedorCota({
  inicial,
  children,
}: {
  inicial: EstadoCota;
  children: React.ReactNode;
}) {
  const [cota, setCota] = useState(inicial);

  const registrar = useCallback((restantes: number | null) => {
    setCota((atual) => ({ ...atual, restantes }));
  }, []);

  const valor = useMemo(() => ({ cota, registrar }), [cota, registrar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCota(): Valor {
  return useContext(Contexto);
}

/** Selo do plano gratuito. Não aparece para quem assina. */
export function SeloCota() {
  const { cota } = useCota();

  if (cota.assinante || cota.restantes === null) return null;

  const esgotada = cota.restantes === 0;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-2 text-sm ${
        esgotada
          ? "border-laranja-200 bg-laranja-50 text-laranja-700"
          : "border-creme-200 bg-white text-marinho-600"
      }`}
    >
      <span>
        {esgotada ? (
          <>Suas {COTA_DIARIA_GRATUITA} questões gratuitas de hoje acabaram.</>
        ) : (
          <>
            Plano gratuito:{" "}
            <strong className="font-semibold text-marinho-800">
              {cota.restantes} de {COTA_DIARIA_GRATUITA}
            </strong>{" "}
            {cota.restantes === 1 ? "questão restante" : "questões restantes"} hoje.
          </>
        )}
      </span>

      <Link
        href="/assinatura"
        className="font-medium underline underline-offset-2"
      >
        Assinar e estudar sem limite
      </Link>
    </div>
  );
}
