# Contexto do Projeto: Painel Administrativo Solar (React + Vite)

Este documento resume o estado atual do projeto para facilitar a continuidade do desenvolvimento.

## 🚀 Tecnologias Utilizadas
- **Frontend:** React 18 (Vite), TypeScript, Tailwind CSS.
- **Roteamento:** React Router.
- **Gerenciamento de Estado:** Context API (`AuthContext`, `SidebarContext`, `ThemeContext`).
- **Formulários:** React Hook Form + Zod (Validação).
- **Backend/Auth:** PocketBase (SQLite, Auth, Storage) rodando em http://150.136.18.45.
- **Ícones:** Lucide React.

## 🔐 Autenticação e Segurança
- **AuthContext:** Gerenciamento de sessões com PocketBase SDK.
- **Níveis de Acesso:** Baseado no campo `tipo_acesso` do PocketBase (`admin` ou `vendedor`).
- **Integração PocketBase:** Sessão persistente via `pb.authStore`.
- **isAdmin:** Booleano derivado para controle de UI e acesso a rotas.

### 1. Módulo de Login
- **SignInForm:** Formulário de acesso integrado ao PocketBase.
- **Logout:** Encerramento de sessão via `pb.authStore.clear()`.

### 2. Gestão de Usuários (Segurança)
- **Usuarios:** Página administrativa para criação e listagem de usuários.
- **Regras:** Somente `admin` pode acessar e criar novos usuários.
- **Campos:** Nome, Email, Senha, Confirmar Senha, Tipo de Acesso.

### 3. Módulo de Orçamentos
- **Novo Orçamento:** Página de alta fidelidade para captação de solicitações.
- **Formulário:** Registro de dados do cliente, localidade e consumo mensal.
- **Histórico:** Listagem das solicitações realizadas pelo próprio usuário ou visão geral para Admins.
- **Campos de Captação:** Cliente, UF/Cidade, Estrutura, Padrão, Consumo (R$), Tarifa, Mão de Obra e Equipamento Local.

## 💾 Estrutura de Banco de Dados (PocketBase)
- **users:** Coleção central de usuários e perfis.
- **orcamentos:** Registro das solicitações de orçamento.
- **irradiacao:** Base de dados de apoio para consultas de HSP local.

---
*Última atualização: Maio de 2026*
