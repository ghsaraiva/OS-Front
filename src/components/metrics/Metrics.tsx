import { useEffect, useState } from "react";
import { BoxIconLine, DocsIcon, CheckCircleIcon, GroupIcon } from "../../icons";
import { pb } from "../../lib/pocketbase";
import { useAuth } from "../../context/AuthContext";

export default function Metrics() {
  const [stats, setStats] = useState({
    total: 0,
    abertos: 0,
    concluidos: 0,
    clientes: 0,
  });
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        let filter = "";
        if (!isAdmin) {
          filter = `user_id = "${user.id}"`;
        }

        // Fetch Total
        const totalRes = await pb.collection("orcamentos").getList(1, 1, {
          filter,
          fields: "id",
        });

        // Fetch Abertos
        const openFilter = filter
          ? `(${filter}) && situacao = "Aberto"`
          : 'situacao = "Aberto"';
        const abertosRes = await pb.collection("orcamentos").getList(1, 1, {
          filter: openFilter,
          fields: "id",
        });

        // Fetch Concluídos (Técnico Finalizado)
        const closedFilter = filter
          ? `(${filter}) && situacao = "Técnico Finalizado"`
          : 'situacao = "Técnico Finalizado"';
        const concluidosRes = await pb.collection("orcamentos").getList(1, 1, {
          filter: closedFilter,
          fields: "id",
        });

        setStats({
          total: totalRes.totalItems,
          abertos: abertosRes.totalItems,
          concluidos: concluidosRes.totalItems,
          clientes: totalRes.totalItems, // Simplificação: cada orçamento é um cliente por enquanto
        });
      } catch (err) {
        console.error("Error fetching metrics:", err);
      }
    };

    fetchStats();
  }, [user, isAdmin]);

  const cards = [
    {
      title: "Total Orçamentos",
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
      title: "Finalizado",
      value: stats.concluidos,
      icon: <CheckCircleIcon className="size-6" />,
      color: "text-success-500 bg-success-50 dark:bg-success-500/10",
    },
    {
      title: "Clientes",
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
