"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

export default function Home() {
  const [status, setStatus] = useState("");

  useEffect(() => {
    getHealth().then(data => setStatus(data.status));
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">EduSense</h1>
      <p className="mt-4">Backend Status: {status}</p>
    </main>
  );
}
