import Link from "next/link";
import PasswordRecoveryForm from "@/components/PasswordRecoveryForm";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-start justify-center bg-background px-6 py-10 text-foreground sm:py-14">
      <section className="w-full max-w-md space-y-6 rounded-3xl border border-text-muted/15 bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-7">
        <div className="space-y-2">
          <Link href="/login" className="text-xs font-semibold text-text-muted hover:text-accent">
            Back to sign in
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Reset your password
          </h1>
          <p className="text-sm leading-relaxed text-text-muted">
            Enter your account email and we’ll send a link to choose a new password.
          </p>
        </div>
        <PasswordRecoveryForm mode="request" />
      </section>
    </main>
  );
}
