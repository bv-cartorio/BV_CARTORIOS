import type { InputHTMLAttributes } from "react";

type CampoProps = InputHTMLAttributes<HTMLInputElement> & {
  rotulo: string;
  erro?: string;
  ajuda?: string;
};

export function Campo({ rotulo, erro, ajuda, id, ...props }: CampoProps) {
  const campoId = id ?? props.name;
  const ajudaId = ajuda ? `${campoId}-ajuda` : undefined;
  const erroId = erro ? `${campoId}-erro` : undefined;

  return (
    <div>
      <label
        htmlFor={campoId}
        className="block text-sm font-medium text-marinho-800"
      >
        {rotulo}
      </label>

      <input
        {...props}
        id={campoId}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[ajudaId, erroId].filter(Boolean).join(" ") || undefined}
        className={`mt-1.5 block w-full rounded-lg border px-3 py-2.5 text-marinho-900 outline-none transition-colors placeholder:text-marinho-300 focus:ring-2 ${
          erro
            ? "border-laranja-500 focus:border-laranja-500 focus:ring-laranja-200"
            : "border-creme-200 focus:border-marinho-400 focus:ring-marinho-100"
        }`}
      />

      {ajuda && !erro && (
        <p id={ajudaId} className="mt-1.5 text-xs text-marinho-500">
          {ajuda}
        </p>
      )}

      {erro && (
        <p id={erroId} className="mt-1.5 text-xs text-laranja-600">
          {erro}
        </p>
      )}
    </div>
  );
}
