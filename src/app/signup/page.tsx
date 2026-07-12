"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

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
    const password = e.target.value;
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const employeeId = formData.get("employeeId") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const department = formData.get("department") as string;
    const phone = formData.get("phone") as string;

    // Client-side validation
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!employeeId.trim()) newErrors.employeeId = "Employee ID is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(password)) newErrors.password = "Password must include an uppercase letter";
    else if (!/[a-z]/.test(password)) newErrors.password = "Password must include a lowercase letter";
    else if (!/[0-9]/.test(password)) newErrors.password = "Password must include a number";
    else if (!/[^A-Za-z0-9]/.test(password)) newErrors.password = "Password must include a special character";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!department.trim()) newErrors.department = "Department is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          employeeId,
          email: email.toLowerCase(),
          password,
          confirmPassword,
          department,
          phone: phone || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/employee/login");
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMap: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            errorMap[err.field] = err.message;
          });
          setErrors(errorMap);
        } else {
          setErrors({ general: data.message || "Signup failed" });
        }
      }
    } catch {
      setErrors({ general: "An error occurred during signup. Please try again." });
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

  return (
    <main className="min-h-[100dvh] bg-background text-foreground grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-violet-500">Employee Signup</p>
            <h1 className="text-4xl font-semibold tracking-tight">Create your employee account</h1>
            <p className="text-muted-foreground">
              New accounts always start as Employee. Admin can promote you later to Department Head,
              Asset Manager, or Admin.
            </p>
          </div>

          {errors.general && (
            <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  className="w-full rounded-2xl border border-border bg-foreground/5 p-4 text-sm outline-none transition-colors focus:border-violet-400/70 focus:bg-violet-500/10"
                />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  className="w-full rounded-2xl border border-border bg-foreground/5 p-4 text-sm outline-none transition-colors focus:border-violet-400/70 focus:bg-violet-500/10"
                />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="employeeId" className="text-sm font-medium text-muted-foreground">
                Employee ID
              </label>
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                placeholder="EMP001"
                className="w-full rounded-2xl border border-border bg-foreground/5 p-4 text-sm outline-none transition-colors focus:border-violet-400/70 focus:bg-violet-500/10"
              />
              {errors.employeeId && <p className="text-xs text-red-500">{errors.employeeId}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                Company Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@company.com"
                className="w-full rounded-2xl border border-border bg-foreground/5 p-4 text-sm outline-none transition-colors focus:border-violet-400/70 focus:bg-violet-500/10"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="department" className="text-sm font-medium text-muted-foreground">
                Department
              </label>
              <input
                id="department"
                name="department"
                type="text"
                placeholder="Engineering"
                className="w-full rounded-2xl border border-border bg-foreground/5 p-4 text-sm outline-none transition-colors focus:border-violet-400/70 focus:bg-violet-500/10"
              />
              {errors.department && <p className="text-xs text-red-500">{errors.department}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                className="w-full rounded-2xl border border-border bg-foreground/5 p-4 text-sm outline-none transition-colors focus:border-violet-400/70 focus:bg-violet-500/10"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                onChange={handlePasswordChange}
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
                    Password strength: <span className={getStrengthColor(passwordStrength).replace("bg-", "text-")}>{getStrengthLabel(passwordStrength)}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className="w-full rounded-2xl border border-border bg-foreground/5 p-4 text-sm outline-none transition-colors focus:border-violet-400/70 focus:bg-violet-500/10"
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-foreground py-4 font-medium text-background transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Create Employee Account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/employee/login" className="text-violet-400 hover:underline">
              Go to employee login
            </Link>
          </p>
        </div>
      </section>

      <section className="hidden lg:block relative p-4">
        <div
          className="absolute inset-4 rounded-3xl bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1551434678-e076c223a692?w=2160&q=80)",
          }}
        />
      </section>
    </main>
  );
}
