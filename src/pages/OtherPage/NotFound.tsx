import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function NotFound() {
  return (
    <>
      <PageMeta
        title="Página Não Encontrada | Orçamentos Solar"
        description="A página solicitada não foi encontrada no sistema de orçamentos."
      />
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1 bg-white dark:bg-gray-900">
        <GridShape />
        <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
          <h1 className="mb-4 font-bold text-gray-800 text-3xl dark:text-white/90 xl:text-4xl uppercase tracking-wider">
            Erro 404
          </h1>

          <img src={`${import.meta.env.BASE_URL}images/error/404.svg`} alt="404" className="dark:hidden mx-auto" />
          <img
            src={`${import.meta.env.BASE_URL}images/error/404-dark.svg`}
            alt="404"
            className="hidden dark:block mx-auto"
          />

          <p className="mt-8 mb-6 text-base text-gray-600 dark:text-gray-400 sm:text-lg">
            Desculpe! Não conseguimos encontrar a página que você está tentando acessar.
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 transition-colors"
          >
            Voltar para o Início
          </Link>
        </div>
        
        {/* Footer */}
        <p className="absolute text-xs text-center text-gray-400 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-500">
          &copy; {new Date().getFullYear()} - Guilherme Orçamentos Solar
        </p>
      </div>
    </>
  );
}
