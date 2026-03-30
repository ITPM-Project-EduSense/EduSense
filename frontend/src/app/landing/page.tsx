"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import {
  Brain,
  Calendar,
  Users,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Target,
  Shield,
  Zap,
  Globe,
  ChevronRight,
  Bell,
  TrendingUp,
  Clock,
  Star,
  User,
  LogOut,
} from "lucide-react";

/* ─── Intersection Observer Hook ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ─── Floating Particles Component ─── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            background: `hsl(${230 + Math.random() * 30}, 80%, ${60 + Math.random() * 20}%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `floatParticle ${8 + Math.random() * 12}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Animated Task Card (Hero Decoration) ─── */
function AnimatedTaskCard({ delay, className }: { delay: string; className: string }) {
  return (
    <div
      className={`absolute bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/60 shadow-lg p-4 ${className}`}
      style={{ animation: `floatCard 6s ease-in-out infinite`, animationDelay: delay }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-5 h-5 rounded-md bg-indigo-500 flex items-center justify-center">
          <CheckCircle size={12} className="text-white" />
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full w-24" />
      </div>
      <div className="h-2 bg-slate-100 rounded-full w-32 mb-1.5" />
      <div className="h-2 bg-slate-100 rounded-full w-20" />
      <div className="flex items-center gap-2 mt-3">
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-full uppercase">Easy</span>
        <span className="text-[10px] text-slate-400">Due in 3 days</span>
      </div>
    </div>
  );
}

/* ─── Animated Priority Ring (Hero Decoration) ─── */
function AnimatedPriorityRing({ delay, className }: { delay: string; className: string }) {
  return (
    <div
      className={`absolute bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/60 shadow-lg p-4 ${className}`}
      style={{ animation: `floatCard 7s ease-in-out infinite`, animationDelay: delay }}
    >
      <div className="flex items-center gap-3">
        <div className="relative w-11 h-11">
          <svg viewBox="0 0 36 36" className="-rotate-90">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366F1" strokeWidth="3" strokeDasharray="78, 100" strokeLinecap="round" />
          </svg>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-indigo-600">7.8</span>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-700">Priority Score</div>
          <div className="text-[10px] text-orange-500 font-medium">High Priority</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Schedule Card (Hero Decoration) ─── */
function AnimatedScheduleCard({ delay, className }: { delay: string; className: string }) {
  return (
    <div
      className={`absolute bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/60 shadow-lg p-4 ${className}`}
      style={{ animation: `floatCard 8s ease-in-out infinite`, animationDelay: delay }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Calendar size={14} className="text-indigo-500" />
        <span className="text-[11px] font-semibold text-slate-700">Study Plan</span>
      </div>
      {[1, 2, 3].map((d) => (
        <div key={d} className="flex items-center gap-2 mb-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${d === 1 ? "bg-red-400" : d === 2 ? "bg-amber-400" : "bg-emerald-400"}`} />
          <div className={`h-1.5 bg-slate-100 rounded-full`} style={{ width: `${60 + d * 15}px` }} />
          <span className="text-[9px] text-slate-400">{d}h</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Notification Toast (Hero Decoration) ─── */
function AnimatedNotification({ delay, className }: { delay: string; className: string }) {
  return (
    <div
      className={`absolute bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/60 shadow-lg p-3 ${className}`}
      style={{ animation: `floatCard 9s ease-in-out infinite`, animationDelay: delay }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <Bell size={14} className="text-amber-500" />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-slate-700">Deadline Alert</div>
          <div className="text-[9px] text-slate-400">DSA Assignment due tomorrow</div>
        </div>
      </div>
    </div>
  );
}

/* ─── User Menu Dropdown ─── */
interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
}

function UserMenu({ isOpen, onClose, onEditProfile, onLogout }: UserMenuProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={onClose}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-16 right-0 w-52 bg-white rounded-lg shadow-xl border border-slate-100 z-40 py-1">
          <button
            onClick={onEditProfile}
            className="w-full text-left px-4 py-2.5 text-[13px] text-slate-700 hover:bg-indigo-50 transition-colors flex items-center gap-2"
          >
            <User size={14} className="text-indigo-500" />
            Edit Profile
          </button>
          <div className="border-t border-slate-100" />
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      )}
    </>
  );
}

/* ─────────────────────── MAIN PAGE ─────────────────────── */

interface User {
  id: string;
  email: string;
  full_name?: string;
  bio?: string;
}

interface ProfileFormState {
  fullName: string;
  email: string;
  bio: string;
}

export default function LandingPage() {
  const router = useRouter();
  const hero = useInView(0.1);
  const features = useInView(0.1);
  const workflow = useInView(0.1);
  const vision = useInView(0.1);
  const stats = useInView(0.1);
  const cta = useInView(0.1);

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    fullName: "",
    email: "",
    bio: "",
  });

  // Check if user is logged in by calling /api/auth/me
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
        
        const response = await fetch(`${apiBase}/auth/me`, {
          method: "GET",
          credentials: "include", // Send cookies with request
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          // User is authenticated
          const data = await response.json();
          const userData = data.user;
          setUser(userData);
          setIsLoggedIn(true);
          console.log("User authenticated:", userData);
        } else if (response.status === 401) {
          // User is not authenticated
          setIsLoggedIn(false);
          setUser(null);
          console.log("User not authenticated (401)");
        } else {
          // Unexpected error
          setIsLoggedIn(false);
          setUser(null);
          console.log("Auth check failed:", response.status);
        }
      } catch (error) {
        // API endpoint doesn't exist or network error
        console.log("Auth API call failed:", error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (!isProfileOpen) return;
    const loadProfile = async () => {
      setIsProfileLoading(true);
      setProfileError(null);

      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
        const response = await fetch(`${apiBase}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Unable to load profile");
        }

        const data = await response.json();
        const userData: User = data.user;
        setUser(userData);
        setProfileForm({
          fullName: userData.full_name || "",
          email: userData.email || "",
          bio: userData.bio || "",
        });
      } catch (error) {
        setProfileError("Failed to load profile. Please try again.");
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, [isProfileOpen]);

  // Handle logout
  const handleLogout = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
      
      const response = await fetch(`${apiBase}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setIsLoggedIn(false);
        setUser(null);
        setIsMenuOpen(false);
        router.push("/landing");
        console.log("Logged out successfully");
      } else {
        console.error("Logout failed with status:", response.status);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleOpenProfile = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(true);
  };

  const handleCloseProfile = () => {
    if (isSavingProfile) return;
    setIsProfileOpen(false);
  };

  const handleProfileChange = (
    field: keyof ProfileFormState,
    value: string
  ) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSavingProfile) return;
    setIsSavingProfile(true);
    setProfileError(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
      const response = await fetch(`${apiBase}/users/update-profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: profileForm.fullName,
          bio: profileForm.bio,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      const updatedUser: User = data.user || {
        id: user?.id || "",
        email: profileForm.email,
        full_name: profileForm.fullName,
        bio: profileForm.bio,
      };

      setUser(updatedUser);
      setIsProfileOpen(false);
    } catch (error) {
      setProfileError("Failed to update profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSignIn = () => {
    console.log("Sign In clicked - navigating to /login");
    router.push("/login");
  };

  const handleRegister = () => {
    console.log("Register clicked - navigating to /register");
    router.push("/register");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-hidden">

      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="EduSense logo"
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl border border-slate-200 object-cover shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
            />
            <span className="text-xl font-bold text-slate-800 tracking-tight font-[family-name:var(--font-playfair)]">
              Edu<span className="text-indigo-500">Sense</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[13px] text-slate-500 hover:text-indigo-500 transition-colors font-medium">Features</a>
            <a href="#vision" className="text-[13px] text-slate-500 hover:text-indigo-500 transition-colors font-medium">Vision</a>
            <a href="#modules" className="text-[13px] text-slate-500 hover:text-indigo-500 transition-colors font-medium">Modules</a>

            {/* Auth Section */}
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            ) : isLoggedIn ? (
              /* User Logged In - Show Avatar */
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white hover:shadow-lg transition-shadow overflow-hidden"
                  aria-label="User menu"
                >
                  {user?.full_name ? (
                    <span className="text-xs font-semibold">
                      {user.full_name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                  ) : (
                    <User size={18} />
                  )}
                </button>
                <UserMenu
                  isOpen={isMenuOpen}
                  onClose={() => setIsMenuOpen(false)}
                  onEditProfile={handleOpenProfile}
                  onLogout={handleLogout}
                />
              </div>
            ) : (
              /* User Not Logged In - Show Sign In & Register */
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSignIn}
                  className="px-4 py-2 text-slate-700 text-[13px] font-medium hover:text-indigo-600 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={handleRegister}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-[13px] font-medium shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Register <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={handleCloseProfile}
          />
          <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl border border-slate-100 animate-[scaleIn_0.2s_ease-out]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Edit Profile</h3>
                <p className="text-[12px] text-slate-500">Update your EduSense profile details</p>
              </div>
              <button
                onClick={handleCloseProfile}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
                aria-label="Close profile modal"
              >
                <span className="text-lg">×</span>
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="px-6 py-5 space-y-4">
              {profileError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
                  {profileError}
                </div>
              )}
              <div>
                <label className="text-[12px] font-medium text-slate-600">Full Name</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(event) => handleProfileChange("fullName", event.target.value)}
                  disabled={isProfileLoading}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] text-slate-500"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600">Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(event) => handleProfileChange("bio", event.target.value)}
                  disabled={isProfileLoading}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  rows={3}
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseProfile}
                  className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile || isProfileLoading}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[13px] font-semibold shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── HERO SECTION ─── */}
      <section ref={hero.ref} className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[920px] h-[620px] bg-gradient-to-b from-indigo-100/60 via-violet-100/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-16 right-[4%] w-[420px] h-[420px] bg-gradient-to-br from-violet-200/35 to-indigo-100/5 rounded-full blur-3xl" />
        <div className="absolute top-44 left-[2%] w-[320px] h-[320px] bg-gradient-to-tr from-sky-200/25 to-transparent rounded-full blur-3xl" />
        <FloatingParticles />

        {/* Floating UI Decorations */}
        <div className="hidden lg:block">
          <AnimatedTaskCard delay="0s" className="w-[200px] top-[140px] left-[6%]" />
          <AnimatedPriorityRing delay="1s" className="top-[120px] right-[7%]" />
          <AnimatedScheduleCard delay="2s" className="w-[180px] bottom-[60px] left-[8%]" />
          <AnimatedNotification delay="0.5s" className="bottom-[80px] right-[6%]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div
                className={`inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[12px] font-medium text-indigo-600 mb-7 transition-all duration-700 ${hero.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                <Sparkles size={13} />
                AI-Powered Student Productivity Platform
              </div>

              <h1
                className={`text-5xl sm:text-6xl md:text-[66px] font-semibold leading-tight tracking-tight mb-6 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 bg-clip-text text-transparent transition-all duration-700 delay-100 ${hero.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              >
                Study Smarter,
                <br />
                <span>Not Harder</span>
              </h1>

              <p
                className={`text-[17px] md:text-xl text-slate-600 max-w-xl mb-9 leading-relaxed transition-all duration-700 delay-200 ${hero.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              >
                EduSense gives university students an AI command center for academic success, combining
                intelligent task prioritization, adaptive schedules, and productivity coaching in one modern platform.
              </p>

              <div
                className={`flex flex-wrap items-center gap-4 transition-all duration-700 delay-300 ${hero.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              >
                <button
                  onClick={() => router.push("/dashboard")}
                  className="group inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-[15px] font-semibold shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Explore Dashboard
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/80 backdrop-blur-md text-slate-700 rounded-xl text-[15px] font-semibold border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                >
                  Learn More
                </a>
              </div>

              <div
                className={`flex flex-wrap items-center gap-2.5 mt-10 transition-all duration-700 delay-500 ${hero.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                {["Next.js", "FastAPI", "MongoDB", "Gemini AI", "Tailwind"].map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-medium text-slate-500 shadow-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className={`relative transition-all duration-700 delay-200 ${hero.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
              <div className="absolute -inset-3 bg-gradient-to-br from-indigo-500/15 to-violet-500/10 blur-2xl rounded-[28px]" />
              <div className="relative rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md shadow-[0_24px_80px_rgba(15,23,42,0.15)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold text-slate-800">EduSense Dashboard Preview</div>
                    <div className="text-[11px] text-slate-500">Realtime AI planning insights</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle size={11} /> Online
                  </span>
                </div>

                <div className="p-5 space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md p-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[12px] font-semibold text-slate-700">Study Plan Tasks</div>
                      <span className="text-[10px] text-slate-400">Today</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { task: "DSA Assignment", badge: "High", tone: "bg-rose-50 text-rose-600" },
                        { task: "Database Revision", badge: "Medium", tone: "bg-amber-50 text-amber-600" },
                        { task: "UI Prototype Review", badge: "Low", tone: "bg-emerald-50 text-emerald-600" },
                      ].map((row) => (
                        <div key={row.task} className="flex items-center justify-between text-[12px]">
                          <span className="text-slate-600">{row.task}</span>
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${row.tone}`}>{row.badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md p-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2 text-[12px] font-semibold text-slate-700">
                        <TrendingUp size={14} className="text-indigo-500" /> Productivity Score
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full w-[78%] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000" />
                      </div>
                      <div className="text-[11px] text-slate-500">78% this week</div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md p-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2 text-[12px] font-semibold text-slate-700">
                        <Target size={14} className="text-violet-500" /> Priority Indicator
                      </div>
                      <div className="text-2xl font-bold text-slate-800 leading-none">7.8</div>
                      <div className="text-[11px] text-rose-500 mt-1">High Focus Required</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md p-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-2 mb-3 text-[12px] font-semibold text-slate-700">
                      <Calendar size={14} className="text-indigo-500" /> AI Schedule Items
                    </div>
                    <div className="space-y-2">
                      {[
                        { slot: "08:00 - 10:00", topic: "Machine Learning Notes", color: "bg-indigo-500" },
                        { slot: "13:00 - 14:30", topic: "Group Project Sync", color: "bg-violet-500" },
                        { slot: "19:00 - 20:00", topic: "Quick Revision Sprint", color: "bg-emerald-500" },
                      ].map((item) => (
                        <div key={item.topic} className="flex items-center gap-3 text-[11px]">
                          <span className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-slate-500">{item.slot}</span>
                          <span className="text-slate-700 font-medium">{item.topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section ref={stats.ref} className="relative py-8 bg-white/80 backdrop-blur border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "4", label: "AI-Powered Modules", icon: <Brain size={20} /> },
              { value: "6+", label: "Smart Features", icon: <Zap size={20} /> },
              { value: "17", label: "Functional Requirements", icon: <CheckCircle size={20} /> },
              { value: "12", label: "Weeks Development", icon: <Clock size={20} /> },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`flex items-center gap-4 transition-all duration-600 ${stats.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800 leading-none">{stat.value}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES / MODULES ─── */}
      <section ref={features.ref} id="features" className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_42%)]" />
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Header */}
          <div className={`text-center mb-16 transition-all duration-700 ${features.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-4">
              <Target size={12} /> Core Modules
            </div>
            <h2 className="text-4xl md:text-[44px] font-semibold text-slate-800 tracking-tight leading-tight mb-4">
              Four Intelligent Modules
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Each module works together to create a comprehensive AI-assisted academic experience
            </p>
          </div>

          {/* Feature Cards */}
          <div id="modules" className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: <Calendar size={24} />,
                title: "Smart Study Planner",
                member: "Module 1",
                desc: "AI-powered task creation with automatic priority scoring. Upload course materials and get a personalized study schedule generated by Gemini AI.",
                features: ["Auto Priority Calculation", "AI Study Schedule", "Deadline Tracking", "Overload Detection"],
                color: "indigo",
                gradient: "from-indigo-500 to-blue-500",
              },
              {
                icon: <TrendingUp size={24} />,
                title: "AI Productivity Coach",
                member: "Module 2",
                desc: "Tracks your activity patterns, calculates productivity scores, and generates personalized feedback to help you improve study habits.",
                features: ["Activity Tracking", "Productivity Scoring", "Personalized Feedback", "Weekly Insights"],
                color: "emerald",
                gradient: "from-emerald-500 to-teal-500",
              },
              {
                icon: <Users size={24} />,
                title: "PeerConnect",
                member: "Module 3",
                desc: "Intelligent peer matching based on subjects, availability, and learning styles. Find the perfect study partner or collaboration group.",
                features: ["Smart Peer Matching", "Profile Analysis", "Collaboration Requests", "Shared Workspaces"],
                color: "violet",
                gradient: "from-violet-500 to-purple-500",
              },
              {
                icon: <BarChart3 size={24} />,
                title: "Smart Event Management",
                member: "Module 4",
                desc: "Discover and manage campus events with AI recommendations. Smart scheduling prevents overload and suggests events matching your interests.",
                features: ["Event Recommendations", "Load Validation", "Interest Matching", "Campus Calendar"],
                color: "amber",
                gradient: "from-amber-500 to-orange-500",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className={`group relative bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-7 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden ${features.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {/* Top gradient line */}
                <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Hover glow */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.04] rounded-full blur-3xl transition-opacity duration-500`} />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg`}>
                      {feature.icon}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-full">
                      {feature.member}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-800 mb-2 tracking-tight leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-[14px] text-slate-600 leading-relaxed mb-5">
                    {feature.desc}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {feature.features.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-medium text-slate-600">
                        <CheckCircle size={10} className="text-emerald-500" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI WORKFLOW SECTION ─── */}
      <section ref={workflow.ref} className="relative py-24 bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#020617] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.24),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.2),transparent_35%)]" />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className={`text-center mb-14 transition-all duration-700 ${workflow.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-4">
              <Zap size={12} /> AI Workflow
            </div>
            <h2 className="text-4xl md:text-[44px] font-semibold text-white tracking-tight leading-tight mb-4">
              How EduSense Works
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto text-[16px]">
              A focused 4-step pipeline that turns raw lecture materials into actionable study execution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "Step 1",
                title: "Upload Lecture Material",
                desc: "Share notes, slides, and references in one place.",
                icon: <BookOpen size={18} />,
              },
              {
                step: "Step 2",
                title: "AI Analyzes Documents",
                desc: "EduSense extracts concepts and identifies difficulty.",
                icon: <Brain size={18} />,
              },
              {
                step: "Step 3",
                title: "AI Generates Study Plan",
                desc: "Get a prioritized schedule based on deadlines and workload.",
                icon: <Calendar size={18} />,
              },
              {
                step: "Step 4",
                title: "Productivity Analytics",
                desc: "Track progress and refine your habits every week.",
                icon: <BarChart3 size={18} />,
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 hover:-translate-y-1 hover:bg-white/[0.08] hover:shadow-[0_0_40px_rgba(6,182,212,0.22)] transition-all duration-300 ${workflow.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="inline-flex w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white items-center justify-center mb-4 shadow-lg">
                  {item.icon}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold mb-2">{item.step}</div>
                <h3 className="text-[17px] font-semibold text-white mb-2 leading-snug">{item.title}</h3>
                <p className="text-[13px] text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VISION SECTION ─── */}
      <section ref={vision.ref} id="vision" className="relative py-24 bg-[#0F172A] overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[80px]" />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left - Text */}
            <div className={`transition-all duration-700 ${vision.inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-5">
                <Globe size={12} /> Our Vision
              </div>
              <h2 className="text-4xl md:text-[42px] font-semibold text-white leading-tight tracking-tight mb-6">
                Transforming Student
                <br />
                <span className="text-indigo-400">Productivity</span> with AI
              </h2>
              <p className="text-[16px] text-slate-300 leading-relaxed mb-8">
                EduSense reimagines the traditional student management system. Instead of passively storing data,
                we actively analyze behavior and provide intelligent decision support — turning every student
                into a more organized, productive, and engaged learner.
              </p>

              <div className="space-y-4">
                {[
                  { icon: <Brain size={18} />, title: "Decision Support, Not Just Automation", desc: "AI that guides you, not replaces you" },
                  { icon: <Shield size={18} />, title: "Predictive Alerts", desc: "Know about risks before they become problems" },
                  { icon: <Sparkles size={18} />, title: "Explainable Intelligence", desc: "Understand why AI makes each recommendation" },
                ].map((item, i) => (
                  <div
                    key={item.title}
                    className={`flex items-start gap-4 transition-all duration-600 ${vision.inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                    style={{ transitionDelay: `${300 + i * 150}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-white mb-0.5">{item.title}</div>
                      <div className="text-[13px] text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Animated Visual */}
            <div className={`relative transition-all duration-700 delay-200 ${vision.inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
              <div className="relative w-full aspect-square max-w-[420px] mx-auto">
                {/* Central orb */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl shadow-[0_0_90px_rgba(99,102,241,0.45)] flex items-center justify-center animate-[pulse_3s_ease-in-out_infinite]">
                  <Brain size={48} className="text-white" />
                </div>

                {/* Orbiting elements */}
                {[
                  { icon: <Calendar size={18} />, label: "Planner", angle: 0, color: "bg-indigo-500" },
                  { icon: <TrendingUp size={18} />, label: "Coach", angle: 90, color: "bg-emerald-500" },
                  { icon: <Users size={18} />, label: "Peers", angle: 180, color: "bg-violet-500" },
                  { icon: <BarChart3 size={18} />, label: "Events", angle: 270, color: "bg-amber-500" },
                ].map((orb, i) => {
                  const radius = 150;
                  const rad = (orb.angle * Math.PI) / 180;
                  const x = Math.cos(rad) * radius;
                  const y = Math.sin(rad) * radius;
                  return (
                    <div
                      key={orb.label}
                      className="absolute top-1/2 left-1/2 flex flex-col items-center gap-1.5"
                      style={{
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        animation: `orbitPulse 3s ease-in-out infinite`,
                        animationDelay: `${i * 0.4}s`,
                      }}
                    >
                      <div className={`w-12 h-12 ${orb.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                        {orb.icon}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">{orb.label}</span>
                    </div>
                  );
                })}

                {/* Connecting lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 420 420">
                  <circle cx="210" cy="210" r="150" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="1" strokeDasharray="8 4" className="animate-[spin_30s_linear_infinite]" />
                  <circle cx="210" cy="210" r="100" fill="none" stroke="rgba(99,102,241,0.06)" strokeWidth="1" strokeDasharray="4 4" className="animate-[spin_20s_linear_infinite_reverse]" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <GoogleLoginButton />
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section ref={cta.ref} className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/40 to-violet-50/30" />
        <div className={`relative max-w-3xl mx-auto px-6 text-center transition-all duration-700 ${cta.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="inline-flex items-center gap-2 mb-5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
            ))}
          </div>
          <h2 className="text-4xl md:text-[44px] font-semibold text-slate-800 tracking-tight leading-tight mb-4">
            Ready to Boost Your <span className="text-indigo-500">Productivity?</span>
          </h2>
          <p className="text-lg text-slate-600 mb-10 max-w-lg mx-auto">
            Join EduSense and experience the future of AI-assisted academic planning.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-[16px] font-semibold shadow-lg hover:scale-105 transition-all duration-300"
          >
            Go to Dashboard
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative bg-[#0F172A] border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="EduSense logo"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-xl border border-slate-700 object-cover shadow-lg"
                />
                <span className="text-lg font-bold text-white tracking-tight font-[family-name:var(--font-playfair)]">
                  Edu<span className="text-indigo-400">Sense</span>
                </span>
              </div>
              <p className="text-[13px] text-slate-500 leading-relaxed max-w-xs">
                An AI-powered student productivity and campus engagement platform.
                Built with passion by the EduSense Team.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Platform</h4>
              <div className="space-y-2.5">
                {["Dashboard", "Study Planner", "PeerConnect", "Analytics"].map((link) => (
                  <a key={link} href="#" className="block text-[13px] text-slate-500 hover:text-indigo-400 transition-colors">{link}</a>
                ))}
              </div>
            </div>

            {/* Project Info */}
            <div>
              <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-4">Project</h4>
              <div className="space-y-2.5">
                <p className="text-[13px] text-slate-500">Module: <span className="text-slate-400">ITPM</span></p>
                <p className="text-[13px] text-slate-500">University: <span className="text-slate-400">SLIIT</span></p>
                <p className="text-[13px] text-slate-500">Year: <span className="text-slate-400">3rd Year, 2nd Semester</span></p>
                <p className="text-[13px] text-slate-500">Team: <span className="text-indigo-400 font-medium">EduSense Team</span></p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-slate-600">
              © 2026 EduSense. All rights reserved. Built by <span className="text-indigo-400">EduSense Team</span> for ITPM at SLIIT.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-500 font-medium">Next.js</span>
              <span className="px-2.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-500 font-medium">FastAPI</span>
              <span className="px-2.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-500 font-medium">MongoDB</span>
              <span className="px-2.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-500 font-medium">Gemini AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
