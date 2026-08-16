import { useState, useEffect } from "react";
import { FileText, Download, MessageCircle, Mail, X } from "lucide-react";
import Button from "../button/Button";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";
import api from "../../../services/api";
import { useToast } from "../../../context/ToastContext";
import { EMAIL_PATTERN } from "../../../utils/userUtils";

export function PdfPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  phone,
  email,
  clientName,
  budgetId,
  onEmailSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  phone?: string;
  email?: string;
  clientName?: string;
  budgetId?: string;
  onEmailSaved?: (newEmail: string) => void;
}) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [currentEmail, setCurrentEmail] = useState(email || "");

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [promptEmail, setPromptEmail] = useState("");
  const [promptError, setPromptError] = useState("");
  const [savingEmailAndSend, setSavingEmailAndSend] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    setCurrentEmail(email || "");
  }, [email]);

  if (!isOpen) return null;

  const handleWhatsApp = () => {
    let cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    if (
      cleanPhone.length >= 10 &&
      cleanPhone.length <= 11 &&
      !cleanPhone.startsWith("55")
    ) {
      cleanPhone = `55${cleanPhone}`;
    }
    const name =
      clientName && clientName.trim() ? clientName.trim() : "Cliente";
    const message = `*Olá, ${name}*!
Sua proposta de energia solar está pronta.
Preparamos uma solução personalizada para o seu projeto, com todos os detalhes do sistema, investimento, economia e prazo de retorno.
*Acesse sua proposta:*
${pdfUrl}
*Validade da Proposta:* 15 dias.
Em caso de dúvidas ou se precisar de qualquer esclarecimento sobre a proposta, nossa equipe está à disposição.
Atenciosamente,
*Sofia Engenharia Elétrica*`;

    const text = encodeURIComponent(message);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, "_blank");
  };

  const sendEmailDirectly = async (targetEmail: string) => {
    setSendingEmail(true);
    try {
      const pdfFilename = pdfUrl ? pdfUrl.split('/').pop() : undefined;
      await api.post("/enviar-email-proposta", {
        email: targetEmail,
        clientName: clientName || "Cliente",
        budgetTitle: `Proposta de Energia Solar - ${clientName || "Cliente"}`,
        pdfUrl,
        budgetId,
        pdfFilename,
      });

      addToast(
        "success",
        "E-mail Enviado!",
        `A proposta foi enviada para ${targetEmail} com sucesso.`,
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        "Não foi possível enviar o e-mail da proposta.";
      addToast("error", "Erro ao enviar e-mail", msg);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleEmailClick = () => {
    if (currentEmail && currentEmail.trim()) {
      sendEmailDirectly(currentEmail.trim());
    } else {
      setPromptEmail("");
      setPromptError("");
      setIsEmailModalOpen(true);
    }
  };

  const handleSaveEmailAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = promptEmail.trim();

    if (!cleanEmail) {
      setPromptError("O e-mail é obrigatório para o envio.");
      return;
    }

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setPromptError("Informe um e-mail válido (ex: cliente@email.com).");
      return;
    }

    setSavingEmailAndSend(true);
    setPromptError("");

    try {
      // 1. Salva o e-mail no orçamento caso exista budgetId
      if (budgetId) {
        await api.patch(`/budgets/${budgetId}`, {
          email_cliente: cleanEmail,
        });
      }

      // 2. Dispara o envio de e-mail via Resend
      const pdfFilename = pdfUrl ? pdfUrl.split('/').pop() : undefined;
      await api.post("/enviar-email-proposta", {
        email: cleanEmail,
        clientName: clientName || "Cliente",
        budgetTitle: `Proposta de Energia Solar - ${clientName || "Cliente"}`,
        pdfUrl,
        budgetId,
        pdfFilename,
      });

      // 3. Atualiza os estados locais e callback do pai
      setCurrentEmail(cleanEmail);
      onEmailSaved?.(cleanEmail);

      addToast(
        "success",
        "E-mail Salvo e Enviado!",
        `O e-mail ${cleanEmail} foi registrado no orçamento e a proposta foi enviada.`,
      );

      setIsEmailModalOpen(false);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        "Não foi possível salvar ou enviar o e-mail.";
      addToast("error", "Erro ao processar e-mail", msg);
    } finally {
      setSavingEmailAndSend(false);
    }
  };

  const getFormattedFileName = (name?: string) => {
    if (!name) return "Proposta.pdf";
    const parts = name.trim().split(" ");
    const firstName = parts[0].toLowerCase();
    const lastName =
      parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
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
    } catch {
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
    <>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
        <div className="flex flex-col w-full max-w-5xl h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header com botões */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 gap-4 sm:gap-0">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Visualizar Proposta PDF
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                startIcon={<Download className="w-4 h-4" />}
                onClick={handleDownload}
              >
                Baixar
              </Button>
              <Button
                size="sm"
                className="bg-[#25D366] hover:bg-[#1ebd57] text-white ring-0"
                startIcon={<MessageCircle className="w-4 h-4" />}
                onClick={handleWhatsApp}
              >
                WhatsApp
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white ring-0"
                startIcon={<Mail className="w-4 h-4" />}
                onClick={handleEmailClick}
                loading={sendingEmail}
                disabled={sendingEmail}
              >
                {sendingEmail ? "Enviando..." : "E-mail"}
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

      {/* Modal Customizado para Solicitar E-mail do Cliente */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-brand-500/15 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                  <Mail className="size-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-800 dark:text-white">
                    Enviar Proposta por E-mail
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    E-mail do cliente não informado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                disabled={savingEmailAndSend}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveEmailAndSend} className="p-5 space-y-4">
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Digite o e-mail do cliente para enviar a proposta. Ele será{" "}
                <strong>salvo automaticamente no orçamento</strong>.
              </p>

              <div>
                <Label required>E-mail do Cliente</Label>
                <Input
                  type="email"
                  placeholder="cliente@email.com"
                  value={promptEmail}
                  onChange={(e) => {
                    setPromptEmail(e.target.value);
                    if (promptError) setPromptError("");
                  }}
                  autoFocus
                  error={!!promptError}
                  hint={promptError}
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEmailModalOpen(false)}
                  disabled={savingEmailAndSend}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  loading={savingEmailAndSend}
                  disabled={savingEmailAndSend}
                >
                  {savingEmailAndSend
                    ? "Salvando..."
                    : "Salvar & Enviar Proposta"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
