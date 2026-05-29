"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "@/components/icons";
import { Link } from "@/components/Link";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Account created but sign-in failed. Try signing in.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-accent/30 focus:ring-2";

  return (
    <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Create account</h1>
      <p className="mt-1 text-sm text-muted">Save your leisure list in the cloud</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted">At least 8 characters</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:brightness-110 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
