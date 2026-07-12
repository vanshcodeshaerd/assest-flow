"use client";

import { SignInPage } from "@/components/ui/sign-in";
import { useRouter } from "next/navigation";

export default function EmployeeLogin() {
  const router = useRouter();

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/employee-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push(data.redirect || "/employee/dashboard");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert("An error occurred during sign in.");
    }
  };

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        title={
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-foreground tracking-tighter">AssetFlow AI</span>
            <span className="text-2xl font-light text-muted-foreground">Employee Portal</span>
          </div>
        }
        description="Login with your employee email and password."
        heroImageSrc="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=2160&q=80"
        idLabel="Employee Email"
        idName="email"
        idType="email"
        onSignIn={handleSignIn}
        onResetPassword={() => router.push("/forgot-password")}
        customFooter={
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors font-medium text-violet-400"
            >
              Create Employee Account
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="animate-element animate-delay-900 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors font-medium text-muted-foreground"
            >
              &lt;- Back to Organization Login
            </button>
          </div>
        }
      />
    </div>
  );
}
