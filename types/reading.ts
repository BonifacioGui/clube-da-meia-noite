export type BookStatus = "Quero ler" | "Lendo" | "Concluído";
export type Book = { id: string; ownerId: string; title: string; author: string; currentPage: number; totalPages: number; status: BookStatus; color: string };
export type User = { id: string; name: string; initials: string; accent: string; xp: number; streak: number; daysThisWeek: number; minutesThisWeek: number; totalSessions: number };
export type ReadingSession = { id: string; userId: string; bookId: string; date: string; minutes: number; startPage?: number; endPage?: number; note?: string };
export type CardOption = { id: string; text: string };
export type VaultEntry = { id: string; amount: number; user: string; reason: string; date: string };
export type ClubData = { activeUserId: string; users: User[]; books: Book[]; sessions: ReadingSession[]; weeklyGoal: { days: number; minutes: number }; pact: { reward: string; penalty: string }; rewardCards: CardOption[]; penaltyCards: CardOption[]; coupleStreak: number; completedWeeklyGoals: number; vault: { balance: number; history: VaultEntry[] } };
