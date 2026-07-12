"use client";

import { SignInPage } from "@/components/ui/sign-in";
import { useRouter } from "next/navigation";

export default function EmployeeLogin() {
  const router = useRouter();

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const employeeId = formData.get("employeeId") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/employee-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        router.push(data.redirect || "/employee/dashboard");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (e) {
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
        description="Login with your Employee ID"
        heroImageSrc="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=2160&q=80"
        idLabel="Employee ID"
        idName="employeeId"
        idType="text"
        onSignIn={handleSignIn}
        onResetPassword={() => alert("Forgot Password Flow: Employee ID Verification -> Email OTP")}
        customFooter={
          <button 
            type="button" 
            onClick={() => router.push("/login")} 
            className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors font-medium text-muted-foreground"
          >
            ← Back to Organization Login
          </button>
        }
      />
    </div>
  );
}
