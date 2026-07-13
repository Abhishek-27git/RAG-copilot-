"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError("");
    if (error) setError("");
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (confirmError) setConfirmError("");
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");
    setConfirmError("");
    setError("");

    if (!token) {
      setError("Reset token is missing. Please request a new link.");
      return;
    }

    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="py-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Invalid Link</h2>
        <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
          The password reset token is missing. Please request a new password reset link.
        </p>
        <div className="mt-6">
          <Link href="/forgot-password">
            <Button size="sm" variant="outline" className="h-9 text-xs px-4">
              Go back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {!success ? (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Choose a new password
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Please enter your new password below to secure your account.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11px] font-medium text-destructive leading-normal mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="reset-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-9"
                  disabled={loading}
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
              {passwordError && (
                <p className="text-[11px] text-destructive font-medium">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="reset-confirm">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
                <Input
                  id="reset-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={handleConfirmChange}
                  placeholder="••••••••"
                  className="pl-10 h-9"
                  disabled={loading}
                />
              </div>
              {confirmError && (
                <p className="text-[11px] text-destructive font-medium">
                  {confirmError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full h-9 mt-2">
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Resetting password...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        </>
      ) : (
        <div className="py-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Password updated</h2>
          <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Your password has been reset successfully. You can now log in using your new password.
          </p>
          <div className="mt-6">
            <Link href="/login">
              <Button size="sm" className="w-full h-9 text-xs">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[380px] gap-4">
      <Card className="w-full">
        <CardContent className="pt-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shadow-md">
              <ShieldCheck className="h-5 w-5 text-primary" />
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

          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading request details...</p>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>

      <div className="flex items-center gap-1.5 justify-center text-[10.5px] text-muted-foreground/75 select-none font-medium mt-1">
        <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span>Enterprise-grade security · SOC 2 in progress</span>
      </div>
    </div>
  );
}
