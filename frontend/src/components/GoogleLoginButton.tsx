"use client";

import { useRouter } from "next/navigation";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function GoogleLoginButton() {
  const router = useRouter();

  return <GoogleSignInButton onSuccess={() => router.push("/dashboard")} />;
}
