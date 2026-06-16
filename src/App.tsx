import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
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
import { ToastProvider } from "./context/ToastContext";

export default function App() {
  return (
    <ToastProvider>
      <Router basename="/">
        <ScrollToTop />
        <Routes>
          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />

          {/* Dashboard Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index path="/" element={<Home />} />

            {/* Segurança */}
            <Route
              path="/security/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* Orçamentos */}
            <Route path="/budgets/new" element={<NewBudget />} />
            <Route
              path="/budgets/details/:id"
              element={<BudgetDetails />}
            />
            <Route
              path="/budgets/all"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AllBudgets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/budgets/management"
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
