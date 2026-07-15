"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function SessionActivity() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/login" || pathname.startsWith("/mockup")) return;
    let lastPing = 0;
    const ping = async () => {
      const now = Date.now();
      if (now - lastPing < 60_000) return;
      lastPing = now;
      const response = await fetch("/api/device/session/activity", { method: "POST" });
      if (response.status === 401) router.replace("/login");
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((event) => window.addEventListener(event, ping, { passive: true }));
    void ping();
    return () => events.forEach((event) => window.removeEventListener(event, ping));
  }, [pathname, router]);

  return null;
}
