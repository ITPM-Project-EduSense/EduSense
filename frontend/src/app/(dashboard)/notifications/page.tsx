"use client";

import { Bell, CalendarClock, CheckCircle2, MailOpen, Sparkles } from "lucide-react";

const notifications = [
  {
    title: "Task reminders are on track",
    description: "Your upcoming deadlines will appear here with smart reminders as you add more tasks.",
    tone: "from-blue-500 to-indigo-500",
    icon: Bell,
  },
  {
    title: "Planner updates will show here",
    description: "Generated schedules, study plan changes, and AI nudges will be grouped into one timeline.",
    tone: "from-emerald-500 to-teal-500",
    icon: CalendarClock,
  },
  {
    title: "Course activity feed",
    description: "PeerConnect updates, materials activity, and completion milestones will surface here next.",
    tone: "from-fuchsia-500 to-violet-500",
    icon: MailOpen,
  },
];

export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 p-6 text-white shadow-[0_24px_80px_-28px_rgba(15,23,42,0.75)]">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur-sm">
              <Bell size={28} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100/80">
                EduSense · Inbox
              </p>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-100/80">
                One place for reminders, planner updates, and study activity across your workspace.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-50 backdrop-blur-sm">
            <Sparkles size={14} />
            Placeholder feed ready
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {notifications.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-[0_14px_42px_-24px_rgba(15,23,42,0.25)] backdrop-blur-sm"
            >
              <div className={`inline-flex rounded-2xl bg-gradient-to-br ${item.tone} p-3 text-white shadow-lg`}>
                <Icon size={20} />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={26} />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Notifications route fixed</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          The navigation link now lands on a valid page instead of a 404. As more real notification events are wired in,
          they can be rendered here without changing the route again.
        </p>
      </section>
    </div>
  );
}
