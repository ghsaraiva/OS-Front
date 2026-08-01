import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { Printer } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";
import { PdfPreviewModal } from "../ui/modal/PdfPreviewModal";
import { createPortal } from "react-dom";

interface BudgetActionDropdownProps {
  budgetId: string;
  clientName: string;
  phone?: string;
  email?: string;
}

export default function BudgetActionDropdown({ budgetId, clientName, phone, email }: BudgetActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const { addToast } = useToast();
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyles({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: 'max-content',
        minWidth: '160px' // Slightly wider to ensure it fits "Imprimir" text nicely
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    
    // Close on scroll to prevent detached dropdown
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const handleGeneratePdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsGeneratingPdf(true);
    addToast("info", "Gerando PDF", "O documento está sendo gerado...");
    try {
      const response = await api.post(`/gerar-pdf/${budgetId}`);
      if (response.data?.pdfUrl) {
        setPdfUrl(response.data.pdfUrl);
        setIsPdfModalOpen(true);
      }
    } catch (error) {
      addToast("error", "Erro", "Falha ao gerar o PDF da proposta.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      <div className="inline-flex rounded-lg shadow-sm">
        <Link
          to={`/orcamentos/detalhes/${budgetId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-l-lg transition-colors border border-brand-200/50 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20"
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Visualizar
        </Link>
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleDropdown}
          className="inline-flex items-center px-1.5 py-1 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-r-lg transition-colors border-y border-r border-brand-200/50 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20 border-l border-l-brand-200/30 dark:border-l-brand-500/10"
          title="Opções de impressão"
        >
          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && createPortal(
        <div 
          style={dropdownStyles}
          className="z-[999999] bg-brand-50 border border-brand-200/50 rounded-lg shadow-theme-sm dark:bg-brand-500/10 dark:border-brand-500/20 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleGeneratePdf}
            className="flex items-center w-full gap-2 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-100 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isGeneratingPdf ? (
              <div className="size-4 animate-spin rounded-full border border-brand-600 dark:border-brand-400 border-t-transparent" />
            ) : (
              <Printer className="size-4" />
            )}
            {isGeneratingPdf ? "Gerando..." : "Imprimir"}
          </button>
        </div>,
        document.body
      )}

      <PdfPreviewModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        pdfUrl={pdfUrl}
        phone={phone}
        email={email}
        clientName={clientName}
      />
    </>
  );
}
