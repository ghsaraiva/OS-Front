import { pb } from '../lib/pocketbase';

/**
 * Retorna as iniciais do usuário: Primeira letra do Nome + Primeira letra do Primeiro Sobrenome.
 * Ex: "Gabriel Herrera" -> "GH"
 * Ex: "Gabriel de Oliveira Herrera" -> "GO"
 * Ex: "Gabriel" -> "GA"
 */
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  const prepositions = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
  const surname = parts.slice(1).find((p) => !prepositions.has(p.toLowerCase())) || parts[1];
  return (parts[0][0] + surname[0]).toUpperCase();
}

/**
 * Retorna a URL da imagem de avatar do usuário no PocketBase se existir.
 */
export function getUserAvatarUrl(user?: { id?: string; avatar?: string }): string | null {
  if (user?.id && user?.avatar) {
    return pb.files.getUrl(user as any, user.avatar);
  }
  return null;
}
