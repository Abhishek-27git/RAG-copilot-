"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
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
    if (emailError) setEmailError("");
    if (error) setError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError("");
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setError("");

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
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

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

          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in to your workspace to continue
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11px] font-medium text-destructive leading-normal mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="you@company.com"
                  className="pl-10 h-9"
                  disabled={loading}
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-destructive font-medium">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-primary hover:opacity-80 transition-opacity"
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
              {passwordError && (
                <p className="text-[11px] text-destructive font-medium">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full h-9 mt-2">
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

          {/* Footer link */}
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:opacity-90 underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-1.5 justify-center text-[10.5px] text-muted-foreground/75 select-none font-medium mt-1">
        <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span>Enterprise-grade security · SOC 2 in progress</span>
      </div>
    </div>
  );
}
