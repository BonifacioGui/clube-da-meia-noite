import type { ClubState } from "@/types/reading";
import { createDevelopmentSeed, createEmptyState } from "@/data/dev-seed";
import { dateKey, getWeekStart } from "@/utils/domain";
import { DEFAULT_WEEKLY_GOAL } from "@/utils/gamification";

const STORAGE_KEY = "clube-meia-noite:v2";
export type StorageLoadResult = { data: ClubState; error: string | null; source: "persisted" | "development-seed" | "empty" };

function defaultState(): StorageLoadResult {
  if (process.env.NODE_ENV === "development") return { data: createDevelopmentSeed(), error: null, source: "development-seed" };
  return { data: createEmptyState(), error: null, source: "empty" };
}

function isValid(value: unknown): value is ClubState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<ClubState>;
  return state.schemaVersion === 2 && [state.rooms, state.profiles, state.memberships, state.books, state.sessions, state.weeklyGoals, state.weeklyPacts, state.pactCards, state.vaultEntries, state.weeklyResults].every(Array.isArray);
}

function normalizeState(input: ClubState): ClubState {
  const profileIds = new Set(input.profiles.map((profile) => profile.id));
  const rooms = input.rooms.filter((room) => profileIds.has(room.ownerProfileId));
  const roomIds = new Set(rooms.map((room) => room.id));
  const memberships = input.memberships.filter((item, index, all) => roomIds.has(item.roomId) && profileIds.has(item.profileId) && all.findIndex((other) => other.roomId === item.roomId && other.profileId === item.profileId) === index);
  for (const room of rooms) if (!memberships.some((item) => item.roomId === room.id && item.profileId === room.ownerProfileId)) memberships.push({ id: `membership-${room.id}-${room.ownerProfileId}`, roomId: room.id, profileId: room.ownerProfileId, role: "owner", joinedAt: room.createdAt });
  const membershipKeys = new Set(memberships.map((item) => `${item.roomId}:${item.profileId}`));
  const statuses = new Set(["Quero ler", "Lendo", "Concluído"]);
  const books = input.books.filter((book) => roomIds.has(book.roomId) && membershipKeys.has(`${book.roomId}:${book.ownerProfileId}`) && statuses.has(book.status)).map((book) => ({ ...book, currentPage: Math.max(0, Math.min(Math.round(book.currentPage || 0), Math.max(0, Math.round(book.totalPages || 0)) || Math.round(book.currentPage || 0))), totalPages: Math.max(0, Math.round(book.totalPages || 0)) }));
  const booksById = new Map(books.map((book) => [book.id, book]));
  const sessions = input.sessions.filter((session) => { const book = booksById.get(session.bookId); return !!book && session.roomId === book.roomId && session.profileId === book.ownerProfileId && membershipKeys.has(`${session.roomId}:${session.profileId}`) && Number.isFinite(session.durationMinutes) && session.durationMinutes > 0; }).map((session) => ({ ...session, durationMinutes: Math.max(1, Math.round(session.durationMinutes)) }));
  const currentWeek = dateKey(getWeekStart());
  const weeklyGoals = input.weeklyGoals.filter((goal) => roomIds.has(goal.roomId) && goal.minDays >= 1 && goal.minDays <= 7 && goal.minMinutes >= 1);
  const weeklyPacts = input.weeklyPacts.filter((pact) => roomIds.has(pact.roomId));
  for (const room of rooms) {
    if (!weeklyGoals.some((goal) => goal.roomId === room.id && goal.weekStart === currentWeek)) {
      const previous = weeklyGoals.filter((goal) => goal.roomId === room.id).sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
      weeklyGoals.push({ id: `goal-${room.id}-${currentWeek}`, roomId: room.id, weekStart: currentWeek, minDays: previous?.minDays ?? DEFAULT_WEEKLY_GOAL.days, minMinutes: previous?.minMinutes ?? DEFAULT_WEEKLY_GOAL.minutes });
    }
    if (!weeklyPacts.some((pact) => pact.roomId === room.id && pact.weekStart === currentWeek)) weeklyPacts.push({ id: `pact-${room.id}-${currentWeek}`, roomId: room.id, weekStart: currentWeek, reward: "", penalty: "" });
  }
  const weeklyResults = input.weeklyResults.filter((result) => roomIds.has(result.roomId)).map((result) => { const memberResults = Object.fromEntries(Object.entries(result.memberResults).filter(([profileId]) => membershipKeys.has(`${result.roomId}:${profileId}`))); const met = Object.values(memberResults).filter(Boolean).length; const total = Object.keys(memberResults).length; return { ...result, memberResults, outcome: (total > 0 && met === total ? "both_met" : met === 0 ? "none_met" : "one_met") as typeof result.outcome }; });
  const activeRoomId = roomIds.has(input.activeRoomId ?? "") ? input.activeRoomId : rooms[0]?.id ?? null;
  const roomMemberships = memberships.filter((item) => item.roomId === activeRoomId);
  const activeProfileId = roomMemberships.some((item) => item.profileId === input.activeProfileId) ? input.activeProfileId : roomMemberships[0]?.profileId ?? null;
  return { ...input, activeRoomId, activeProfileId, rooms, memberships, books, sessions, weeklyGoals, weeklyPacts, weeklyResults, pactCards: input.pactCards.filter((card) => roomIds.has(card.roomId) && (card.kind === "reward" || card.kind === "penalty") && card.text.trim()), vaultEntries: input.vaultEntries.filter((entry) => roomIds.has(entry.roomId) && (entry.profileId === null || membershipKeys.has(`${entry.roomId}:${entry.profileId}`)) && Number.isFinite(entry.amount) && entry.amount > 0) };
}

export const clubStorage = {
  load(): StorageLoadResult {
    if (typeof window === "undefined") return defaultState();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed: unknown = JSON.parse(raw);
      if (!isValid(parsed)) return { ...defaultState(), error: "Os dados salvos eram incompatíveis e foram ignorados." };
      const normalized = normalizeState(parsed); const repaired = JSON.stringify(normalized) !== JSON.stringify(parsed); let repairError = false;
      if (repaired) try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch { repairError = true; }
      return { data: normalized, error: repairError ? "As relações foram reparadas em memória, mas não foi possível persistir o reparo." : repaired ? "Algumas relações inconsistentes foram reparadas automaticamente." : null, source: "persisted" };
    } catch {
      return { ...defaultState(), error: "Não foi possível ler os dados salvos neste navegador." };
    }
  },
  save(data: ClubState): string | null {
    if (typeof window === "undefined") return null;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return null; }
    catch { return "Não foi possível salvar as alterações neste navegador."; }
  },
  reset() { if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY); },
};
