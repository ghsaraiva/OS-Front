import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { useOrcamentos } from "../../hooks/useOrcamentos";
import { useAuth } from "../../context/AuthContext";
import { format } from "date-fns";

export default function TodosOrcamentos() {
  const { isAdmin } = useAuth();
  const { orcamentos, loading } = useOrcamentos();

  // Bloqueio de segurança adicional
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Acesso Restrito
          </h2>
          <p className="mt-2 text-gray-500">
            Apenas administradores podem acessar a listagem geral.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aberto":
        return "primary";
      case "Técnico Finalizado":
        return "success";
      case "Cancelado":
        return "error";
      default:
        return "light";
    }
  };

  return (
    <>
      <PageMeta
        title="Todos os Orçamentos | Solar Admin"
        description="Listagem geral de orçamentos do sistema."
      />
      <PageBreadcrumb pageTitle="Orçamentos - Todos" />

      <div className="space-y-6">
        <ComponentCard title="Todos os Orçamentos Cadastrados">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Data
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Cliente
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Vendedor
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Local
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Ações
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-4 text-gray-500"
                      >
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : orcamentos.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-4 text-gray-500"
                      >
                        Nenhum orçamento encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orcamentos.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(o.created), "dd/MM/yyyy")}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                          {o.nome_cliente}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                          {o.expand?.user_id?.name || "---"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                          {o.cidade} - {o.estado}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <Badge size="sm" color={getStatusColor(o.situacao)}>
                            {o.situacao}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <Link 
                            to={`/orcamentos/detalhes/${o.id}`} 
                            className="text-brand-500 hover:text-brand-600 font-medium text-theme-sm"
                          >
                            Visualizar
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
