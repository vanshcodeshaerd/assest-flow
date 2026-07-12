"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "confirmation">("email");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const emailValue = formData.get("email") as string;

    // Validation
    if (!emailValue || !/\S+@\S+\.\S+/.test(emailValue)) {
      setError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      const data = await res.json();

      if (res.ok) {
        setEmail(emailValue);
        setMessage(data.message);
        setStep("confirmation");
      } else {
        setError(data.message || "Unable to start password reset.");
      }
    } catch {
      setError("Unable to start password reset. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("Reset email resent successfully!");
      } else {
        setError(data.message || "Unable to resend reset email.");
      }
    } catch {
      setError("Unable to resend reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-background text-foreground grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-violet-500">Password Recovery</p>
            <h1 className="text-4xl font-semibold tracking-tight">
              {step === "email" ? "Reset your password" : "Check your email"}
            </h1>
            <p className="text-muted-foreground">
              {step === "email"
                ? "Enter your account email. If it exists, the system will prepare the reset flow."
                : `We've sent password reset instructions to ${email}`}
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={handleReset} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full rounded-2xl border border-border bg-foreground/5 p-4 text-sm outline-none transition-colors focus:border-violet-400/70 focus:bg-violet-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-foreground py-4 font-medium text-background transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-500">
                {message}
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500">
                  {error}
                </div>
              )}

              <button
                onClick={handleResend}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-border bg-foreground/5 py-4 font-medium text-foreground transition-all hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Resending..." : "Resend Email"}
              </button>

              <button
                onClick={() => setStep("email")}
                className="w-full rounded-2xl border border-border bg-foreground/5 py-4 font-medium text-muted-foreground transition-all hover:bg-secondary"
              >
                Try Different Email
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Link href="/login" className="text-violet-400 hover:underline">
              Organization login
            </Link>
            <Link href="/employee/login" className="text-violet-400 hover:underline">
              Employee login
            </Link>
          </div>
        </div>
      </section>

      <section className="hidden lg:block relative p-4">
        <div
          className="absolute inset-4 rounded-3xl bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=2160&q=80)",
          }}
        />
      </section>
    </main>
  );
}
