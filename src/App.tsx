import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Users from "./pages/Security/Users";
import NewBudget from "./pages/Budgets/NewBudget";
import BudgetDetails from "./pages/Budgets/BudgetDetails";
import AllBudgets from "./pages/Budgets/AllBudgets";
import BudgetManagement from "./pages/Budgets/BudgetManagement";
import AlterarSenhaPrimeiroAcesso from "./pages/AuthPages/AlterarSenhaPrimeiroAcesso";
import Profile from "./pages/Profile/Profile";
import { ToastProvider } from "./context/ToastContext";

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Auth Layout */}
          <Route path="/login" element={<SignIn />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Troca de senha de primeiro acesso */}
          <Route
            path="/alterar-senha"
            element={
              <ProtectedRoute>
                <AlterarSenhaPrimeiroAcesso />
              </ProtectedRoute>
            }
          />

          {/* Dashboard Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index path="/" element={<Home />} />
            <Route path="/perfil" element={<Profile />} />

            {/* Segurança */}
            <Route
              path="/seguranca/usuarios"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* Orçamentos */}
            <Route path="/orcamentos/novo" element={<NewBudget />} />
            <Route
              path="/orcamentos/detalhes/:id"
              element={<BudgetDetails />}
            />
            <Route
              path="/orcamentos/todos"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AllBudgets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orcamentos/gerenciamento"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <BudgetManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

