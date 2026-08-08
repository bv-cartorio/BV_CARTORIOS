type LogoProps = {
  /** Em fundo escuro o lettering vira creme; em fundo claro, marinho. */
  variante?: "escura" | "clara";
  className?: string;
};

/**
 * Wordmark da BV Cartórios: lettering "bv" com o ponto final em quadrado
 * laranja, como na marca. O quadrado acompanha o tamanho da fonte (`em`), então
 * o conjunto escala junto ao contexto tipográfico.
 */
export function Logo({ variante = "escura", className = "" }: LogoProps) {
  const cor = variante === "escura" ? "text-marinho-700" : "text-creme";

  return (
    <span
      className={`inline-flex items-end font-bold leading-none tracking-tighter ${cor} ${className}`}
    >
      <span>bv</span>
      <span
        aria-hidden
        className="ml-[0.12em] mb-[0.06em] inline-block size-[0.26em] bg-laranja-500"
      />
    </span>
  );
}
