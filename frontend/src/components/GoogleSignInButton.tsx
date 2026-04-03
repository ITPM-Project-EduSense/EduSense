"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithPopup, signInWithRedirect } from "firebase/auth";

import { apiFetch } from "@/lib/api";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase";

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  className?: string;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  className = "",
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const auth = getFirebaseAuth();

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken(true);

      await apiFetch("/auth/firebase-login", {
        method: "POST",
        body: JSON.stringify({ id_token: idToken }),
      });

      onSuccess?.();
    } catch (error: unknown) {
      const errorCode =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code)
          : "";

      const shouldUseRedirectFallback =
        errorCode === "auth/popup-blocked" ||
        errorCode === "auth/popup-closed-by-user" ||
        errorCode === "auth/cancelled-popup-request" ||
        errorCode === "auth/network-request-failed";

      if (shouldUseRedirectFallback) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {
          // Continue to unified error handling below.
        }
      }

      const message = mapFirebaseAuthError(errorCode, error);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className={[
        "w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5",
        "text-sm font-medium text-zinc-800 shadow-sm transition",
        "hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70",
        "flex items-center justify-center gap-2",
        className,
      ].join(" ")}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <GoogleIcon />
          Continue with Google
        </>
      )}
    </button>
  );
}

function mapFirebaseAuthError(code: string, error: unknown): string {
  if (code === "auth/unauthorized-domain") {
    return "This domain is not authorized in Firebase Auth. Add localhost (or your current host) in Firebase Console > Authentication > Settings > Authorized domains.";
  }

  if (code === "auth/network-request-failed") {
    return "Google Sign-In could not reach Firebase. Check your internet, disable strict ad/tracker blockers for this site, and try again.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "The Google sign-in window was closed before completion.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Google Sign-In failed. Please try again.";
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6.1-2.8-6.1-6.1s2.8-6.1 6.1-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.7-4.1 9.7-9.9 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M3.2 7.3l3.2 2.3C7.3 7.5 9.4 6 12 6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 8.2 2 4.9 4.1 3.2 7.3z"
      />
      <path
        fill="#4A90E2"
        d="M12 22c2.6 0 4.9-.9 6.5-2.4l-3-2.4c-.8.6-2 1-3.5 1-3.9 0-5.3-2.6-5.6-3.9l-3.2 2.5C4.9 19.9 8.2 22 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M3.2 16.8l3.2-2.5c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8L3.2 8.2C2.4 9.8 2 10.9 2 12s.4 2.2 1.2 4.8z"
      />
    </svg>
  );
}
