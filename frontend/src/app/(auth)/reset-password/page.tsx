"use client";

import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      addToast("Invalid reset link", "error");
    }
  }, [token, addToast]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset link");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: token,
          new_password: newPassword.trim(),
        }),
      });

      setSuccess(true);
      addToast("Password reset successfully! Redirecting to login...", "success");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
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
          <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-emerald-100 p-4 text-emerald-600">
                <CheckCircle2 size={32} />
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Password Reset Successful!</h2>
            <p className="text-slate-600 mb-6">
              Your password has been reset successfully. You will be redirected to login page in a few seconds.
            </p>

            <button
              onClick={() => router.push("/login")}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition text-white py-2.5 rounded-lg font-medium"
            >
              Go to Login
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
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
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Reset Your Password</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-100 text-rose-700 text-sm flex gap-2 items-start">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!token ? (
            <div className="p-4 rounded-lg bg-amber-100 text-amber-700 text-sm">
              Invalid reset link. Please request a new password reset.
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="text-sm text-slate-600">New Password</label>
                <div className="mt-1 flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
                  <Lock size={18} className="text-slate-400 mr-2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError(null);
                    }}
                    className="w-full outline-none bg-transparent"
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-600">Confirm Password</label>
                <div className="mt-1 flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
                  <Lock size={18} className="text-slate-400 mr-2" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    className="w-full outline-none bg-transparent"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition text-white py-2.5 rounded-lg font-medium disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600" />
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-3/4" />
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
