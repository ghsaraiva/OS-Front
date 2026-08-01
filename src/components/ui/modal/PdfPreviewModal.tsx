import { FileText, Download, MessageCircle, Mail, X } from "lucide-react";
import Button from "../button/Button";

export function PdfPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  phone,
  email,
  clientName
}: {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  phone?: string;
  email?: string;
  clientName?: string;
}) {
  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Olá! Segue o link para visualizar sua proposta:\n\n${pdfUrl}`);
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Sua Proposta");
    const body = encodeURIComponent(`Olá!\n\nSegue o link para visualizar sua proposta:\n\n${pdfUrl}`);
    window.open(`mailto:${email || ''}?subject=${subject}&body=${body}`, "_blank");
  };

  const getFormattedFileName = (name?: string) => {
    if (!name) return "Proposta.pdf";
    const parts = name.trim().split(" ");
    const firstName = parts[0].toLowerCase();
    const lastName = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
    const fullName = lastName ? `${firstName}_${lastName}` : firstName;
    return `proposta_${fullName}.pdf`;
  };

  const handleDownload = async () => {
    const fileName = getFormattedFileName(clientName);
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = fileName;
      link.target = "_blank";
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="flex flex-col w-full max-w-5xl h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header com botões */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 gap-4 sm:gap-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Visualizar Proposta PDF
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button size="sm" variant="outline" startIcon={<Download className="w-4 h-4" />} onClick={handleDownload}>
              Baixar
            </Button>
            <Button size="sm" className="bg-[#25D366] hover:bg-[#1ebd57] text-white ring-0" startIcon={<MessageCircle className="w-4 h-4" />} onClick={handleWhatsApp}>
              WhatsApp
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white ring-0" startIcon={<Mail className="w-4 h-4" />} onClick={handleEmail}>
              E-mail
            </Button>
            <button
              onClick={onClose}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Iframe */}
        <div className="flex-1 w-full bg-gray-200 dark:bg-gray-950">
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
}
