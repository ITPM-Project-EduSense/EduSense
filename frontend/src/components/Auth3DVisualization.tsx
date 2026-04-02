"use client";

import Image from "next/image";

interface Auth3DVisualizationProps {
  theme?: "cyan" | "emerald";
  compact?: boolean;
}

const ORBS = [
  { size: 132, x: 6, y: 10, z: 40, d: "0s" },
  { size: 94, x: 52, y: 18, z: 90, d: "0.7s" },
  { size: 74, x: 72, y: 62, z: 20, d: "1.2s" },
  { size: 64, x: 18, y: 70, z: 70, d: "1.7s" },
  { size: 46, x: 44, y: 52, z: 120, d: "2.1s" },
];

const RINGS = [
  { size: 220, x: 14, y: 16, d: "0s" },
  { size: 180, x: 46, y: 28, d: "0.8s" },
  { size: 140, x: 36, y: 52, d: "1.4s" },
];

export default function Auth3DVisualization({ theme = "cyan", compact = false }: Auth3DVisualizationProps) {
  const palette =
    theme === "emerald"
      ? {
          orbA: "from-emerald-300 via-green-300 to-teal-400",
          orbB: "from-lime-300 via-emerald-300 to-teal-300",
          line: "border-emerald-200/50",
          ring: "border-emerald-300/30",
          glow: "from-emerald-300/35 to-teal-300/20",
          logoGlow: "shadow-emerald-300/40",
          badge: "border-emerald-200/40 bg-emerald-100/15 text-emerald-100",
        }
      : {
          orbA: "from-cyan-300 via-sky-300 to-indigo-400",
          orbB: "from-fuchsia-300 via-cyan-300 to-blue-300",
          line: "border-sky-200/50",
          ring: "border-cyan-300/30",
          glow: "from-cyan-300/35 to-indigo-300/20",
          logoGlow: "shadow-cyan-300/40",
          badge: "border-cyan-200/40 bg-sky-100/15 text-cyan-100",
        };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/35 ${compact ? "h-60" : "mt-8 h-90"}`}
      style={{ perspective: "1100px" }}
    >
      <div className={`absolute inset-0 bg-linear-to-br ${palette.glow}`} />

      <div
        className="absolute inset-6 rounded-2xl border border-white/10"
        style={{
          transform: "rotateX(14deg) rotateY(-12deg)",
          transformStyle: "preserve-3d",
          animation: "authFloat3d 8s ease-in-out infinite",
        }}
      >
        {RINGS.map((ring) => (
          <div
            key={ring.size}
            className={`absolute rounded-full border ${palette.ring}`}
            style={{
              width: ring.size,
              height: ring.size,
              left: `${ring.x}%`,
              top: `${ring.y}%`,
              animation: `authOrbit ${10 + ring.size / 40}s linear infinite`,
              animationDelay: ring.d,
            }}
          />
        ))}

        {ORBS.map((orb, idx) => (
          <div
            key={`${orb.size}-${orb.x}`}
            className="absolute"
            style={{
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              transform: `translateZ(${orb.z}px)`,
              animation: `authFloat3d ${7 + idx}s ease-in-out infinite`,
              animationDelay: orb.d,
            }}
          >
            <div
              className={`rounded-full bg-linear-to-br ${idx % 2 ? palette.orbB : palette.orbA} shadow-2xl`}
              style={{
                width: orb.size,
                height: orb.size,
                boxShadow: "0 20px 40px rgba(2, 6, 23, 0.45)",
              }}
            />
          </div>
        ))}

        <div className="absolute left-[12%] top-[38%] w-[76%]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`mb-4 h-2 rounded-full border ${palette.line} bg-white/10`}
              style={{
                width: `${78 - i * 18}%`,
                animation: `authPulse ${3 + i * 0.8}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>

        <div
          className="absolute left-1/2 top-1/2 z-20"
          style={{
            transform: "translate(-50%, -50%) translateZ(140px)",
            transformStyle: "preserve-3d",
            animation: "authLogoTilt 7s ease-in-out infinite",
          }}
        >
          <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" style={{ animation: "authOrbit 14s linear infinite" }} />
          <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" style={{ animation: "authOrbit 9s linear infinite reverse" }} />

          <div className={`relative flex min-w-44 items-center gap-3 rounded-2xl border border-white/25 bg-slate-900/60 px-4 py-3 shadow-2xl backdrop-blur-md ${palette.logoGlow}`}>
            <Image
              src="/logo.png"
              alt="EduSense logo"
              width={34}
              height={34}
              className="h-8 w-8 rounded-lg border border-white/20 object-cover"
            />
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">EduSense</p>
              <p className={`mt-0.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${palette.badge}`}>
                Focus OS
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
