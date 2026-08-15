import { useState } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { pb } from '../../lib/pocketbase';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageMeta from '../../components/common/PageMeta';
import AuthLayout from './AuthPageLayout';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import { EyeCloseIcon, EyeIcon } from '../../icons';

const schema = z
  .object({
    password: z.string().min(1, 'A senha é obrigatória').min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'A confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export default function AlterarSenhaPrimeiroAcesso() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    const result = schema.safeParse(formData);
    if (!result.success) {
      const formatted: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        formatted[issue.path[0] as string] = issue.message;
      });
      setErrors(formatted);
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      await api.patch(`/users/${user.id}/alterar-senha`, {
        password: formData.password,
        passwordConfirm: formData.confirmPassword,
      });

      // Senha alterada com sucesso.
      // O PocketBase invalida o token ao trocar a senha, então
      // limpamos a sessão e redirecionamos para o login.
      pb.authStore.clear();
      navigate('/signin', { state: { mensagem: 'Senha definida com sucesso! Faça login com sua nova senha.' } });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao alterar senha. Tente novamente.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Definir Nova Senha | Sofia Engenharia"
        description="Defina sua senha permanente para acessar o sistema da Sofia Engenharia."
      />

      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/20 border border-brand-500/30">
                  <svg
                    className="h-8 w-8 text-brand-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
              </div>

              {/* Header */}
              <div className="mb-6 text-center sm:text-left">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                  Bem-vindo ao sistema!
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Este é seu primeiro acesso. Por segurança, defina uma{' '}
                  <span className="text-brand-500 font-medium">nova senha permanente</span> para
                  continuar.
                </p>
              </div>

              {/* User info badge */}
              {user && (
                <div className="mb-6 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white text-sm font-semibold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Error alert */}
              {apiError && (
                <div className="mb-4 rounded-lg bg-error-50 dark:bg-error-500/15 border border-error-300 dark:border-error-500/30 px-4 py-3 text-sm text-error-600 dark:text-error-400">
                  {apiError}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <Label>
                    Nova Senha <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
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
                    <p className="mt-1 text-xs text-error-500">{errors.password}</p>
                  )}
                </div>

                <div>
                  <Label>
                    Confirmar Nova Senha <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
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
                    <p className="mt-1 text-xs text-error-500">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button className="w-full" size="sm" type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Definir Senha'}
                </Button>
              </form>

              {/* Logout link */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={signOut}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors underline underline-offset-4"
                >
                  Sair e entrar com outra conta
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
