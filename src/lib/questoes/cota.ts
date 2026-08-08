/**
 * Regra do plano gratuito.
 *
 * Arquivo sem dependência alguma de propósito: o número é exibido na interface
 * (componente de cliente) e aplicado no servidor. Se morasse junto da consulta
 * ao banco, importá-lo no cliente arrastaria o Prisma para o pacote do
 * navegador.
 *
 * Mudar a política é mudar esta linha — não há migration envolvida.
 */

/** Questões distintas que um aluno sem assinatura responde por dia. */
export const COTA_DIARIA_GRATUITA = 10;
