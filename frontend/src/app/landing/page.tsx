import AnimatedBlob from "@/components/AnimatedBlob";
import FeatureCard from "@/components/FeatureCard";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarClock, FileText, Target } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <AnimatedBlob
        className="-left-24 -top-24 h-80 w-80 md:h-[26rem] md:w-[26rem]"
        gradient="radial-gradient(circle at center, #6366F1 0%, #06B6D4 70%, transparent 100%)"
        duration={20}
      />
      <AnimatedBlob
        className="-bottom-24 -right-24 h-80 w-80 md:h-[28rem] md:w-[28rem]"
        gradient="radial-gradient(circle at center, #06B6D4 0%, #22C55E 65%, transparent 100%)"
        duration={22}
      />

      <Navbar />
      <Hero />

      <section id="features" className="relative pb-20 pt-6 md:pb-28">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-600">
              Feature Highlights
            </p>
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Built for modern student workflows
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon="planner"
              title="AI Study Planner"
              description="Generate structured weekly sessions from your course load and deadlines in seconds."
            />
            <FeatureCard
              icon="prioritization"
              title="Smart Task Prioritization"
              description="Sort assignments by urgency, impact, and effort so you always know what to tackle first."
            />
            <FeatureCard
              icon="collaboration"
              title="Student Collaboration"
              description="Coordinate group study with shared task timelines and AI-assisted session suggestions."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/80 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">
              Trusted by focused learners from
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {["SLIIT", "NIBM", "IIT", "NSBM", "UCSC"].map((org) => (
                <span
                  key={org}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-slate-600"
                >
                  {org}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-2xl font-semibold text-slate-900">6.1 hrs</p>
              <p className="text-sm text-slate-500">Average weekly study time saved</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-2xl font-semibold text-slate-900">32%</p>
              <p className="text-sm text-slate-500">Fewer missed assignment deadlines</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-2xl font-semibold text-slate-900">4.8/5</p>
              <p className="text-sm text-slate-500">Student satisfaction score</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-600">
              How It Works
            </p>
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Three steps to your weekly study system
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white">
                <FileText size={22} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">1. Add your workload</h3>
              <p className="text-sm leading-6 text-slate-500">
                Upload modules, due dates, and current tasks so EduSense can understand your semester pressure.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white">
                <Target size={22} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">2. Get AI priorities</h3>
              <p className="text-sm leading-6 text-slate-500">
                The system scores urgency and impact, then orders what to do first based on your available time.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white">
                <CalendarClock size={22} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">3. Execute and adapt</h3>
              <p className="text-sm leading-6 text-slate-500">
                Track progress daily while AI updates your schedule when deadlines move or task load changes.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white/70 py-20">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-600">
              Student Voices
            </p>
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              What students say after switching to EduSense
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                quote:
                  "My weekly plan now takes minutes. I stopped missing lab deadlines entirely this semester.",
                name: "Nethmi Perera",
                role: "Software Engineering Student",
              },
              {
                quote:
                  "The priority list is accurate. I know exactly what to focus on each evening after lectures.",
                name: "Lahiru Jayasinghe",
                role: "Data Science Undergraduate",
              },
              {
                quote:
                  "Group project coordination improved a lot once we used shared tasks and AI schedule suggestions.",
                name: "Ishara Fernando",
                role: "Information Systems Student",
              },
            ].map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
              >
                <p className="mb-5 text-sm leading-7 text-slate-600">
                  &quot;{item.quote}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt={`${item.name} avatar`}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="mx-auto w-full max-w-4xl px-5 md:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.09)] md:p-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-600">
              Start Today
            </p>
            <h2 className="mb-4 text-3xl font-semibold text-slate-900 md:text-4xl">
              Turn your deadlines into a clear weekly plan
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
              Create your account and let EduSense organize priorities, time blocks, and task progress in one place.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
              >
                Start Studying
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
              >
                Log In
              </Link>
            </div>
            <div className="mt-4 flex justify-center">
              <GoogleLoginButton />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
