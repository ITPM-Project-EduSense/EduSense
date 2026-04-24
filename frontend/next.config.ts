import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const isVercelDeployment = Boolean(process.env.VERCEL);
const defaultBackendOrigin = isVercelDeployment
  ? "https://edusense-production.up.railway.app"
  : "http://localhost:8000";

function normalizeBackendOrigin(origin: string) {
  const trimmedOrigin = origin.trim().replace(/\/+$/, "");

  if (!trimmedOrigin) {
    return defaultBackendOrigin;
  }

  if (isVercelDeployment && trimmedOrigin.startsWith("http://")) {
    return `https://${trimmedOrigin.slice("http://".length)}`;
  }

  return trimmedOrigin;
}

const rawBackendOrigin =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  defaultBackendOrigin;
const backendOrigin = normalizeBackendOrigin(rawBackendOrigin);

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    if (!isVercelDeployment) {
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: [
          {
            // Force any accidental insecure subrequest back onto HTTPS.
            key: "Content-Security-Policy",
            value: "upgrade-insecure-requests",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
