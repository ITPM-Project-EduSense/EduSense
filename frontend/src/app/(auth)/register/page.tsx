"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { type FieldErrors, validateRegisterInput } from "@/lib/validation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validationErrors = validateRegisterInput(fullName, email, password);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      router.push("/login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="EduSense logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl border border-white/20 object-cover"
          />
          <h1 className="text-3xl font-bold">EduSense</h1>
        </div>

        <div>
          <h2 className="text-4xl font-semibold mb-4">Join EduSense Today</h2>
          <p className="text-white/80">Start organizing smarter with AI-powered planning.</p>
        </div>

        <div className="text-sm text-white/70">Copyright {new Date().getFullYear()} EduSense</div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Create Account</h2>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-slate-600">Full Name</label>
              <div className="mt-1 flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
                <User size={18} className="text-slate-400 mr-2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                  className="w-full outline-none bg-transparent"
                  placeholder="Your Name"
                />
              </div>
              {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>}
            </div>

            <div>
              <label className="text-sm text-slate-600">Email</label>
              <div className="mt-1 flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
                <Mail size={18} className="text-slate-400 mr-2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  className="w-full outline-none bg-transparent"
                  placeholder="student@example.com"
                />
              </div>
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="text-sm text-slate-600">Password</label>
              <div className="mt-1 flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
                <Lock size={18} className="text-slate-400 mr-2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  className="w-full outline-none bg-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">Password must be at least 6 characters.</p>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition text-white py-2.5 rounded-lg font-medium disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Register
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-slate-600 mt-6 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 hover:underline font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
