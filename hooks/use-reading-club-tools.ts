"use client";
import { useEffect } from "react";
import type { ReadingClub } from "@/hooks/use-reading-club";

type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute(input: unknown): unknown };
type ModelContext = { registerTool(tool: Tool, options?: { signal?: AbortSignal }): void | Promise<void> };

export function useReadingClubTools(club: ReadingClub) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* unsupported preview */ } };
    register({
      name: "get_weekly_reading_status", title: "Consultar semana de leitura", description: "Retorna meta, pacto e progresso semanal dos dois leitores.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({ goal: club.data.weeklyGoal, pact: club.data.pact, coupleStreak: club.data.coupleStreak, readers: club.data.users.map((user) => ({ name: user.name, days: user.daysThisWeek, minutes: user.minutesThisWeek, xp: user.xp })) }),
    });
    register({
      name: "record_reading_session", title: "Registrar sessão de leitura", description: "Registra uma sessão concluída para Guilherme ou Ana e atualiza XP, meta e livro atual.",
      inputSchema: { type: "object", properties: { userId: { type: "string", enum: club.data.users.map((user) => user.id) }, minutes: { type: "integer", minimum: 1 }, endPage: { type: "integer", minimum: 0 }, note: { type: "string", maxLength: 180 } }, required: ["userId", "minutes"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => { const value = input as { userId?: string; minutes?: number; endPage?: number; note?: string }; if (!club.data.users.some((user) => user.id === value.userId) || !Number.isInteger(value.minutes) || Number(value.minutes) < 1) throw new Error("Leitor ou duração inválidos."); club.saveSession({ userId: value.userId!, minutes: value.minutes!, endPage: value.endPage, note: value.note }); return { status: "saved", userId: value.userId, minutes: value.minutes }; },
    });
    return () => lifecycle.abort();
  }, [club]);
}
