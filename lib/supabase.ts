"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const legacyAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const apiKey = publishableKey || legacyAnonKey;

const isPlaceholder = (value?: string) => !value || /SEU[-_ ]?PROJETO|SUA[-_ ]?CHAVE|YOUR[-_ ]?PROJECT|YOUR[-_ ]?KEY/i.test(value);

export const isSupabaseConfigured = Boolean(
  !isPlaceholder(url) &&
  !isPlaceholder(apiKey) &&
  /^https?:\/\//i.test(url!),
);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || !url || !apiKey) return null;
  client ??= createClient(url, apiKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });
  return client;
}

export function requireSupabase(): SupabaseClient {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase ainda não foi configurado.");
  return supabase;
}
