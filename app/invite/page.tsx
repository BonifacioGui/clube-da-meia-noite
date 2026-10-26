"use client";

import { useEffect, useState } from "react";
import { MoonStar } from "lucide-react";
import { ReadingApp } from "@/components/reading/reading-app";

export default function InvitePage() {
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const token = new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
      setInviteToken(token || null);
      setReady(true);
    });
  }, []);

  if (!ready) return <div className="app-loading"><MoonStar size={28} /><p>Abrindo o convite…</p></div>;
  return <ReadingApp inviteToken={inviteToken ?? undefined} />;
}
