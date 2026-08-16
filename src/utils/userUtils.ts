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
export function getUserAvatarUrl(user?: { id?: string; avatar?: string; collectionName?: string; collectionId?: string }): string | null {
  if (user?.id && user?.avatar) {
    const record = {
      collectionName: "users",
      ...user,
    };
    return pb.files.getURL(record as any, user.avatar);
  }
  return null;
}

/**
 * Retorna as informações (nome, avatar, id) do colaborador responsável pelo orçamento,
 * fazendo fallback inteligente para o usuário atual ou para a lista de usuários da store
 * caso o campo expand ainda não esteja populado.
 */
export function getCollaboratorInfo(
  orcamento?: { user_id?: string; expand?: { user_id?: any } },
  currentUser?: { id?: string; name?: string; avatar?: string } | null,
  usersList?: Array<{ id: string; name: string; avatar?: string }>
): { name: string; avatar?: string; id?: string } {
  if (orcamento?.expand?.user_id?.name) {
    return {
      id: orcamento.expand.user_id.id || orcamento.user_id,
      name: orcamento.expand.user_id.name,
      avatar: orcamento.expand.user_id.avatar,
    };
  }

  if (orcamento?.user_id && currentUser?.id === orcamento.user_id && currentUser.name) {
    return {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
    };
  }

  if (orcamento?.user_id && usersList && usersList.length > 0) {
    const found = usersList.find((u) => u.id === orcamento.user_id);
    if (found && found.name) {
      return {
        id: found.id,
        name: found.name,
        avatar: found.avatar,
      };
    }
  }

  return {
    id: orcamento?.user_id,
    name: "---",
  };
}

/**
 * Máscara para telefone brasileiro: (99) 99999-9999 ou (99) 9999-9999
 */
export function formatPhoneMask(value?: string): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Regex para validação de formato de e-mail
 */
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
