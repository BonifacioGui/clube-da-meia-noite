import { Award, BookCheck, CalendarCheck, Flame, LockKeyhole, Sparkles, Timer, UsersRound } from "lucide-react";
import type { ReadingClub } from "@/hooks/use-reading-club";

const achievements = [
  { name: "Primeira Página", description: "Complete sua primeira sessão.", icon: Sparkles, value: (club: ReadingClub) => club.data?.sessions.filter((session) => session.profileId === club.activeProfile?.id).length ?? 0, target: 1, unit: "sessão" },
  { name: "Leitor Consistente", description: "Leia durante 7 dias seguidos.", icon: CalendarCheck, value: (club: ReadingClub) => club.data?.users.find((user) => user.id === club.activeProfile?.id)?.streak ?? 0, target: 7, unit: "dias" },
  { name: "Casal Literário", description: "Cumpram 4 metas semanais juntos.", icon: UsersRound, value: (club: ReadingClub) => club.data?.completedWeeklyGoals ?? 0, target: 4, unit: "semanas" },
  { name: "Maratonista", description: "Leia 120 minutos em uma semana.", icon: Timer, value: (club: ReadingClub) => club.data?.users.find((user) => user.id === club.activeProfile?.id)?.minutesThisWeek ?? 0, target: 120, unit: "min" },
  { name: "Livro Fechado", description: "Finalize seu primeiro livro.", icon: BookCheck, value: (club: ReadingClub) => club.data?.books.filter((book) => book.ownerProfileId === club.activeProfile?.id && book.status === "Concluído").length ?? 0, target: 1, unit: "livro" },
  { name: "Chama Acesa", description: "Mantenham 5 semanas de pacto.", icon: Flame, value: (club: ReadingClub) => club.data?.coupleStreak ?? 0, target: 5, unit: "semanas" },
];

export function AchievementsPage({ club }: { club: ReadingClub }) {
  if (!club.data) return null;
  const unlocked = achievements.filter((achievement) => achievement.value(club) >= achievement.target).length;
  return <div className="achievements-layout"><section className="achievement-summary"><div><span className="seal large"><Award size={25} /></span><div><small>CONQUISTAS DESBLOQUEADAS</small><h2>{unlocked} de {achievements.length}</h2><p>Os selos são derivados do histórico real da sala.</p></div></div><div className="summary-progress"><i style={{ width: `${(unlocked / achievements.length) * 100}%` }} /></div></section><section className="achievement-grid">{achievements.map((achievement) => { const Icon = achievement.icon; const value = achievement.value(club); const unlockedNow = value >= achievement.target; return <article key={achievement.name} className={unlockedNow ? "achievement-card unlocked" : "achievement-card locked"}><div className="achievement-icon">{unlockedNow ? <Icon size={25} /> : <LockKeyhole size={22} />}</div><span>{unlockedNow ? "DESBLOQUEADA" : "EM PROGRESSO"}</span><h3>{achievement.name}</h3><p>{achievement.description}</p><small>{unlockedNow ? "Conquistada" : `${value} de ${achievement.target} ${achievement.unit}`}</small></article>; })}</section></div>;
}
