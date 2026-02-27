"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      router.push("/landing");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
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

        <div className="space-y-6">
          <h2 className="text-4xl font-semibold leading-tight">Master Your Productivity.</h2>
          <p className="text-lg text-white/80">
            AI-powered planner built to help students organize, prioritize and achieve more every day.
          </p>
        </div>

        <div className="text-sm text-white/70">Copyright {new Date().getFullYear()} EduSense</div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Welcome Back</h2>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-slate-600">Email</label>
              <div className="mt-1 flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
                <Mail size={18} className="text-slate-400 mr-2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full outline-none bg-transparent"
                  placeholder="student@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-600">Password</label>
              <div className="mt-1 flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
                <Lock size={18} className="text-slate-400 mr-2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full outline-none bg-transparent"
                  placeholder="********"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition text-white py-2.5 rounded-lg font-medium disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-slate-600 mt-6 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-600 hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
