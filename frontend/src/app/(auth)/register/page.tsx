"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  // ✅ State variables
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,  // ✅ match backend field
          email,
          password,
        }),
      });

      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white p-12 flex-col justify-between">
        <h1 className="text-3xl font-bold">EduSense</h1>

        <div>
          <h2 className="text-4xl font-semibold mb-4">
            Join EduSense Today
          </h2>
          <p className="text-white/80">
            Start organizing smarter with AI-powered planning.
          </p>
        </div>

        <div className="text-sm text-white/70">
          © {new Date().getFullYear()} EduSense
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">

          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            Create Account 🚀
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="text-sm text-slate-600">Full Name</label>
              <div className="mt-1 flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
                <User size={18} className="text-slate-400 mr-2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full outline-none bg-transparent"
                  placeholder="Your Name"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
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
                  placeholder="••••••••"
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
            <a
              href="/login"
              className="text-indigo-600 hover:underline font-medium"
            >
              Login
            </a>
          </p>

        </div>
      </div>
    </div>
  );
}