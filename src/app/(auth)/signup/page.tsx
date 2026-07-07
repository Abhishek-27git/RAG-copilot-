"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Eye, EyeOff, Loader2, Mail, Lock, UserIcon, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Signup page.
 * Creates a new user with name, email, and password via Better Auth client.
 */
export default function SignupPage(): React.ReactElement {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await signUp.email({
        name,
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (authError) {
        setError(authError.message ?? "Failed to create account");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[380px] gap-4">
      {/* Centered card */}
      <div className="w-full rounded-2xl border border-border/50 bg-card/85 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
        
        {/* Header row: small rounded-square logo mark + wordmark & subtitle */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 shadow-md">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold tracking-tight text-foreground leading-tight">
              DD Copilot
            </span>
            <span className="text-[10.5px] font-medium text-muted-foreground leading-none">
              Due diligence AI
            </span>
          </div>
        </div>

        {/* Welcome heading + one-line subtext */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Get started with AI-powered due diligence
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General error message */}
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11px] font-medium text-destructive leading-normal">
              {error}
            </div>
          )}

          {/* Name field */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-name"
              className="text-xs font-medium text-foreground"
            >
              Full name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
              <Input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                autoComplete="name"
                className="pl-10 pr-3 h-9 bg-background/30 border-input/60 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20 text-sm"
              />
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-email"
              className="text-xs font-medium text-foreground"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="pl-10 pr-3 h-9 bg-background/30 border-input/60 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20 text-sm"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-password"
              className="text-xs font-medium text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                className="pl-10 pr-10 h-9 bg-background/30 border-input/60 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/80 font-medium">
              Must be at least 8 characters
            </p>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-9 mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-700 transition-all focus-visible:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        {/* Footer link */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Trust line below the card */}
      <div className="flex items-center gap-1.5 justify-center text-[10.5px] text-muted-foreground/75 select-none font-medium mt-1">
        <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span>Enterprise-grade security · SOC 2 in progress</span>
      </div>
    </div>
  );
}
