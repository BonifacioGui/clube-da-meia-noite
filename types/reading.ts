export type MembershipRole = "owner" | "member";
export type BookStatus = "Quero ler" | "Lendo" | "Concluído";
export type CardKind = "reward" | "penalty";

export type Profile = { id: string; name: string; initials: string; accent: string; createdAt: string };
export type Room = { id: string; name: string; ownerProfileId: string; inviteCode: string; createdAt: string };
export type Membership = { id: string; roomId: string; profileId: string; role: MembershipRole; joinedAt: string };
export type Book = { id: string; roomId: string; ownerProfileId: string; title: string; author: string; currentPage: number; totalPages: number; status: BookStatus; color: string; createdAt: string; completedAt?: string };
export type ReadingSession = { id: string; roomId: string; profileId: string; bookId: string; occurredOn: string; durationMinutes: number; startPage?: number; endPage?: number; note?: string; createdAt: string };
export type WeeklyGoal = { id: string; roomId: string; weekStart: string; minDays: number; minMinutes: number };
export type WeeklyPact = { id: string; roomId: string; weekStart: string; reward: string; penalty: string };
export type PactCard = { id: string; roomId: string; kind: CardKind; text: string };
export type VaultEntry = { id: string; roomId: string; profileId: string | null; amount: number; reason: string; occurredOn: string };
export type WeeklyResult = { id: string; roomId: string; weekStart: string; memberResults: Record<string, boolean>; outcome: "both_met" | "one_met" | "none_met" };

export type ClubState = {
  schemaVersion: 2;
  activeProfileId: string | null;
  activeRoomId: string | null;
  profiles: Profile[];
  rooms: Room[];
  memberships: Membership[];
  books: Book[];
  sessions: ReadingSession[];
  weeklyGoals: WeeklyGoal[];
  weeklyPacts: WeeklyPact[];
  pactCards: PactCard[];
  vaultEntries: VaultEntry[];
  weeklyResults: WeeklyResult[];
};

export type MemberView = Profile & { xp: number; streak: number; daysThisWeek: number; minutesThisWeek: number; totalSessions: number };
export type CardOption = { id: string; text: string };
export type VaultHistoryView = { id: string; amount: number; user: string; reason: string; date: string };
export type ClubView = {
  room: Room;
  activeUserId: string;
  users: MemberView[];
  books: Book[];
  sessions: ReadingSession[];
  weeklyGoal: { days: number; minutes: number };
  pact: { reward: string; penalty: string };
  rewardCards: CardOption[];
  penaltyCards: CardOption[];
  coupleStreak: number;
  completedWeeklyGoals: number;
  currentWeekClosed: boolean;
  vault: { balance: number; history: VaultHistoryView[] };
};
