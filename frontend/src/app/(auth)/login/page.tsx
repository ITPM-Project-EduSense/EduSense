"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import Auth3DVisualization from "@/components/Auth3DVisualization";
import { useToast } from "@/components/Toast";
import { type FieldErrors, validateLoginInput } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validationErrors = validateLoginInput(email, password);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      addToast("Enter your email first, then click Forgot password.", "error");
      return;
    }

    setForgotLoading(true);

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail }),
      });

      addToast("Password reset link sent. Check your inbox.", "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset link";
      addToast(message, "error");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f9fc]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-teal-300/35 blur-3xl" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-176 -translate-x-1/2 rounded-full bg-slate-300/35 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 md:px-8 md:py-10">
        <div className="grid w-full overflow-hidden rounded-4xl border border-slate-200/80 bg-white/60 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.06fr_0.94fr]">
          <section className="hidden min-h-190 border-r border-white/10 bg-[#0f172a] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="EduSense logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-xl border border-white/20 object-cover"
                />
                <h1 className="text-3xl font-semibold tracking-tight">EduSense</h1>
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl font-semibold leading-[1.08] tracking-tight">
                  Study with
                  <span className="block bg-linear-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                    calm precision
                  </span>
                </h2>
                <p className="max-w-md text-sm leading-7 text-slate-300">
                  Plan your priorities, protect deep work hours, and stay ahead of deadlines with AI support built for academic flow.
                </p>
              </div>

              <Auth3DVisualization theme="cyan" />
            </div>

            <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-200">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                <ShieldCheck size={15} className="mb-2 text-cyan-300" />
                Secure session cookies
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                <Clock3 size={15} className="mb-2 text-cyan-300" />
                Smart timing insights
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                <Sparkles size={15} className="mb-2 text-cyan-300" />
                AI-first workflow
              </div>
            </div>
          </section>

          <section className="flex min-h-190 items-center justify-center bg-white/72 p-6 md:p-10">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white/92 p-8 shadow-xl md:p-10">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Welcome back</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Continue your momentum</h2>
            </div>

            <div className="mb-7 lg:hidden">
              <Auth3DVisualization theme="cyan" compact />
            </div>

            {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Email</label>
                <div className="mt-2 flex items-center rounded-xl border border-slate-300 bg-white px-3 py-3 transition focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100">
                  <Mail size={18} className="mr-2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    className="w-full bg-transparent text-slate-900 outline-none"
                    placeholder="student@example.com"
                  />
                </div>
                {fieldErrors.email && <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Password</label>
                <div className="mt-2 flex items-center rounded-xl border border-slate-300 bg-white px-3 py-3 transition focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100">
                  <Lock size={18} className="mr-2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    className="w-full bg-transparent text-slate-900 outline-none"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 transition-colors hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotLoading}
                  className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-900 disabled:opacity-60"
                >
                  {forgotLoading ? "Sending reset..." : "Forgot password?"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 py-3 font-semibold text-white transition duration-300 hover:shadow-lg hover:shadow-teal-500/30 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Enter Workspace
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">or continue</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <GoogleSignInButton
              onSuccess={() => router.push("/dashboard")}
              onError={(message) => setError(message)}
            />

            <p className="mt-7 text-center text-sm text-slate-600">
              New here?{" "}
              <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-900">
                Create account
              </Link>
            </p>
            </div>
          </section>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute left-[16%] top-[24%] h-2 w-2 rounded-full bg-teal-500" style={{ animation: "float 6s ease-in-out infinite" }} />
        <div className="absolute right-[20%] top-[20%] h-3 w-3 rounded-full bg-cyan-500" style={{ animation: "float 8s ease-in-out infinite" }} />
        <div className="absolute right-[12%] bottom-[18%] h-2 w-2 rounded-full bg-slate-400" style={{ animation: "float 7s ease-in-out infinite" }} />
      </div>
    </div>
  );
}
