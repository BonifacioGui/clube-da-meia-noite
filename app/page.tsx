"use client";

import { useMemo, useState } from "react";
import { Award, BookHeart, BookOpen, CircleUserRound, Flame, Home, LibraryBig, MoonStar, Play, Settings2, Sparkles, UsersRound } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Dashboard } from "@/components/reading/dashboard";
import { LibraryPage } from "@/components/reading/library-page";
import { AchievementsPage } from "@/components/reading/achievements-page";
import { ProfilePage } from "@/components/reading/profile-page";
import { ReadingDialog } from "@/components/reading/reading-dialog";
import { useReadingClub } from "@/hooks/use-reading-club";
import { useReadingClubTools } from "@/hooks/use-reading-club-tools";

type Tab = "home" | "library" | "read" | "achievements" | "profile";
const navItems = [
  { id: "home", label: "Início", icon: Home }, { id: "library", label: "Biblioteca", icon: LibraryBig },
  { id: "read", label: "Ler", icon: Play }, { id: "achievements", label: "Conquistas", icon: Award },
  { id: "profile", label: "Perfil", icon: CircleUserRound },
] as const;
const pageMeta = {
  home: { eyebrow: "NOSSA SEMANA", title: "A constância fica melhor a dois.", description: "29 set — 5 out", icon: UsersRound },
  library: { eyebrow: "ESTANTE COMPARTILHADA", title: "Minha Biblioteca", description: "Histórias em curso e próximas aventuras", icon: BookHeart },
  achievements: { eyebrow: "SALA DE TROFÉUS", title: "Conquistas", description: "Pequenos marcos de uma grande jornada", icon: Sparkles },
  profile: { eyebrow: "O NOSSO CLUBE", title: "Perfil & preferências", description: "Ajuste metas, cartas e acompanhe o cofre", icon: Settings2 },
};

export default function HomePage() {
  const club = useReadingClub();
  useReadingClubTools(club);
  const [tab, setTab] = useState<Exclude<Tab, "read">>("home");
  const [readerOpen, setReaderOpen] = useState(false);
  const meta = useMemo(() => pageMeta[tab], [tab]);
  const navigate = (next: Tab) => {
    if (next === "read") return setReaderOpen(true);
    setTab(next); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <div className="ambient-glow ambient-one" /><div className="ambient-glow ambient-two" />
      <aside className="side-nav">
        <button className="brand" onClick={() => navigate("home")} aria-label="Ir para o início">
          <span className="brand-mark"><MoonStar size={21} /></span><span><b>Clube da</b><strong>Meia-Noite</strong></span>
        </button>
        <nav aria-label="Navegação principal">
          {navItems.filter((item) => item.id !== "read").map((item) => { const Icon = item.icon; return (
            <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => navigate(item.id)}><Icon size={19} strokeWidth={1.8} /><span>{item.label}</span></button>
          ); })}
        </nav>
        <div className="side-cta"><span className="seal"><BookOpen size={19} /></span><p>Próximo nível</p><strong>{club.nextLevel.name}</strong><div className="mini-progress"><i style={{ width: `${club.nextLevel.progress}%` }} /></div><small>{club.nextLevel.remaining} XP restantes</small></div>
        <button className="read-now" onClick={() => setReaderOpen(true)}><Play size={17} fill="currentColor" /> Começar a ler</button>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="mobile-brand"><MoonStar size={19} /><span>Meia-Noite</span></div><div className="top-actions"><div className="pill-stat"><Flame size={16} /> {club.data.coupleStreak} semanas</div><div className="avatar-stack" aria-label="Guilherme e Ana"><span>G</span><span>A</span></div></div></header>
        <section className="page-heading"><div><p className="eyebrow"><meta.icon size={14} /> {meta.eyebrow}</p><h1>{meta.title}</h1><p>{meta.description}</p></div>{tab === "home" && <button className="desktop-start" onClick={() => setReaderOpen(true)}><Play size={18} fill="currentColor" /> Começar a ler</button>}</section>
        {tab === "home" && <Dashboard club={club} onStartReading={() => setReaderOpen(true)} />}
        {tab === "library" && <LibraryPage club={club} />}
        {tab === "achievements" && <AchievementsPage club={club} />}
        {tab === "profile" && <ProfilePage club={club} />}
      </main>
      <nav className="bottom-nav" aria-label="Navegação mobile">
        {navItems.map((item) => { const Icon = item.icon; if (item.id === "read") return <button key={item.id} className="read-tab" onClick={() => navigate("read")} aria-label="Começar a ler"><span><Icon size={23} fill="currentColor" /></span><small>Ler</small></button>; return <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => navigate(item.id)}><Icon size={20} /><small>{item.label}</small></button>; })}
      </nav>
      <ReadingDialog open={readerOpen} onOpenChange={setReaderOpen} club={club} />
      <Toaster position="top-center" />
    </div>
  );
}
