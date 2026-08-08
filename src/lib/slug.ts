/**
 * Slug a partir de texto em português.
 *
 * "Direito Notarial e Registral" vira "direito-notarial-e-registral". Usado
 * pelo admin e pelo seed — mesma regra nos dois, senão a mesma matéria criada
 * por caminhos diferentes ganharia slugs diferentes.
 */
export function slugify(texto: string): string {
  return (
    texto
      // NFD separa a letra do acento; a classe Unicode remove só o acento.
      // Escrito assim, e não com um intervalo de códigos, o arquivo fica em
      // ASCII puro — combining marks soltas no fonte são invisíveis no editor
      // e somem em cópia e colagem.
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  );
}

/**
 * Slug livre dentro do conjunto informado, acrescentando sufixo numérico.
 *
 * Dois assuntos chamados "Disposições gerais" em matérias diferentes convivem
 * bem (o unique é por pai), mas dentro do mesmo pai é preciso desempatar.
 */
export function slugUnico(texto: string, ocupados: Iterable<string>): string {
  const base = slugify(texto) || "item";
  const usados = new Set(ocupados);

  if (!usados.has(base)) return base;

  for (let n = 2; n < 1000; n++) {
    const candidato = `${base}-${n}`;
    if (!usados.has(candidato)) return candidato;
  }

  throw new Error(`Não foi possível gerar slug único para "${texto}"`);
}
