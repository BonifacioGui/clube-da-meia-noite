"use client";
import { useEffect } from "react";
import type { ReadingClub } from "@/hooks/use-reading-club";

type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute(input: unknown): unknown };
type ModelContext = { registerTool(tool: Tool, options?: { signal?: AbortSignal }): void | Promise<void> };

export function useReadingClubTools(club: ReadingClub) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool || !club.data || !club.activeProfile) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* unsupported preview */ } };
    register({
      name: "get_weekly_reading_status", title: "Consultar semana de leitura", description: "Retorna meta, pacto e progresso semanal dos dois leitores.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({ room: club.data!.room.name, goal: club.data!.weeklyGoal, pact: club.data!.pact, coupleStreak: club.data!.coupleStreak, readers: club.data!.users.map((user) => ({ name: user.name, days: user.daysThisWeek, minutes: user.minutesThisWeek, xp: user.xp })) }),
    });
    register({
      name: "record_reading_session", title: "Registrar sessão de leitura", description: "Registra uma sessão concluída para o perfil ativo e recalcula XP, meta e progresso do livro.",
      inputSchema: { type: "object", properties: { minutes: { type: "integer", minimum: 1 }, endPage: { type: "integer", minimum: 0 }, note: { type: "string", maxLength: 180 } }, required: ["minutes"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input) => { const value = input as { minutes?: number; endPage?: number; note?: string }; if (!Number.isInteger(value.minutes) || Number(value.minutes) < 1) throw new Error("Duração inválida."); const saved = await club.saveSession({ minutes: value.minutes!, endPage: value.endPage, note: value.note }); return { status: saved ? "saved" : "failed", profileId: club.activeProfile!.id, minutes: value.minutes }; },
    });
    return () => lifecycle.abort();
  }, [club]);
}
