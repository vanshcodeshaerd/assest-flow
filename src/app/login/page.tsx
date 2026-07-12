"use client";

import { SignInPage } from "@/components/ui/sign-in";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrganizationLogin() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        router.push(data.redirect || "/dashboard");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (e) {
      alert("An error occurred during authentication.");
    }
  };

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        title={
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-foreground tracking-tighter">AssetFlow AI</span>
            <span className="text-2xl font-light text-muted-foreground">{isSignUp ? "Create an Account" : "Welcome Back"}</span>
          </div>
        }
        description={isSignUp ? "Sign up to start managing your assets" : "Login to access your dashboard"}
        actionText={isSignUp ? "Create Account" : "Sign In"}
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        onSignIn={handleSubmit}
        onResetPassword={() => alert("Forgot Password Flow: Email Verification")}
        onCreateAccount={() => setIsSignUp(!isSignUp)}
        customFooter={
          <>
            <div className="animate-element animate-delay-700 relative flex items-center justify-center mb-6">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">or</span>
            </div>
            
            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground mb-6">
              {isSignUp ? "Already have an account?" : "New to our platform?"}{" "}
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); setIsSignUp(!isSignUp); }} 
                className="text-violet-400 hover:underline transition-colors"
              >
                {isSignUp ? "Log in here" : "Create Account"}
              </button>
            </p>

            <button 
              type="button" 
              onClick={() => router.push("/employee/login")} 
              className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors font-medium text-violet-400"
            >
              Continue as Employee →
            </button>
          </>
        }
      />
    </div>
  );
}
