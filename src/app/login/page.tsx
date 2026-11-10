import LoginForm from "@/components/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    passwordReset?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialMessage =
    params.passwordReset === "success"
      ? "Your password has been updated. Sign in with your new password."
      : params.error === "link_invalid"
        ? "That confirmation link is invalid or has expired. Please request a new one."
        : "";

  return <LoginForm initialMessage={initialMessage} />;
}
