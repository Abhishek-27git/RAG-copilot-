"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ShieldCheck, ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError("");
    setError("");

    const mailErr = validateEmail(email);
    if (mailErr) {
      setEmailError(mailErr);
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again later.");
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

          {!success ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Reset password
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter your email address and we&apos;ll send you a link to reset your password.
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
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
                    <Input
                      id="reset-email"
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

                {/* Submit Button */}
                <Button type="submit" disabled={loading} className="w-full h-9 mt-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    "Send reset link"
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
              <h2 className="text-lg font-semibold text-foreground tracking-tight">Check your email</h2>
              <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                If your email is registered with us, we have sent a password reset link to <strong className="text-foreground">{email}</strong>.
              </p>
              <p className="mt-4 text-[10px] text-muted-foreground/80 italic">
                Note: During development, check the FastAPI backend logs/terminal output for the generated reset token and link!
              </p>
            </div>
          )}

          {/* Footer link */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:opacity-90 underline-offset-4 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
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
