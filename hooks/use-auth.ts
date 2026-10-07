"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { clearPwaRuntimeCache } from "@/lib/pwa";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      const initialUser = data.session?.user ?? null;
      lastUserId.current = initialUser?.id ?? null;
      if (active) { setUser(initialUser); setLoading(false); }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      if (lastUserId.current !== nextUser?.id) clearPwaRuntimeCache();
      lastUserId.current = nextUser?.id ?? null;
      if (active) { setUser(nextUser); setLoading(false); }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut({ scope: "local" });
    clearPwaRuntimeCache();
    setUser(null);
  }, []);

  return { user, loading, configured: isSupabaseConfigured, signOut };
}
