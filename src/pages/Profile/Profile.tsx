import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { pb } from "../../lib/pocketbase";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import UserAvatar from "../../components/common/UserAvatar";
import { useToast } from "../../context/ToastContext";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function Profile() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > MAX_FILE_SIZE_BYTES) {
        const errorMsg =
          "Erro na foto: A imagem selecionada é muito pesada (excede o limite de 5MB). Escolha uma foto menor.";
        setAvatarError(errorMsg);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        addToast(
          "error",
          "Foto de perfil muito pesada",
          "A imagem selecionada excede o limite máximo permitido de 5MB. Escolha uma foto menor.",
        );
        return;
      }

      setAvatarError(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (avatarError) {
      addToast(
        "error",
        "Erro na foto de perfil",
        "Por favor, selecione uma foto com tamanho menor que 5MB antes de salvar.",
      );
      return;
    }

    if (!name.trim()) {
      addToast(
        "error",
        "Erro de validação",
        "O nome não pode ficar em branco.",
      );
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      await pb.collection("users").update(user.id, formData);
      await pb.collection("users").authRefresh();

      setAvatarError(null);
      setSelectedFile(null);
      addToast(
        "success",
        "Perfil Atualizado!",
        "Suas alterações foram salvas com sucesso.",
      );
    } catch (err: any) {
      const responseData = err?.response?.data || err?.data || {};
      let errorMsg =
        err?.message || "Ocorreu um erro ao salvar suas informações.";

      if (responseData.avatar) {
        const avatarDetail =
          "Erro na foto: A imagem não pôde ser processada ou excede o limite permitido (Máximo 5MB).";
        setAvatarError(avatarDetail);
        errorMsg = avatarDetail;
      }

      addToast("error", "Erro ao atualizar perfil", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Perfil do Usuário | Sofia Engenharia"
        description="Gerenciamento de dados de perfil do colaborador."
      />
      <PageBreadcrumb pageTitle="Perfil do Usuário" />

      <div className="w-full space-y-6">
        {/* HERO CARD DE APRESENTAÇÃO / AVATAR */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              {/* Container Foto */}
              <div className="relative group shrink-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className={`h-28 w-28 rounded-full object-cover shadow-lg transition-all ${
                      avatarError
                        ? "border-4 border-error-500 ring-4 ring-error-500/20"
                        : "border-4 border-brand-500 dark:border-brand-400"
                    }`}
                  />
                ) : (
                  <div
                    className={
                      avatarError
                        ? "rounded-full ring-4 ring-error-500/30 border-4 border-error-500 p-0.5"
                        : "rounded-full border-4 border-brand-500/30"
                    }
                  >
                    <UserAvatar
                      user={user || undefined}
                      size="xl"
                      className="h-28 w-28 text-3xl"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all text-xs font-semibold backdrop-blur-[2px]"
                >
                  <svg
                    className="size-5 mb-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Alterar
                </button>
              </div>

              {/* Informações Rápidas */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user?.name || "Usuário"}
                  </h1>
                  <Badge
                    size="sm"
                    color={
                      user?.tipo_acesso === "admin" ? "success" : "primary"
                    }
                  >
                    {user?.tipo_acesso === "admin"
                      ? "Administrador"
                      : "Vendedor"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-success-500 animate-pulse"></span>
                    Conta Ativa
                  </span>
                  <span>•</span>
                  <span>
                    Membro desde{" "}
                    {user?.created
                      ? new Date(user.created).toLocaleDateString()
                      : "---"}
                  </span>
                </div>
              </div>
            </div>

            {/* Ação de Troca de Foto */}
            <div className="flex flex-col items-center sm:items-end justify-center shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                startIcon={
                  <svg
                    className="size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                }
              >
                Carregar Nova Foto
              </Button>
              <span className="mt-1.5 text-[11px] text-gray-400">
                Formatos: PNG, JPG ou WEBP (Max: <strong>5MB</strong>)
              </span>
            </div>
          </div>

          {/* Banner de Erro na Foto se houver */}
          {avatarError && (
            <div className="mt-4 text-xs font-medium text-error-600 bg-error-50 dark:bg-error-500/10 p-3.5 rounded-xl border border-error-200 dark:border-error-500/20 flex items-center gap-2.5 text-left animate-fadeIn">
              <svg
                className="size-4 shrink-0 text-error-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{avatarError}</span>
            </div>
          )}
        </div>

        {/* GRID DE INFORMAÇÕES E CONFIGURAÇÕES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* COLUNA ESQUERDA: RESUMO E PERMISSÕES */}
          <div className="lg:col-span-1 space-y-6">
            <ComponentCard title="Status & Permissões">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Perfil de Acesso
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-white capitalize">
                    {user?.tipo_acesso === "admin"
                      ? "Administrador"
                      : "Vendedor"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Situação da Conta
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success-600 dark:text-success-400">
                    <span className="size-1.5 rounded-full bg-success-500"></span>
                    Ativo
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Data de Cadastro
                  </span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {user?.created
                      ? new Date(user.created).toLocaleDateString()
                      : "---"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-brand-50/50 dark:bg-brand-500/5 border border-brand-200/50 dark:border-brand-500/10">
                  <p className="text-xs font-semibold text-brand-800 dark:text-brand-400">
                    Nível de Permissão
                  </p>
                  <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    {user?.tipo_acesso === "admin"
                      ? "Acesso completo a todos os módulos, relatórios gerenciais, cadastros de usuários e configurações do sistema."
                      : "Permissão para criar, visualizar e editar os seus próprios orçamentos e propostas comerciais."}
                  </p>
                </div>
              </div>
            </ComponentCard>
          </div>

          {/* COLUNA DIREITA: FORMULÁRIO DE DADOS PESSOAIS E CREDENCIAIS */}
          <div className="lg:col-span-2 space-y-6">
            <ComponentCard title="Dados Pessoais e Conta">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CAMPO EDITÁVEL: Nome Completo */}
                  <div className="md:col-span-2">
                    <Label>
                      Nome Completo <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                    <p className="mt-1.5 text-xs text-gray-400">
                      Este nome é exibido no topo do sistema, em propostas
                      comerciais e relatórios.
                    </p>
                  </div>

                  {/* CAMPO BLOQUEADO: E-mail */}
                  <div>
                    <Label>E-mail Corporativo (Bloqueado)</Label>
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="cursor-not-allowed bg-gray-100 dark:bg-gray-800/60 opacity-70"
                    />
                    <p className="mt-1.5 text-xs text-gray-400">
                      O e-mail é a sua chave de acesso e só pode ser alterado
                      pelo administrador.
                    </p>
                  </div>

                  {/* CAMPO BLOQUEADO: Perfil de Acesso */}
                  <div>
                    <Label>Perfil de Acesso (Bloqueado)</Label>
                    <div className="h-11 flex items-center px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/60 opacity-70">
                      <Badge
                        size="sm"
                        color={
                          user?.tipo_acesso === "admin" ? "success" : "primary"
                        }
                      >
                        {user?.tipo_acesso === "admin"
                          ? "Administrador"
                          : "Vendedor"}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">
                      Definido no momento da criação do usuário.
                    </p>
                  </div>
                </div>

                {/* Botão de Salvar */}
                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Button type="submit" loading={loading}>
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </ComponentCard>
          </div>
        </div>
      </div>
    </>
  );
}
