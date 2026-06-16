# Painel de Gestão - Orçamentos Solar (Frontend)

Este é o frontend do sistema de gerenciamento de dimensionamento e propostas comerciais para sistemas de energia solar fotovoltaica. Ele é construído sobre o ecossistema moderno do **React** com **Tailwind CSS v4** e se conecta de forma direta com o banco de dados e autenticação via **PocketBase BaaS**.

---

## 🛠️ Tecnologias Principais
* **React 19** (Single Page Application)
* **TypeScript** (Garantia de tipagem de dados e contratos)
* **Vite 6** (Empacotador rápido e servidor de desenvolvimento)
* **Tailwind CSS v4** (Estilização de alta performance com arquitetura atômica)
* **Zustand 5** (Gerenciador de estado global leve e caches em memória)
* **PocketBase SDK** (Sincronização em tempo real e autenticação de usuários)
* **React Hook Form + Zod** (Validações de regras de negócio em formulários)
* **React Router v7** (Controle de navegação declarativo e proteção de rotas por tipo de acesso)

---

## 📂 Funcionalidades & Telas Ativas

A aplicação está dividida em rotas e funcionalidades com controles de segurança de nível de acesso (`admin` ou `vendedor`):

### 📊 1. Dashboard (Geral)
* Visão geral de desempenho com métricas financeiras (total orçado, taxa de conversão, etc.).
* Exibição tabular de orçamentos recentes com links rápidos para visualização e refinamento.

### 📝 2. Novo Orçamento
* Formulário estruturado para inserção de dados de novos clientes.
* Autocompletar inteligente de cidades integrando busca direta no banco de dados.
* Dimensionamento solar básico inicial.

### 🛠️ 3. Refinamento Gerencial (Exclusivo Admin)
* Tela para alteração fina de preços de venda sugeridos.
* Parametrização técnica avançada (margem de segurança, custo de inversor, módulos, infraestrutura, mão de obra, seguro e impostos).
* Histórico e status de aprovação de orçamentos.

### 📄 4. Visualização Detalhada & PDF
* Tela de detalhes técnicos de cada orçamento refinado.
* Layout otimizado para impressão (geração direta de PDF comercial usando estilos CSS de impressão).

### 🔒 5. Segurança & Usuários (Exclusivo Admin)
* Tela para cadastrar e gerenciar novos colaboradores (atribuindo perfis de `admin` ou `vendedor`).

---

## 🚀 Como Rodar o Projeto Localmente

### 🔧 Pré-requisitos
* Node.js 18.x ou superior (Recomendado: v20+)

### ⚙️ Configuração do Ambiente
1. Na raiz da pasta `admin-page`, crie ou edite o arquivo `.env`:
   ```env
   VITE_POCKETBASE_URL=http://seu-endereco-pocketbase:porta
   ```
   *Substitua o valor acima pela URL onde o seu serviço do PocketBase está sendo executado.*

2. Instale as dependências de desenvolvimento:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento local:
   ```bash
   npm run dev
   ```

4. Para compilar a aplicação em código otimizado para produção (minificado):
   ```bash
   npm run build
   ```

---

## 📐 Estrutura Interna do Código (`src/`)
* `/components`: Componentes reutilizáveis (formulários, botões, modais, cabeçalhos, etc.).
* `/context`: Contextos globais rápidos da UI (autenticação, sidebar, alertas flutuantes).
* `/hooks`: Custom hooks encapsulando lógica de negócio de orçamentos e usuários.
* `/layout`: Layouts padrão estruturais das rotas (Sidebar + Header + Content).
* `/lib`: Instanciação do SDK do PocketBase.
* `/pages`: Visualizações/telas de rotas principais da aplicação (agrupadas em inglês).
* `/store`: Caches e estados de dados globais persistentes via Zustand.
