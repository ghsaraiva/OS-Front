import { useState } from 'react';
import { z } from 'zod';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Select from '../../components/form/Select';
import Button from '../../components/ui/button/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../context/AuthContext';

// Schema de validação com Zod atualizado para PocketBase
const userSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  tipo_acesso: z.enum(['admin', 'vendedor']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function Usuarios() {
  const { isAdmin } = useAuth();
  const { users, loading, createUser } = useUsers();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    tipo_acesso: 'vendedor' as 'admin' | 'vendedor'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Bloqueio de acesso se não for ADMIN
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Acesso Restrito</h2>
          <p className="mt-2 text-gray-500">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = userSchema.safeParse(formData);

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        formattedErrors[key] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    const saveResult = await createUser(
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.name,
      formData.tipo_acesso
    );

    if (saveResult.success) {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        tipo_acesso: 'vendedor'
      });
      alert('Usuário criado com sucesso!');
    } else {
      alert('Erro ao criar usuário: ' + saveResult.error);
    }
  };

  return (
    <>
      <PageMeta 
        title="Gestão de Usuários | Solar Admin" 
        description="Gerenciamento de usuários e níveis de acesso do sistema."
      />
      <PageBreadcrumb pageTitle="Segurança - Usuários" />

      <div className="space-y-6">
        <ComponentCard title="Cadastro de Novo Usuário">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Nome Completo</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nome do colaborador"
                  required
                />
                {errors.name && <p className="mt-1 text-xs text-error-500">{errors.name}</p>}
              </div>
              <div>
                <Label>E-mail Corporativo</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@solar.com"
                  required
                />
                {errors.email && <p className="mt-1 text-xs text-error-500">{errors.email}</p>}
              </div>
              <div>
                <Label>Perfil de Acesso</Label>
                <Select
                  options={[
                    { value: 'admin', label: 'Administrador' },
                    { value: 'vendedor', label: 'Vendedor' }
                  ]}
                  defaultValue={formData.tipo_acesso}
                  onChange={(val) => handleSelectChange('tipo_acesso', val)}
                />
              </div>
              <div>
                <Label>Senha Temporária</Label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                {errors.password && <p className="mt-1 text-xs text-error-500">{errors.password}</p>}
              </div>
              <div>
                <Label>Confirmar Senha</Label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Repita a senha"
                  required
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-error-500">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => {
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    tipo_acesso: 'vendedor'
                  });
                  setErrors({});
                }}
              >
                Limpar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Processando...' : 'Cadastrar Usuário'}
              </Button>
            </div>
          </form>
        </ComponentCard>

        <ComponentCard title="Usuários Cadastrados">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Colaborador</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Perfil</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Data Cadastro</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90 font-medium">
                        {u.name}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                        {u.tipo_acesso === 'admin' ? 'Administrador' : 'Vendedor'}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                         <span className="text-theme-xs text-gray-500">
                           {new Date(u.created).toLocaleDateString()}
                         </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={3} className="px-5 py-4 text-center text-gray-500">
                        Nenhum usuário localizado.
                      </TableCell>
                    </TableRow>
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
