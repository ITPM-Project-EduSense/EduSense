"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { CheckCircle2, LogOut, Shield, UserRound, Users } from "lucide-react";
import { useRouter } from "next/navigation";

type CurrentUser = {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
};

type Preferences = {
  deadlineReminders: boolean;
  emailNotifications: boolean;
  weeklyDigest: boolean;
};

export default function UsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  const [preferences, setPreferences] = useState<Preferences>(() => {
    if (typeof window === "undefined") {
      return { deadlineReminders: true, emailNotifications: true, weeklyDigest: false };
    }
    const saved = localStorage.getItem("edusense_preferences");
    return saved
      ? (JSON.parse(saved) as Preferences)
      : { deadlineReminders: true, emailNotifications: true, weeklyDigest: false };
  });

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/auth/me");
      const current = data?.user as CurrentUser;
      if (!current) throw new Error("User data not found");
      setUser(current);
      setFullName(current.full_name || "");
      setBio(current.bio || "");
    } catch (e: unknown) {
      const messageValue = e instanceof Error ? e.message : "Failed to load user profile";
      setError(messageValue);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    localStorage.setItem("edusense_preferences", JSON.stringify(preferences));
  }, [preferences]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      const payload = {
        full_name: fullName.trim(),
        bio: bio.trim(),
      };
      const data = await apiFetch("/users/update-profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setUser(data?.user || user);
      setMessage("Profile updated successfully.");
    } catch (e: unknown) {
      const messageValue = e instanceof Error ? e.message : "Failed to update profile";
      setError(messageValue);
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 lg:p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6">
        <p className="text-sm font-medium text-slate-500">Admin Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">User Management Panel</h1>
        <p className="mt-1 text-sm text-slate-600">Manage account profile, preferences, and security settings.</p>
      </section>

      {error && (
        <section className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </section>
      )}
      {message && (
        <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </section>
      )}

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <UserRound size={18} className="text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                  placeholder="Enter full name"
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Email</label>
                <input
                  value={user?.email || ""}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                placeholder="Tell something about your academic goals"
                disabled={loading}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || loading}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users size={18} className="text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">User Directory</h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-800">{user?.full_name || "Current User"}</p>
            <p className="mt-1 text-xs text-slate-500">{user?.email || "user@edusense.com"}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 size={12} />
              Active
            </span>
          </div>
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Preferences</h2>
          <p className="mt-1 text-sm text-slate-500">Personalize alerts and communication settings.</p>

          <div className="mt-4 space-y-3">
            {[
              { key: "deadlineReminders", label: "Deadline reminders" },
              { key: "emailNotifications", label: "Email notifications" },
              { key: "weeklyDigest", label: "Weekly productivity digest" },
            ].map((item) => {
              const checked = preferences[item.key as keyof Preferences];
              return (
                <label key={item.key} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <Shield size={18} className="text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Security</h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-700">
              Session is protected using secure HTTP-only cookie authentication.
            </p>
          </div>
          <button
            onClick={logout}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
          >
            <LogOut size={14} />
            Logout from this session
          </button>
        </article>
      </section>
    </div>
  );
}
