"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LoginPageProps {
  onSSOClick?: () => void;
}

/**
 * Login page redesign for DD Copilot.
 * Uses Better Auth's client sign-in method.
 * Displays inline validation errors instead of toasts.
 */
export default function LoginPage({ onSSOClick }: LoginPageProps): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (val: string): string => {
    if (!val) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) {
      setPasswordError("");
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    const mailErr = validateEmail(email);
    if (mailErr) {
      setEmailError(mailErr);
      return;
    }

    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes("email") && !authError.message?.toLowerCase().includes("password")) {
          setEmailError(authError.message);
        } else {
          setPasswordError(authError.message ?? "Invalid email or password");
        }
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setPasswordError("An unexpected error occurred. Please try again.");
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

        {/* Welcome back heading + one-line subtext */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="text-xs font-medium text-foreground"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="you@company.com"
                autoComplete="email"
                className="pl-10 pr-3 h-9 bg-background/30 border-input/60 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20 text-sm"
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-destructive font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                {emailError}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="text-xs font-medium text-foreground"
              >
                Password
              </label>
              <Link
                href="#"
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                autoComplete="current-password"
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
            {passwordError && (
              <p className="text-[11px] text-destructive font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                {passwordError}
              </p>
            )}
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
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        {/* Divider with "or" text */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/40" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-card px-2 text-muted-foreground/80 font-semibold tracking-wider">
              or
            </span>
          </div>
        </div>

        {/* Secondary "Continue with SSO" button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (onSSOClick) {
              onSSOClick();
            } else {
              console.log("SSO button clicked (stub)");
            }
          }}
          className="w-full h-9 border-border/60 hover:bg-muted/40 hover:text-foreground text-xs font-semibold transition-all"
        >
          Continue with SSO
        </Button>

        {/* Footer link */}
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors underline-offset-4 hover:underline"
          >
            Create one
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
