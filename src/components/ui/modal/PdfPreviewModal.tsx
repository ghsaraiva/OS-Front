// Componente Modal de Preview do PDF

export function PdfPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  phone,
  email
}: {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  phone?: string;
  email?: string;
}) {
  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Olá! Segue o link para visualizar sua proposta comercial:\n\n${pdfUrl}`);
    // If phone is available we can use it, else just open whatsapp
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Sua Proposta Comercial");
    const body = encodeURIComponent(`Olá!\n\nSegue o link para visualizar sua proposta comercial:\n\n${pdfUrl}`);
    window.open(`mailto:${email || ''}?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="flex flex-col w-full max-w-5xl h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header com botões */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            📄 Visualizar Proposta PDF
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download="Proposta_Sofia_Engenharia.pdf"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
            >
              📥 Baixar
            </a>
            <button
              onClick={handleWhatsApp}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
            >
              🟢 WhatsApp
            </button>
            <button
              onClick={handleEmail}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              ✉️ E-mail
            </button>
            <button
              onClick={onClose}
              className="ml-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Iframe */}
        <div className="flex-1 w-full bg-gray-200 dark:bg-gray-950">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
}
