import type { SelectHTMLAttributes } from "react";

export type Opcao = { valor: string; rotulo: string };

type SelecaoProps = SelectHTMLAttributes<HTMLSelectElement> & {
  rotulo: string;
  opcoes: Opcao[];
  /** Texto da opção neutra ("Todas as matérias"). Omitir torna o campo obrigatório. */
  vazio?: string;
};

/** `<select>` no mesmo padrão visual do [`Campo`](./campo.tsx). */
export function Selecao({
  rotulo,
  opcoes,
  vazio,
  id,
  className,
  ...props
}: SelecaoProps) {
  const campoId = id ?? props.name;

  return (
    <div className={className}>
      <label
        htmlFor={campoId}
        className="block text-xs font-medium text-marinho-600"
      >
        {rotulo}
      </label>

      <select
        {...props}
        id={campoId}
        className="mt-1 block w-full rounded-lg border border-creme-200 bg-white px-3 py-2 text-sm text-marinho-900 outline-none transition-colors focus:border-marinho-400 focus:ring-2 focus:ring-marinho-100 disabled:cursor-not-allowed disabled:bg-creme disabled:text-marinho-400"
      >
        {vazio !== undefined && <option value="">{vazio}</option>}

        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}
