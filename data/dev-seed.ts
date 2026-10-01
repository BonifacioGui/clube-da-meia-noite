import type { ClubState } from "@/types/reading";
import { addDays, dateKey, getWeekStart } from "@/utils/domain";

const isoNow = () => new Date().toISOString();
const profile = (id: string, name: string, accent: string) => ({ id, name, initials: name.slice(0, 1).toUpperCase(), accent, createdAt: isoNow() });

export function createEmptyState(): ClubState {
  return { schemaVersion: 2, activeProfileId: null, activeRoomId: null, profiles: [], rooms: [], memberships: [], books: [], sessions: [], weeklyGoals: [], weeklyPacts: [], pactCards: [], vaultEntries: [], weeklyResults: [] };
}

export function createDevelopmentSeed(now = new Date()): ClubState {
  const weekStart = getWeekStart(now); const previousWeek = dateKey(addDays(weekStart, -7)); const twoWeeksAgo = dateKey(addDays(weekStart, -14)); const threeWeeksAgo = dateKey(addDays(weekStart, -21));
  const roomId = "dev-room"; const guilherme = profile("dev-guilherme", "Guilherme", "#d69b54"); const ana = profile("dev-ana", "Ana", "#a878b7");
  return {
    schemaVersion: 2, activeProfileId: guilherme.id, activeRoomId: roomId, profiles: [guilherme, ana],
    rooms: [{ id: roomId, name: "Clube da Meia-Noite", ownerProfileId: guilherme.id, inviteCode: "LIVRO-42", createdAt: isoNow() }],
    memberships: [{ id: "m1", roomId, profileId: guilherme.id, role: "owner", joinedAt: isoNow() }, { id: "m2", roomId, profileId: ana.id, role: "member", joinedAt: isoNow() }],
    books: [
      { id: "book-1", roomId, ownerProfileId: guilherme.id, title: "O Iluminado", author: "Stephen King", currentPage: 341, totalPages: 464, status: "Lendo", color: "#8d3d39", createdAt: isoNow() },
      { id: "book-2", roomId, ownerProfileId: ana.id, title: "Coraline", author: "Neil Gaiman", currentPage: 96, totalPages: 192, status: "Lendo", color: "#65416e", createdAt: isoNow() },
      { id: "book-3", roomId, ownerProfileId: guilherme.id, title: "Torto Arado", author: "Itamar Vieira Junior", currentPage: 264, totalPages: 264, status: "Concluído", color: "#87602e", createdAt: isoNow(), completedAt: dateKey(addDays(now, -20)) },
      { id: "book-4", roomId, ownerProfileId: ana.id, title: "A Vida Invisível de Addie LaRue", author: "V. E. Schwab", currentPage: 0, totalPages: 504, status: "Quero ler", color: "#2f5361", createdAt: isoNow() },
    ],
    sessions: [
      { id: "s1", roomId, profileId: guilherme.id, bookId: "book-1", occurredOn: dateKey(now), durationMinutes: 34, startPage: 301, endPage: 323, note: "A tensão cresceu muito neste capítulo.", createdAt: isoNow() },
      { id: "s2", roomId, profileId: ana.id, bookId: "book-2", occurredOn: dateKey(now), durationMinutes: 28, startPage: 68, endPage: 84, note: "A outra casa ficou ainda mais estranha.", createdAt: isoNow() },
      { id: "s3", roomId, profileId: guilherme.id, bookId: "book-1", occurredOn: dateKey(addDays(now, -1)), durationMinutes: 32, startPage: 279, endPage: 300, createdAt: isoNow() },
      { id: "s4", roomId, profileId: guilherme.id, bookId: "book-1", occurredOn: dateKey(addDays(now, -2)), durationMinutes: 30, startPage: 258, endPage: 278, createdAt: isoNow() },
      { id: "s5", roomId, profileId: ana.id, bookId: "book-2", occurredOn: dateKey(addDays(now, -2)), durationMinutes: 33, startPage: 48, endPage: 67, createdAt: isoNow() },
    ],
    weeklyGoals: [{ id: "goal-current", roomId, weekStart: dateKey(weekStart), minDays: 4, minMinutes: 120 }],
    weeklyPacts: [{ id: "pact-current", roomId, weekStart: dateKey(weekStart), reward: "Pizza + filme", penalty: "R$ 10 para o Cofre" }],
    pactCards: [
      { id: "r1", roomId, kind: "reward", text: "Pizza + filme" }, { id: "r2", roomId, kind: "reward", text: "Escolher o jantar" }, { id: "r3", roomId, kind: "reward", text: "Café especial" }, { id: "r4", roomId, kind: "reward", text: "Passeio na livraria" },
      { id: "p1", roomId, kind: "penalty", text: "R$ 10 para o Cofre" }, { id: "p2", roomId, kind: "penalty", text: "Preparar o café da manhã" }, { id: "p3", roomId, kind: "penalty", text: "Lavar a louça" },
    ],
    vaultEntries: [{ id: "v1", roomId, profileId: guilherme.id, amount: 10, reason: "meta não cumprida", occurredOn: dateKey(addDays(now, -8)) }, { id: "v2", roomId, profileId: ana.id, amount: 10, reason: "meta não cumprida", occurredOn: dateKey(addDays(now, -15)) }, { id: "v3", roomId, profileId: null, amount: 25, reason: "depósito para novos livros", occurredOn: dateKey(addDays(now, -28)) }],
    weeklyResults: [
      { id: "wr1", roomId, weekStart: previousWeek, memberResults: { [guilherme.id]: true, [ana.id]: true }, outcome: "both_met" },
      { id: "wr2", roomId, weekStart: twoWeeksAgo, memberResults: { [guilherme.id]: true, [ana.id]: true }, outcome: "both_met" },
      { id: "wr3", roomId, weekStart: threeWeeksAgo, memberResults: { [guilherme.id]: true, [ana.id]: true }, outcome: "both_met" },
    ],
  };
}
