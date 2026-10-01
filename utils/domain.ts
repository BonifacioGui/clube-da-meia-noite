import type { Book, ClubState, ClubView, Profile, ReadingSession, Room, WeeklyGoal, WeeklyPact } from "@/types/reading";
import { XP_RULES } from "@/utils/gamification";

const DAY_MS = 86_400_000;
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const parseDateKey = (value: string) => { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day); };
export const addDays = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
export const getWeekStart = (date = new Date()) => { const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const day = copy.getDay(); copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1)); return copy; };
export const formatWeekRange = (date = new Date()) => { const start = getWeekStart(date); const end = addDays(start, 6); const fmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }); return `${fmt.format(start).replace(" de ", " ")} — ${fmt.format(end).replace(" de ", " ")}`; };
export const isInWeek = (value: string, weekStart: string) => { const date = parseDateKey(value).getTime(); const start = parseDateKey(weekStart).getTime(); return date >= start && date < start + 7 * DAY_MS; };

export function currentRoom(state: ClubState): Room | null { return state.rooms.find((room) => room.id === state.activeRoomId) ?? null; }
export function activeProfile(state: ClubState): Profile | null { return state.profiles.find((profile) => profile.id === state.activeProfileId) ?? null; }
export function roomProfiles(state: ClubState, roomId: string) { const ids = new Set(state.memberships.filter((membership) => membership.roomId === roomId).map((membership) => membership.profileId)); return state.profiles.filter((profile) => ids.has(profile.id)); }
export function roomSessions(state: ClubState, roomId: string) { return state.sessions.filter((session) => session.roomId === roomId); }
export function currentGoal(state: ClubState, roomId: string, now = new Date()): WeeklyGoal | null { const weekStart = dateKey(getWeekStart(now)); return state.weeklyGoals.find((goal) => goal.roomId === roomId && goal.weekStart === weekStart) ?? null; }
export function currentPact(state: ClubState, roomId: string, now = new Date()): WeeklyPact | null { const weekStart = dateKey(getWeekStart(now)); return state.weeklyPacts.find((pact) => pact.roomId === roomId && pact.weekStart === weekStart) ?? null; }
export function sessionsForProfile(sessions: ReadingSession[], profileId: string) { return sessions.filter((session) => session.profileId === profileId); }
export function weeklyMetrics(sessions: ReadingSession[], profileId: string, weekStart: string) { const weekly = sessions.filter((session) => session.profileId === profileId && isInWeek(session.occurredOn, weekStart)); return { days: new Set(weekly.map((session) => session.occurredOn)).size, minutes: weekly.reduce((sum, session) => sum + session.durationMinutes, 0) }; }
export function individualStreak(sessions: ReadingSession[], profileId: string, now = new Date()) { const days = new Set(sessionsForProfile(sessions, profileId).map((session) => session.occurredOn)); let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate()); if (!days.has(dateKey(cursor))) cursor = addDays(cursor, -1); let count = 0; while (days.has(dateKey(cursor))) { count += 1; cursor = addDays(cursor, -1); } return count; }
export function xpForProfile(state: ClubState, roomId: string, profileId: string) { const sessions = roomSessions(state, roomId).filter((session) => session.profileId === profileId); const sessionXp = sessions.reduce((sum, session) => sum + XP_RULES.session + (session.durationMinutes >= 20 ? XP_RULES.longSession : 0), 0); const dayXp = new Set(sessions.map((session) => session.occurredOn)).size * XP_RULES.readingDay; const weeklyXp = state.weeklyResults.filter((result) => result.roomId === roomId && result.memberResults[profileId]).length * XP_RULES.weeklyGoal; return sessionXp + dayXp + weeklyXp; }
export function coupleStreak(state: ClubState, roomId: string) { const results = state.weeklyResults.filter((result) => result.roomId === roomId).sort((a, b) => b.weekStart.localeCompare(a.weekStart)); let streak = 0; let expected: string | null = null; for (const result of results) { if (result.outcome !== "both_met" || (expected && result.weekStart !== expected)) break; streak += 1; expected = dateKey(addDays(parseDateKey(result.weekStart), -7)); } return streak; }
export function completedWeeklyGoals(state: ClubState, roomId: string) { return state.weeklyResults.filter((result) => result.roomId === roomId && result.outcome === "both_met").length; }
export function currentBookFor(state: ClubState, roomId: string, profileId: string): Book | undefined { return state.books.find((book) => book.roomId === roomId && book.ownerProfileId === profileId && book.status === "Lendo"); }

export function deriveClubView(state: ClubState, now = new Date()): ClubView | null {
  const room = currentRoom(state); const profile = activeProfile(state); if (!room || !profile) return null;
  const weekStart = dateKey(getWeekStart(now)); const goal = currentGoal(state, room.id, now); const pact = currentPact(state, room.id, now);
  if (!goal || !pact || !state.memberships.some((membership) => membership.roomId === room.id && membership.profileId === profile.id)) return null;
  const sessions = roomSessions(state, room.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); const profiles = roomProfiles(state, room.id);
  const users = profiles.map((member) => { const metrics = weeklyMetrics(sessions, member.id, weekStart); const memberSessions = sessionsForProfile(sessions, member.id); return { ...member, xp: xpForProfile(state, room.id, member.id), streak: individualStreak(sessions, member.id, now), daysThisWeek: metrics.days, minutesThisWeek: metrics.minutes, totalSessions: memberSessions.length }; });
  const entries = state.vaultEntries.filter((entry) => entry.roomId === room.id).sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));
  return {
    room, activeUserId: profile.id, users, books: state.books.filter((book) => book.roomId === room.id), sessions,
    weeklyGoal: { days: goal.minDays, minutes: goal.minMinutes }, pact: { reward: pact.reward, penalty: pact.penalty },
    rewardCards: state.pactCards.filter((card) => card.roomId === room.id && card.kind === "reward").map(({ id, text }) => ({ id, text })),
    penaltyCards: state.pactCards.filter((card) => card.roomId === room.id && card.kind === "penalty").map(({ id, text }) => ({ id, text })),
    coupleStreak: coupleStreak(state, room.id), completedWeeklyGoals: completedWeeklyGoals(state, room.id),
    currentWeekClosed: state.weeklyResults.some((result) => result.roomId === room.id && result.weekStart === weekStart),
    vault: { balance: entries.reduce((sum, entry) => sum + entry.amount, 0), history: entries.map((entry) => ({ id: entry.id, amount: entry.amount, user: state.profiles.find((item) => item.id === entry.profileId)?.name ?? "Casal", reason: entry.reason, date: new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(parseDateKey(entry.occurredOn)).replace(" de ", " ") })) },
  };
}
