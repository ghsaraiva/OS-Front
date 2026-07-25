import { useState, useEffect } from "react";
import { BoxIconLine, DocsIcon, CheckCircleIcon, GroupIcon } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { Skeleton } from "../ui/Skeleton";

export default function Metrics() {
  const { user, isAdmin } = useAuth();
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats", {
          params: {
            user_id: user?.id,
            is_admin: isAdmin,
          },
        });
        if (active) {
          if (response.data?.kpis) {
            setStatsData(response.data.kpis);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (active) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };
    if (user?.id !== undefined) {
      fetchStats();
    }
    return () => {
      active = false;
    };
  }, [user?.id, isAdmin]);

  const stats = statsData;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
            aria-busy="true"
          >
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="mt-5 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (hasError || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl text-gray-400 bg-gray-50 dark:bg-white/[0.05]">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="mt-5">
              <span className="text-sm text-gray-400 dark:text-gray-500">
                Indisponível
              </span>
              <h4 className="mt-2 font-bold text-gray-400 text-title-sm dark:text-gray-500">
                --
              </h4>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Orçamentos",
      value: stats.total,
      icon: <BoxIconLine className="size-6" />,
      color: "text-brand-500 bg-brand-50 dark:bg-brand-500/10",
    },
    {
      title: "Em Aberto",
      value: stats.abertos,
      icon: <DocsIcon className="size-6" />,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
    },
    {
      title: "Finalizados",
      value: stats.concluidos,
      icon: <CheckCircleIcon className="size-6" />,
      color: "text-success-500 bg-success-50 dark:bg-success-500/10",
    },
    {
      title: "Total de Clientes",
      value: stats.clientes,
      icon: <GroupIcon className="size-6" />,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-xl ${card.color}`}
          >
            {card.icon}
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {card.title}
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {card.value}
              </h4>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
