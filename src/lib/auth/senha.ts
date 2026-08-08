import { compare, hash } from "bcryptjs";
import { z } from "zod";

/** Custo do bcrypt. 12 é o equilíbrio usual entre segurança e latência. */
const CUSTO = 12;

export const senhaSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres")
  .max(200, "A senha é longa demais");

export function hashSenha(senha: string): Promise<string> {
  return hash(senha, CUSTO);
}

/**
 * Confere a senha contra o hash guardado.
 *
 * Quando a conta não tem senha utilizável (migrada do sistema legado ou criada
 * por uma compra na Hotmart), ainda assim gastamos o tempo de um hash falso.
 * Sem isso, o tempo de resposta denunciaria quais e-mails existem sem senha.
 */
export async function verificarSenha(
  senha: string,
  hashGuardado: string | null,
): Promise<boolean> {
  if (!hashGuardado) {
    await compare(senha, HASH_DESCARTAVEL);
    return false;
  }

  return compare(senha, hashGuardado);
}

/** Hash de uma senha aleatória, usado só para consumir tempo. */
const HASH_DESCARTAVEL =
  "$2b$12$C6UzMDM.H6dfI/f/IKcEeO6Vo3Xk9YyQwqZ0.qFvL6zvLQ2GtOFdC";
