import type { ReadingClub } from "@/hooks/use-reading-club";

export const ACHIEVEMENT_DEFINITIONS = [
  { key: "first-page", name: "Primeira Página", description: "Complete sua primeira sessão.", target: 1, unit: "sessão" },
  { key: "consistent-reader", name: "Leitor Consistente", description: "Leia durante 7 dias seguidos.", target: 7, unit: "dias" },
  { key: "literary-pair", name: "Casal Literário", description: "Cumpram 4 metas semanais juntos.", target: 4, unit: "semanas" },
  { key: "marathon", name: "Maratonista", description: "Leia 120 minutos em uma semana.", target: 120, unit: "min" },
  { key: "closed-book", name: "Livro Fechado", description: "Finalize seu primeiro livro.", target: 1, unit: "livro" },
  { key: "lit-flame", name: "Chama Acesa", description: "Mantenham 5 semanas de pacto.", target: 5, unit: "semanas" },
] as const;

export function achievementProgress(club: ReadingClub) {
  const active = club.data?.users.find((user) => user.id === club.activeProfile?.id);
  const values: Record<(typeof ACHIEVEMENT_DEFINITIONS)[number]["key"], number> = {
    "first-page": active?.totalSessions ?? 0,
    "consistent-reader": active?.streak ?? 0,
    "literary-pair": club.data?.completedWeeklyGoals ?? 0,
    marathon: active?.minutesThisWeek ?? 0,
    "closed-book": active?.completedBooks ?? 0,
    "lit-flame": club.data?.coupleStreak ?? 0,
  };
  return ACHIEVEMENT_DEFINITIONS.map((item) => ({ ...item, value: values[item.key], unlocked: values[item.key] >= item.target }));
}
