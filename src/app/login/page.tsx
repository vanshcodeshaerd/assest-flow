"use client";

import { SignInPage } from "@/components/ui/sign-in";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrganizationLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    // Validation
    if (!identifier || !password) {
      setError("Email/Employee ID and password are required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push(data.redirect || "/dashboard");
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch {
      setError("An error occurred during authentication. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        title={
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-foreground tracking-tighter">AssetFlow AI</span>
            <span className="text-2xl font-light text-muted-foreground">Organization Login</span>
          </div>
        }
        description="Admin and promoted organization users can access the enterprise console here."
        idLabel="Email or Employee ID"
        idName="identifier"
        idType="text"
        actionText={loading ? "Signing in..." : "Sign In"}
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        onSignIn={handleSubmit}
        onResetPassword={() => router.push("/forgot-password")}
        customFooter={
          <>
            {error && (
              <div className="animate-element animate-delay-500 rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500">
                {error}
              </div>
            )}
            <div className="animate-element animate-delay-700 relative flex items-center justify-center mb-6">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">or</span>
            </div>

            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground mb-6">
              New employee?{" "}
              <Link href="/signup" className="text-violet-400 hover:underline transition-colors">
                Create an employee account
              </Link>
            </p>

            <button
              type="button"
              onClick={() => router.push("/employee/login")}
              className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors font-medium text-violet-400"
            >
              Continue as Employee -&gt;
            </button>
          </>
        }
      />
    </div>
  );
}
