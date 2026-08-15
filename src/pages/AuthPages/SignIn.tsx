import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Login | Sofia Engenharia"
        description="Acesse o sistema de orçamentos de energia solar da Sofia Engenharia."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
