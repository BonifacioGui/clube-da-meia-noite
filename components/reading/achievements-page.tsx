import { Award, BookCheck, CalendarCheck, Flame, LockKeyhole, Sparkles, Timer, UsersRound } from "lucide-react";
import type { ReadingClub } from "@/hooks/use-reading-club";
import { achievementProgress } from "@/utils/achievements";

const icons = { "first-page": Sparkles, "consistent-reader": CalendarCheck, "literary-pair": UsersRound, marathon: Timer, "closed-book": BookCheck, "lit-flame": Flame } as const;

export function AchievementsPage({ club }: { club: ReadingClub }) {
  if (!club.data) return null;
  const achievements = achievementProgress(club); const unlocked = achievements.filter((item) => item.unlocked).length;
  return <div className="achievements-layout"><section className="achievement-summary"><div><span className="seal large"><Award size={25} /></span><div><small>CONQUISTAS DESBLOQUEADAS</small><h2>{unlocked} de {achievements.length}</h2><p>Seu progresso nasce das leituras registradas.</p></div></div><div className="summary-progress"><i style={{ width: `${(unlocked / achievements.length) * 100}%` }} /></div></section><section className="achievement-grid">{achievements.map((achievement) => { const Icon = icons[achievement.key]; return <article key={achievement.key} className={achievement.unlocked ? "achievement-card unlocked" : "achievement-card locked"}><div className="achievement-icon">{achievement.unlocked ? <Icon size={25} /> : <LockKeyhole size={22} />}</div><span>{achievement.unlocked ? "DESBLOQUEADA" : "EM PROGRESSO"}</span><h3>{achievement.name}</h3><p>{achievement.description}</p><small>{achievement.unlocked ? "Conquistada" : `${achievement.value} de ${achievement.target} ${achievement.unit}`}</small></article>; })}</section></div>;
}
