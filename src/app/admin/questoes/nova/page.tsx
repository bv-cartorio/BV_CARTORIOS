import type { Metadata } from "next";

import { FormularioQuestao } from "@/components/admin/questoes/formulario";
import { carregarTaxonomia } from "@/lib/questoes/consulta";
import { configurado } from "@/lib/storage";

export const metadata: Metadata = { title: "Nova questão" };

export default async function NovaQuestaoPage() {
  const taxonomia = await carregarTaxonomia();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
        Nova questão
      </h1>

      <FormularioQuestao
        taxonomia={taxonomia}
        imagensLigadas={configurado()}
      />
    </div>
  );
}
