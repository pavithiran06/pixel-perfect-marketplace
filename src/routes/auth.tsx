import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Hammer, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Kaigaar" },
      {
        name: "description",
        content: "Sign in to Kaigaar as a customer or a worker to book jobs or manage your work.",
      },
    ],
  }),
  component: AuthPage,
});

type Role = "customer" | "worker";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, role },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setMessage("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: role === "worker" ? "/dashboard" : "/", replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError("Google sign-in failed. Please try again.");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="paper-card p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold">
          {mode === "signin" ? "Welcome back" : "Join Kaigaar"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to book pros or manage your work."
            : "Create an account to get started."}
        </p>

        {/* Role picker */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`paper-card flex flex-col items-center gap-2 p-4 transition-all ${
              role === "customer" ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
            }`}
          >
            <Home className="h-6 w-6 text-primary" />
            <span className="text-sm font-bold">I need work done</span>
            <span className="text-xs text-muted-foreground">Customer</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("worker")}
            className={`paper-card flex flex-col items-center gap-2 p-4 transition-all ${
              role === "worker" ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
            }`}
          >
            <Hammer className="h-6 w-6 text-primary" />
            <span className="text-sm font-bold">I am a tradesperson</span>
            <span className="text-xs text-muted-foreground">Worker</span>
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" ? (
            <label className="block text-sm font-bold">
              Full name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field-input mt-1 font-normal"
                placeholder="Your name"
              />
            </label>
          ) : null}
          <label className="block text-sm font-bold">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input mt-1 font-normal"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm font-bold">
            Password
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input mt-1 font-normal"
              placeholder="At least 6 characters"
            />
          </label>
          {error ? <p className="text-sm font-bold text-destructive">{error}</p> : null}
          {message ? (
            <p className="rounded-lg bg-leaf/15 p-3 text-sm font-bold">{message}</p>
          ) : null}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <button type="button" onClick={google} className="btn-outline w-full">
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setMessage(null);
            }}
            className="font-bold text-primary underline"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
