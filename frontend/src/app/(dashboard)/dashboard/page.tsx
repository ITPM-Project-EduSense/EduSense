"use client";

import Image from "next/image";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import LogoutButton from "@/components/LogoutButton";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading session...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-2xl font-semibold text-white">
              {(session.user.name || "U").slice(0, 1).toUpperCase()}
            </div>
          )}

          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            Welcome {session.user.name || "Student"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Email: {session.user.email || "No email available"}
          </p>

          <div className="mt-6">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
