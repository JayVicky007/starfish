"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Terminal, Key, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: { username: username.trim().toLowerCase() },
            },
          });

      if (result.error) {
        setMessage(result.error.message);
      } else if (mode === "signup" && !result.data.session) {
        setMessage("Check your email to confirm your account.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to establish core channel connection to the authentication database.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <main className="flex min-h-screen items-start justify-center bg-background px-6 py-10 text-foreground sm:py-14">
      <section className="w-full max-w-md rounded-3xl border border-text-muted/15 bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-7 space-y-6">
        <div className="flex items-center justify-between border-b border-text-muted/10 pb-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider transition-colors hover:text-accent">
            <ArrowLeft size={14} />
            <span>Exit Dashboard</span>
          </Link>
          <div className="flex items-center gap-1 text-[10px] font-bold text-accent uppercase tracking-wider bg-accent/5 px-2.5 py-1 rounded-full border border-accent/20">
            <Terminal size={10} />
            <span>Secure Access Node</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Key className="text-accent h-6 w-6" /> {mode === "login" ? "Account Sign In" : "Register Profile"}
          </h1>
          <p className="text-xs text-text-muted leading-relaxed font-medium">
            {mode === "login" 
              ? "Sign in to manage your account and publications."
              : "Create an account to write and publish content."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-text-muted">Corporate Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          {mode === "signup" && (
            <div>
              <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-text-muted">Username</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                maxLength={30}
                pattern="^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$"
                title="Use 3–30 letters, numbers, underscores, or dashes; start with a letter or number. Usernames can’t be changed later."
                value={username}
                onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                placeholder="choose_a_username"
                className="mt-1.5 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
              />
              <p className="mt-1 text-xs text-text-muted">Unique and permanent after account creation.</p>
            </div>
          )}
          <div>
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-text-muted">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          {message && (
            <p role="status" className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-xs font-semibold text-foreground">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-accent/10"
          >
            <ShieldCheck size={16} />
            {isSubmitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
          className="text-xs font-bold text-text-muted transition-colors hover:text-accent cursor-pointer block pt-2"
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
