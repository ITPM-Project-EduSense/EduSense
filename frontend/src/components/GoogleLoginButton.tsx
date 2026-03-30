"use client";

import { signIn } from "next-auth/react";
import { Chrome } from "lucide-react";

export default function GoogleLoginButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-gray-100"
    >
      <Chrome size={16} />
      Continue with Google
    </button>
  );
}
