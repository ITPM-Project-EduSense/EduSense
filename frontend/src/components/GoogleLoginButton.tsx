"use client";

import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function GoogleLoginButton() {
  return <GoogleSignInButton onSuccess={() => window.location.assign("/dashboard")} />;
}
