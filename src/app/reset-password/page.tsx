"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setErrors({ general: "Invalid or missing reset token" });
    }
  }, [searchParams]);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(password)) newErrors.password = "Password must include an uppercase letter";
    else if (!/[a-z]/.test(password)) newErrors.password = "Password must include a lowercase letter";
    else if (!/[0-9]/.test(password)) newErrors.password = "Password must include a number";
    else if (!/[^A-Za-z0-9]/.test(password)) newErrors.password = "Password must include a special character";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMap: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            errorMap[err.field] = err.message;
          });
          setErrors(errorMap);
        } else {
          setErrors({ general: data.message || "Password reset failed" });
        }
      }
    } catch {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return "bg-red-500";
    if (strength <= 2) return "bg-orange-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-green-400";
    return "bg-green-500";
  };

  const getStrengthLabel = (strength: number) => {
    if (strength <= 1) return "Weak";
    if (strength <= 2) return "Fair";
    if (strength <= 3) return "Good";
    if (strength <= 4) return "Strong";
    return "Very Strong";
  };

  if (isSuccess) {
    return (
      <main className="min-h-[100dvh] bg-background text-foreground grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-medium text-violet-500">Password Reset</p>
              <h1 className="text-4xl font-semibold tracking-tight">Password Changed</h1>
              <p className="text-muted-foreground">
                Your password has been successfully reset. You will be redirected to the login page shortly.
              </p>
            </div>

            <div className="rounded-2xl border border-green-500/50 bg-green-500/10 p-6 text-center">
              <svg
                className="w-16 h-16 mx-auto text-green-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-green-500 font-medium">Success!</p>
            </div>

            <button
              onClick={() => router.push("/login")}
              className="w-full rounded-2xl bg-foreground py-4 font-medium text-background transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Go to Login
            </button>
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

  return (
    <main className="min-h-[100dvh] bg-background text-foreground grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-violet-500">Password Reset</p>
            <h1 className="text-4xl font-semibold tracking-tight">Set New Password</h1>
            <p className="text-muted-foreground">
              Enter your new password below. Make sure it's strong and secure.
            </p>
          </div>

          {errors.general && (
            <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your new password"
                className="w-full rounded-2xl border border-border bg-foreground/5 p-4 text-sm outline-none transition-colors focus:border-violet-400/70 focus:bg-violet-500/10"
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              {passwordStrength > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          level <= passwordStrength ? getStrengthColor(passwordStrength) : "bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password strength:{" "}
                    <span className={getStrengthColor(passwordStrength).replace("bg-", "text-")}>
                      {getStrengthLabel(passwordStrength)}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full rounded-2xl border border-border bg-foreground/5 p-4 text-sm outline-none transition-colors focus:border-violet-400/70 focus:bg-violet-500/10"
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full rounded-2xl bg-foreground py-4 font-medium text-background transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Link href="/login" className="text-violet-400 hover:underline">
              Back to login
            </Link>
            <Link href="/forgot-password" className="text-violet-400 hover:underline">
              Request new reset link
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
