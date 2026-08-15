import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { z } from "zod";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import api from "../../services/api";

const emailSchema = z.object({
  email: z.string().min(1, "O e-mail é obrigatório").email("E-mail inválido"),
});

const codeSchema = z.object({
  code: z
    .string()
    .min(6, "O código deve conter 6 dígitos")
    .max(6, "O código deve conter 6 dígitos"),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(1, "A senha é obrigatória")
      .min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "A confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export default function ResetPassword() {
  const navigate = useNavigate();

  // Etapa atual: 1 = Email, 2 = Código, 3 = Nova Senha
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Error and UI states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Toggle visibility for password fields
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // --- PASSO 1: Solicitar Código ---
  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);
    setInfoMessage(null);

    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      setErrors({ email: validation.error.issues[0].message });
      return;
    }

    setLoading(true);
    try {
      // Endpoint público configurado sem o prefixo /calculos
      const response = await api.post(
        "/auth/solicitar-codigo",
        { email },
        { baseURL: "http://localhost:3002/api" },
      );
      setInfoMessage(
        response.data.message ||
          "Se o e-mail informado estiver cadastrado em nosso sistema, você receberá um código de confirmação em sua caixa de entrada.",
      );
      setStep(2);
    } catch (err: any) {
      // Mesmo em erro inesperado, mantemos mensagem amigável sem revelar falha interna
      setInfoMessage(
        "Se o e-mail informado estiver cadastrado em nosso sistema, você receberá um código de confirmação em sua caixa de entrada.",
      );
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // --- PASSO 2: Validar Código ---
  const handleValidarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    const validation = codeSchema.safeParse({ code });
    if (!validation.success) {
      setErrors({ code: validation.error.issues[0].message });
      return;
    }

    setLoading(true);
    try {
      await api.post(
        "/auth/validar-codigo",
        { email, code },
        { baseURL: "http://localhost:3002/api" },
      );
      setInfoMessage(null);
      setStep(3);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        "Código inválido ou expirado. Verifique e tente novamente.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- PASSO 3: Redefinir Senha ---
  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    const validation = passwordSchema.safeParse(formData);
    if (!validation.success) {
      const formatted: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        formatted[issue.path[0] as string] = issue.message;
      });
      setErrors(formatted);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        "/auth/redefinir-senha",
        {
          email,
          code,
          password: formData.password,
          passwordConfirm: formData.confirmPassword,
        },
        { baseURL: "http://localhost:3002/api" },
      );

      navigate("/login", {
        state: {
          mensagem:
            response.data.message ||
            "Senha redefinida com sucesso! Faça login com a sua nova senha.",
        },
      });
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        "Não foi possível redefinir a senha. Tente novamente.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Redefinição de Senha | Sofia Engenharia"
        description="Recupere o acesso à sua conta da Sofia Engenharia."
      />

      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              {/* Header */}
              <div className="mb-6 text-center sm:text-left">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                  Redefinição de Senha
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {step === 1 &&
                    "Informe seu e-mail para receber o código de segurança."}
                  {step === 2 &&
                    "Insira o código de 6 dígitos enviado para seu e-mail."}
                  {step === 3 && "Defina sua nova senha de acesso ao sistema."}
                </p>
              </div>

              {/* Indicador de Etapas */}
              <div className="mb-6 flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      step === 1
                        ? "bg-brand-500 text-white"
                        : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    1
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    E-mail
                  </span>
                </div>
                <div className="h-0.5 flex-1 bg-gray-200 dark:bg-gray-800" />
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      step === 2
                        ? "bg-brand-500 text-white"
                        : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    2
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Código
                  </span>
                </div>
                <div className="h-0.5 flex-1 bg-gray-200 dark:bg-gray-800" />
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      step === 3
                        ? "bg-brand-500 text-white"
                        : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    3
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Nova Senha
                  </span>
                </div>
              </div>

              {/* Mensagem Informativa */}
              {infoMessage && (
                <div className="mb-5 rounded-lg bg-brand-50 dark:bg-brand-500/15 border border-brand-200 dark:border-brand-500/30 p-4 text-sm text-brand-700 dark:text-brand-300 leading-relaxed">
                  {infoMessage}
                </div>
              )}

              {/* Alerta de Erro */}
              {apiError && (
                <div className="mb-5 rounded-lg bg-error-50 dark:bg-error-500/15 border border-error-200 dark:border-error-500/30 p-4 text-sm text-error-600 dark:text-error-400">
                  {apiError}
                </div>
              )}

              {/* --- ETAPA 1: SOLICITAR CÓDIGO --- */}
              {step === 1 && (
                <form
                  onSubmit={handleSolicitarCodigo}
                  noValidate
                  className="space-y-5"
                >
                  <div>
                    <Label>
                      E-mail <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="sofiaengenharia@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-error-500">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar Código de Recuperação"}
                  </Button>
                </form>
              )}

              {/* --- ETAPA 2: VALIDAR CÓDIGO --- */}
              {step === 2 && (
                <form
                  onSubmit={handleValidarCodigo}
                  noValidate
                  className="space-y-5"
                >
                  <div>
                    <Label>
                      Código de 6 Dígitos{" "}
                      <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="Ex: 123456"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                    />
                    {errors.code && (
                      <p className="mt-1 text-xs text-error-500">
                        {errors.code}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      O código expira em 10 minutos.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="w-1/3"
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setApiError(null);
                      }}
                    >
                      Voltar
                    </Button>
                    <Button
                      className="w-2/3"
                      size="sm"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Verificando..." : "Validar Código"}
                    </Button>
                  </div>
                </form>
              )}

              {/* --- ETAPA 3: NOVA SENHA --- */}
              {step === 3 && (
                <form
                  onSubmit={handleRedefinirSenha}
                  noValidate
                  className="space-y-5"
                >
                  <div>
                    <Label>
                      Nova Senha <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        placeholder="Mínimo 6 caracteres"
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-error-500">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>
                      Confirmar Nova Senha{" "}
                      <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        placeholder="Repita a nova senha"
                      />
                      <span
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showConfirm ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-error-500">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Salvando..." : "Redefinir Senha"}
                  </Button>
                </form>
              )}

              {/* Link Voltar ao Login */}
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors underline underline-offset-4"
                >
                  Voltar para a página de login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
