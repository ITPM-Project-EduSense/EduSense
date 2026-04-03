"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellRing,
  Check,
  Globe,
  Lock,
  LogOut,
  Moon,
  Shield,
  Sun,
  UserCog,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";

type UserSummary = {
  full_name?: string;
  email?: string;
};

type SettingsState = {
  theme: "light" | "dark" | "system";
  reminderEmails: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  profileVisibility: "private" | "friends" | "public";
  timezone: string;
};

const STORAGE_KEY = "edusense_user_settings_v1";

type ThemeMode = SettingsState["theme"];

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function applyTheme(mode: ThemeMode) {
  const theme = resolveTheme(mode);
  document.documentElement.setAttribute("data-theme", theme);
}

const defaultSettings: SettingsState = {
  theme: "light",
  reminderEmails: true,
  pushNotifications: true,
  weeklyDigest: false,
  profileVisibility: "friends",
  timezone: "Asia/Colombo",
};

export default function SettingsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  useEffect(() => {
    const init = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<SettingsState>;
          const merged = { ...defaultSettings, ...parsed };
          setSettings(merged);
          applyTheme(merged.theme);
        } else {
          applyTheme(defaultSettings.theme);
        }

        const me = await apiFetch("/auth/me");
        if (me?.user) {
          setUser({
            full_name: me.user.full_name,
            email: me.user.email,
          });
        }
      } catch {
        addToast("Could not load some settings. Using defaults.", "warning");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [addToast]);

  useEffect(() => {
    applyTheme(settings.theme);

    if (settings.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [settings.theme]);

  const profileStatus = useMemo(() => {
    if (!user?.full_name || !user?.email) return "Needs attention";
    return "Healthy";
  }, [user]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      addToast("Settings saved successfully.", "success");
    } catch {
      addToast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const logoutCurrentSession = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      addToast("Logged out successfully.", "info");
      router.push("/login");
    } catch {
      addToast("Logout failed. Try again.", "error");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 lg:p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 lg:p-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm lg:p-6">
        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-emerald-200/25 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 lg:text-3xl">Settings Center</h1>
            <p className="mt-2 text-sm text-slate-600">Control account preferences, privacy, and experience defaults.</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Profile status</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{profileStatus}</p>
            <p className="text-xs text-slate-500">{user?.email || "No user loaded"}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <UserCog size={18} className="text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Account Preferences</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Theme</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { key: "light", label: "Light", icon: Sun },
                  { key: "dark", label: "Dark", icon: Moon },
                  { key: "system", label: "System", icon: Globe },
                ].map((item) => {
                  const active = settings.theme === item.key;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateSetting("theme", item.key as SettingsState["theme"])}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
                        active
                          ? "border-blue-300 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon size={16} />
                        {item.label}
                      </span>
                      {active && <Check size={15} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Privacy</p>
              <select
                value={settings.profileVisibility}
                onChange={(e) => updateSetting("profileVisibility", e.target.value as SettingsState["profileVisibility"])}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="private">Private</option>
                <option value="friends">Friends only</option>
                <option value="public">Public</option>
              </select>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Timezone</p>
              <input
                value={settings.timezone}
                onChange={(e) => updateSetting("timezone", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Asia/Colombo"
              />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BellRing size={18} className="text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          </div>

          <div className="space-y-3">
            {[
              { key: "reminderEmails", label: "Deadline reminder emails" },
              { key: "pushNotifications", label: "Push notifications" },
              { key: "weeklyDigest", label: "Weekly digest report" },
            ].map((item) => {
              const enabled = settings[item.key as keyof SettingsState] as boolean;
              return (
                <label key={item.key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => updateSetting(item.key as keyof SettingsState, !enabled as never)}
                    className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-blue-600" : "bg-slate-300"}`}
                    aria-pressed={enabled}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? "left-5" : "left-0.5"}`} />
                  </button>
                </label>
              );
            })}
          </div>
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Shield size={18} className="text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Security</h2>
          </div>
          <p className="text-sm text-slate-600">
            Session uses secure HTTP-only cookie authentication. For password updates and profile details,
            use the user profile panel.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/users")}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Open User Management
            </button>
            <button
              type="button"
              onClick={logoutCurrentSession}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
            >
              <LogOut size={14} />
              Logout current session
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Lock size={18} className="text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Save Changes</h2>
          </div>
          <p className="text-sm text-slate-600">
            Settings are stored for your account experience on this browser.
          </p>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="mt-4 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </article>
      </section>
    </div>
  );
}
