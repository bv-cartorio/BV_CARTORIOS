type LogoProps = {
  /** Em fundo claro o lettering fica marinho; em fundo escuro, creme. */
  variante?: "escura" | "clara";
  /**
   * Texto alternativo. Quando a marca aparece ao lado da palavra "Cartórios",
   * passe apenas "BV" para o leitor de tela não repetir o nome.
   */
  rotulo?: string;
  className?: string;
};

/**
 * Wordmark da BV Cartórios, desenhado em vetor.
 *
 * Geometria medida sobre a arte original: caixa de 440 × 260, com o "b"
 * ocupando a altura total (ascendente) e o "v" a altura de x. O ponto final é
 * um quadrado laranja alinhado à linha de base.
 *
 * O lettering usa `currentColor` para herdar a cor do contexto — daí as duas
 * variantes serem apenas uma troca de classe de texto. O quadrado mantém o
 * laranja da marca em qualquer fundo.
 */
export function Logo({
  variante = "escura",
  rotulo = "BV Cartórios",
  className = "",
}: LogoProps) {
  const cor = variante === "escura" ? "text-marinho-700" : "text-creme";

  return (
    <svg
      viewBox="18 8 440 260"
      role="img"
      aria-label={rotulo}
      className={`${cor} ${className}`}
      fill="currentColor"
    >
      {/* "b": haste ascendente + bojo com contraforma vazada.
          fill-rule nonzero — a haste e o bojo giram no mesmo sentido e se
          fundem; a contraforma gira ao contrário e por isso vaza. */}
      <path
        fillRule="nonzero"
        d="M18 8 H88 V268 H18 Z
           M142 72 H146 A82 82 0 0 1 228 154 V186 A82 82 0 0 1 146 268 H142 A82 82 0 0 1 60 186 V154 A82 82 0 0 1 142 72 Z
           M139 130 A33 33 0 0 0 106 163 V177 A33 33 0 0 0 139 210 A33 33 0 0 0 172 177 V163 A33 33 0 0 0 139 130 Z"
      />
      {/* "v": dois traços diagonais com topo reto e base levemente achatada. */}
      <path d="M212 72 H287 L318.5 175 L350 72 H425 L340 268 H297 Z" />
      {/* Ponto final. */}
      <rect x="392" y="202" width="66" height="66" fill="#ef5a28" />
    </svg>
  );
}
