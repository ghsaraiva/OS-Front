import { useMemo, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAppStore } from "../../store/useAppStore";
import { Link } from "react-router";
import Badge from "../ui/badge/Badge";
import { Skeleton } from "../ui/Skeleton";

export default function RecentOrders() {
  const { user, isAdmin } = useAuth();
  const { budgets, isLoading: storeLoading, fetchBudgets } = useAppStore();
  const [localLoading, setLocalLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    let active = true;
    setLocalLoading(true);
    fetchBudgets()
      .then(() => {
        if (active) setLocalLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao recarregar orçamentos:", err);
        if (active) setLocalLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchBudgets]);

  const isLoading = storeLoading || localLoading;

  const recentOrcamentos = useMemo(() => {
    const userBudgets = isAdmin 
      ? budgets 
      : budgets.filter((b) => b.user_id === user?.id);
    
    return userBudgets.slice(0, 5);
  }, [budgets, user, isAdmin]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aberto":
        return "success";
      case "Fechado":
        return "error";
      default:
        return "warning";
    }
  };

  const formatLocation = (cidade?: string, estado?: string) => {
    const city = cidade?.toLowerCase().replace(/(?:^|\s|-)\S/g, (a) => a.toUpperCase()) || "---";
    const state = estado?.toLowerCase().replace(/(?:^|\s|-)\S/g, (a) => a.toUpperCase()) || "---";
    return `${city} - ${state}`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Orçamentos Recentes
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/budgets/all"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Ver Tudo
          </Link>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.02]">
              <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                Data
              </th>
              <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                Cliente
              </th>
              <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                Vendedor
              </th>
              <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                Local
              </th>
              <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                Situação
              </th>
              <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                Proposta
              </th>
              {isAdmin && (
                <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  Ações
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              [...Array(5)].map((_, index) => (
                <tr key={index}>
                  <td className="px-5 py-4">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-5 py-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-5 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-5 py-4">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="px-5 py-4">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="px-5 py-4">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <>
                {recentOrcamentos.map((o, index) => {
                  const isRefined = o.preco_final_venda !== undefined && o.preco_final_venda > 0;
                  const isLastRow = index === recentOrcamentos.length - 1;
                  return (
                    <tr 
                      key={o.id}
                      className="hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                    >
                      <td className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {new Date(o.created).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90 font-medium">
                        {o.nome_cliente}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {o.expand?.user_id?.name || "---"}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                        {formatLocation(o.cidade, o.estado)}
                      </td>
                      <td className="px-5 py-4 text-theme-sm">
                        <Badge
                          size="sm"
                          color={getStatusColor(o.situacao)}
                        >
                          {o.situacao}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-theme-sm">
                        {isRefined ? (
                          <div className="inline-flex rounded-lg shadow-sm">
                            <Link
                              to={`/budgets/details/${o.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-l-lg transition-colors border border-brand-200/50 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20"
                            >
                              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Visualizar
                            </Link>
                            <button
                              type="button"
                              className="inline-flex items-center px-1.5 py-1 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-r-lg transition-colors border-y border-r border-brand-200/50 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20 border-l border-l-brand-200/30 dark:border-l-brand-500/10"
                              title="Mais opções (Imprimir PDF em breve)"
                            >
                              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex rounded-lg opacity-60">
                            <button
                              disabled
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200/50 rounded-l-lg cursor-not-allowed dark:bg-white/[0.02] dark:border-white/[0.05] dark:text-gray-500"
                              title="Preencha os dados gerenciais antes de visualizar/imprimir"
                            >
                              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Visualizar
                            </button>
                            <button
                              disabled
                              className="inline-flex items-center px-1.5 py-1 text-xs font-semibold text-gray-400 bg-gray-50 border-y border-r border-gray-200/50 rounded-r-lg cursor-not-allowed dark:bg-white/[0.02] dark:border-white/[0.05] dark:text-gray-500 border-l border-l-gray-200/30"
                            >
                              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-4 text-theme-sm">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === o.id ? null : o.id);
                              }}
                              className="p-1.5 hover:bg-gray-100 rounded-full dark:hover:bg-white/[0.08] transition-colors"
                            >
                              <svg className="size-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                              </svg>
                            </button>

                            {activeMenuId === o.id && (
                              <div 
                                className={`absolute right-0 z-50 w-28 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1 animate-fadeIn ${isLastRow ? "bottom-full mb-1" : "top-full mt-1"}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link
                                  to={`/budgets/management?id=${o.id}`}
                                  onClick={() => setActiveMenuId(null)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left font-medium"
                                >
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Editar
                                </Link>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {recentOrcamentos.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 7 : 6}
                      className="px-5 py-4 text-center text-gray-500"
                    >
                      Nenhum orçamento encontrado.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
