import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Login | Sistema de Orçamentos"
        description="Página de login do sistema de orçamentos de energia solar."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
