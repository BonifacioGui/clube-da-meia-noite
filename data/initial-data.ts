import type { ClubData } from "@/types/reading";
export const initialData: ClubData = {
  activeUserId: "guilherme",
  users: [
    { id: "guilherme", name: "Guilherme", initials: "G", accent: "#d69b54", xp: 680, streak: 5, daysThisWeek: 3, minutesThisWeek: 96, totalSessions: 18 },
    { id: "ana", name: "Ana", initials: "A", accent: "#a878b7", xp: 540, streak: 3, daysThisWeek: 2, minutesThisWeek: 61, totalSessions: 15 },
  ],
  books: [
    { id: "book-1", ownerId: "guilherme", title: "O Iluminado", author: "Stephen King", currentPage: 341, totalPages: 464, status: "Lendo", color: "#8d3d39" },
    { id: "book-2", ownerId: "ana", title: "Coraline", author: "Neil Gaiman", currentPage: 96, totalPages: 192, status: "Lendo", color: "#65416e" },
    { id: "book-3", ownerId: "guilherme", title: "Torto Arado", author: "Itamar Vieira Junior", currentPage: 264, totalPages: 264, status: "Concluído", color: "#87602e" },
    { id: "book-4", ownerId: "ana", title: "A Vida Invisível de Addie LaRue", author: "V. E. Schwab", currentPage: 0, totalPages: 504, status: "Quero ler", color: "#2f5361" },
  ],
  sessions: [
    { id: "session-1", userId: "guilherme", bookId: "book-1", date: "2026-09-29", minutes: 34, startPage: 301, endPage: 323, note: "A tensão cresceu muito neste capítulo." },
    { id: "session-2", userId: "ana", bookId: "book-2", date: "2026-09-29", minutes: 28, startPage: 68, endPage: 84, note: "A outra casa ficou ainda mais estranha." },
    { id: "session-3", userId: "guilherme", bookId: "book-1", date: "2026-09-27", minutes: 32, startPage: 279, endPage: 300 },
  ],
  weeklyGoal: { days: 4, minutes: 120 }, pact: { reward: "Pizza + filme", penalty: "R$ 10 para o Cofre" },
  rewardCards: [{ id: "r1", text: "Pizza + filme" }, { id: "r2", text: "Escolher o jantar" }, { id: "r3", text: "Café especial" }, { id: "r4", text: "Passeio na livraria" }],
  penaltyCards: [{ id: "p1", text: "R$ 10 para o Cofre" }, { id: "p2", text: "Preparar o café da manhã" }, { id: "p3", text: "Lavar a louça" }],
  coupleStreak: 3, completedWeeklyGoals: 2,
  vault: { balance: 45, history: [
    { id: "v1", amount: 10, user: "Guilherme", reason: "meta não cumprida", date: "22 set" }, { id: "v2", amount: 10, user: "Ana", reason: "meta não cumprida", date: "15 set" }, { id: "v3", amount: 25, user: "Casal", reason: "depósito para novos livros", date: "2 set" },
  ] },
};
