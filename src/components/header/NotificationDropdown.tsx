import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

type Notificacao = {
  id: string;
  orcamento_id?: string;
  titulo: string;
  mensagem?: string;
  lida: boolean;
  created: string;
};

const INTERVALO_MS = 60_000;

const tempoRelativo = (data: string) => {
  const minutos = Math.floor((Date.now() - new Date(data.replace(" ", "T")).getTime()) / 60_000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return new Date(data.replace(" ", "T")).toLocaleDateString("pt-BR");
};

export default function NotificationDropdown() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  // Só o admin recebe notificações (novos orçamentos de vendedor/associado para refinar)
  const carregar = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get<{ itens: Notificacao[]; naoLidas: number }>("/notificacoes");
      setItens(data.itens);
      setNaoLidas(data.naoLidas);
    } catch {
      // sem notificações nesta rodada; tenta de novo no próximo intervalo
    }
  }, [isAdmin]);

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, INTERVALO_MS);
    const aoVoltar = () => document.visibilityState === "visible" && carregar();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [carregar]);

  function toggleDropdown() {
    if (!isOpen) carregar();
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function abrir(notificacao: Notificacao) {
    closeDropdown();
    if (!notificacao.lida) {
      setItens((prev) => prev.map((n) => (n.id === notificacao.id ? { ...n, lida: true } : n)));
      setNaoLidas((prev) => Math.max(prev - 1, 0));
      api.patch(`/notificacoes/${notificacao.id}/lida`).catch(() => carregar());
    }
    if (notificacao.orcamento_id) navigate(`/orcamentos/gerenciamento?id=${notificacao.orcamento_id}`);
  }

  async function marcarTodas() {
    setItens((prev) => prev.map((n) => ({ ...n, lida: true })));
    setNaoLidas(0);
    await api.patch("/notificacoes/lidas").catch(() => carregar());
  }

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        aria-label={naoLidas > 0 ? `Notificações (${naoLidas} não lidas)` : "Notificações"}
      >
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-gray-900">
            {naoLidas > 99 ? "99+" : naoLidas}
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="fixed top-16 inset-x-2 flex h-auto max-h-[70vh] min-h-[150px] flex-col overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-[17px] sm:w-[361px] sm:max-h-[480px]"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notificações
          </h5>
          <div className="flex items-center gap-3">
            {naoLidas > 0 && (
              <button
                onClick={marcarTodas}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Marcar todas como lidas
              </button>
            )}
            <button
              onClick={closeDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        {itens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nada a exibir por enquanto.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {itens.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => abrir(n)}
                  className={`flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-white/5 ${n.lida ? "" : "bg-brand-50/60 dark:bg-brand-500/10"}`}
                >
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.lida ? "bg-transparent" : "bg-brand-500"}`} />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">{n.titulo}</span>
                    {n.mensagem && <span className="text-xs text-gray-500 dark:text-gray-400">{n.mensagem}</span>}
                    <span className="text-[11px] text-gray-400">{tempoRelativo(n.created)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dropdown>
    </div>
  );
}
