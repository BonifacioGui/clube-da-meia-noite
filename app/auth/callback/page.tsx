"use client";
import { useEffect, useState } from "react";
import { MoonStar } from "lucide-react";
import { requireSupabase } from "@/lib/supabase";
import { appPath, safeInternalRoute } from "@/lib/app-paths";

export default function AuthCallbackPage() {
  const [error, setError] = useState("");
  useEffect(() => { if (!navigator.onLine) { queueMicrotask(() => setError("Conecte-se à internet para confirmar seu acesso.")); return; } const url = new URL(window.location.href); const code = url.searchParams.get("code"); const next = safeInternalRoute(url.searchParams.get("next")); if (!code) { queueMicrotask(() => setError("O link de autenticação é inválido ou expirou.")); return; } void requireSupabase().auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => { if (exchangeError) setError(exchangeError.message); else window.location.replace(appPath(next)); }); }, []);
  return <div className="app-loading"><MoonStar size={28} /><p>{error || "Confirmando seu acesso…"}</p></div>;
}
