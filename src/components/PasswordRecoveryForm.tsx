"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type PasswordRecoveryFormProps = {
  mode: "request" | "update";
  invalidLink?: boolean;
};

export default function PasswordRecoveryForm({
  mode,
  invalidLink = false,
}: PasswordRecoveryFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(
    invalidLink ? "This password reset link is invalid or has expired. Request a new one." : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      if (mode === "request") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password/update`,
        });

        if (error) {
          setMessage(error.message);
        } else {
          setMessage(
            "If an account exists for that email, we’ve sent a password reset link.",
          );
        }
        return;
      }

      if (password !== confirmPassword) {
        setMessage("The passwords do not match.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace("/login?passwordReset=success");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete the password recovery request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mode === "update" && invalidLink) {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-xs font-semibold text-foreground">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/reset-password"
          className="block text-center text-sm font-bold text-accent hover:underline"
        >
          Request a new reset link
        </Link>
        <Link
          href="/login"
          className="block text-center text-xs font-semibold text-text-muted transition-colors hover:text-accent"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "request" ? (
        <div>
          <label htmlFor="recovery-email" className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Email
          </label>
          <input
            id="recovery-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="new-password" className="text-xs font-bold uppercase tracking-wider text-text-muted">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
        </>
      )}

      {message && (
        <p role="status" className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-xs font-semibold text-foreground">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting
          ? "Please wait..."
          : mode === "request"
            ? "Send reset link"
            : "Update password"}
      </button>

      <Link
        href="/login"
        className="block text-center text-xs font-semibold text-text-muted transition-colors hover:text-accent"
      >
        Back to sign in
      </Link>
    </form>
  );
}
