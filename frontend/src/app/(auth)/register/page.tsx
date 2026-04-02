"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import Auth3DVisualization from "@/components/Auth3DVisualization";
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

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
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
    <div className="relative min-h-svh overflow-hidden bg-[#f6faf8]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-176 -translate-x-1/2 rounded-full bg-lime-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-svh w-full max-w-7xl items-center px-3 py-3 md:px-6 md:py-4">
        <div className="grid h-full w-full overflow-hidden rounded-4xl border border-emerald-200/80 bg-white/60 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.06fr_0.94fr]">
          <section className="hidden h-full border-r border-white/10 bg-[#052e2b] p-7 text-white lg:flex lg:flex-col lg:justify-between xl:p-8">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="EduSense logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-xl border border-white/20 object-cover"
                />
                <h1 className="text-2xl font-semibold tracking-tight xl:text-3xl">EduSense</h1>
              </div>

              <div className="space-y-3">
                <h2 className="text-4xl font-semibold leading-[1.08] tracking-tight xl:text-5xl">
                  Build your
                  <span className="block bg-linear-to-r from-lime-300 to-emerald-300 bg-clip-text text-transparent">
                    learning rhythm
                  </span>
                </h2>
                <p className="max-w-md text-sm leading-6 text-emerald-100/85">
                  Create your workspace and get a personalized system for planning, task focus, and smarter daily study decisions.
                </p>
              </div>

              <Auth3DVisualization theme="emerald" />
            </div>

            <div className="h-1" />
          </section>

          <section className="flex h-full items-center justify-center bg-white/76 p-4 md:p-6">
            <div className="w-full max-w-xl rounded-3xl border border-emerald-200/70 bg-white/92 p-6 shadow-xl md:p-7">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Create account</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-[2rem]">Start your EduSense journey</h2>
            </div>

            <div className="mb-5 lg:hidden">
              <Auth3DVisualization theme="emerald" compact />
            </div>

            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Full Name</label>
                <div className="mt-2 flex items-center rounded-xl border border-slate-300 bg-white px-3 py-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <User size={18} className="mr-2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                    }}
                    className="w-full bg-transparent text-slate-900 outline-none"
                    placeholder="Your Name"
                  />
                </div>
                {fieldErrors.fullName && <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p>}
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Email</label>
                <div className="mt-2 flex items-center rounded-xl border border-slate-300 bg-white px-3 py-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
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
                <div className="mt-2 flex items-center rounded-xl border border-slate-300 bg-white px-3 py-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
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
                <p className="mt-1 text-xs text-slate-500">Use at least 6 characters.</p>
                {fieldErrors.password && <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white transition duration-300 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Workspace
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-900">
                Sign in
              </Link>
            </p>
            </div>
          </section>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute left-[12%] top-[18%] h-2 w-2 rounded-full bg-emerald-500" style={{ animation: "float 6.5s ease-in-out infinite" }} />
        <div className="absolute right-[18%] top-[28%] h-3 w-3 rounded-full bg-teal-500" style={{ animation: "float 7.8s ease-in-out infinite" }} />
        <div className="absolute right-[24%] bottom-[16%] h-2 w-2 rounded-full bg-lime-500" style={{ animation: "float 8.6s ease-in-out infinite" }} />
      </div>
    </div>
  );
}
