import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useEffect, useState } from "react";
import { pb } from "../../lib/pocketbase";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router";

interface OrcamentoRecent {
  id: string;
  codigo: string;
  nome_cliente: string;
  situacao: string;
  created: string;
  estado: string;
}

export default function RecentOrders() {
  const [recentOrcamentos, setRecentOrcamentos] = useState<OrcamentoRecent[]>(
    [],
  );
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        let filter = "";
        if (!isAdmin && user?.id) {
          filter = `user_id = "${user.id}"`;
        }

        const records = await pb
          .collection("orcamentos")
          .getList<OrcamentoRecent>(1, 5, {
            sort: "-created",
            filter: filter,
          });

        setRecentOrcamentos(records.items);
      } catch (err) {
        console.error("Error fetching recent orders:", err);
      }
    };

    if (user) {
      fetchRecent();
    }
  }, [user, isAdmin]);

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
            to="/orcamentos/todos"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Ver Tudo
          </Link>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Cliente
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Data
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentOrcamentos.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                  {o.nome_cliente}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {new Date(o.created).toLocaleDateString()}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={o.situacao === "Aberto" ? "success" : "warning"}
                  >
                    {o.situacao}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {recentOrcamentos.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-3 text-center text-gray-500"
                >
                  Nenhum orçamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
