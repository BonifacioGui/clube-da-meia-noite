"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { initialData } from "@/data/initial-data";
import { clubStorage } from "@/services/storage";
import type { Book, BookStatus, CardOption, ClubData } from "@/types/reading";
import { nextLevelFor, XP_RULES } from "@/utils/gamification";
export function useReadingClub() {
  const [data, setData] = useState<ClubData>(initialData); const [hydrated, setHydrated] = useState(false);
  const commit = (recipe: (previous: ClubData) => ClubData) => setData((previous) => { const next = recipe(previous); clubStorage.save(next); return next; });
  useEffect(() => { setData(clubStorage.load()); setHydrated(true); }, []); useEffect(() => { if (hydrated) clubStorage.save(data); }, [data, hydrated]);
  const currentBook = (userId: string) => data.books.find((book) => book.ownerId === userId && book.status === "Lendo");
  const nextLevel = useMemo(() => nextLevelFor(data.users), [data.users]); const totalXp = data.users.reduce((sum, user) => sum + user.xp, 0);
  const saveSession = (payload: { userId: string; minutes: number; startPage?: number; endPage?: number; note?: string }) => { const book = currentBook(payload.userId); if (!book) return; const xp = XP_RULES.session + (payload.minutes >= 20 ? XP_RULES.longSession : 0) + XP_RULES.readingDay; commit((prev) => ({ ...prev, sessions: [{ id: crypto.randomUUID(), userId: payload.userId, bookId: book.id, date: new Date().toISOString().slice(0, 10), minutes: payload.minutes, startPage: payload.startPage, endPage: payload.endPage, note: payload.note }, ...prev.sessions], users: prev.users.map((user) => user.id === payload.userId ? { ...user, xp: user.xp + xp, minutesThisWeek: user.minutesThisWeek + payload.minutes, daysThisWeek: Math.min(prev.weeklyGoal.days, user.daysThisWeek + 1), streak: user.streak + 1, totalSessions: user.totalSessions + 1 } : user), books: prev.books.map((item) => item.id === book.id && payload.endPage ? { ...item, currentPage: Math.min(item.totalPages, payload.endPage) } : item) })); toast.success(`Sessão salva · +${xp} XP`); };
  const upsertBook = (book: Omit<Book, "id"> & { id?: string }) => commit((prev) => { const nextBooks = book.status === "Lendo" ? prev.books.map((item) => item.ownerId === book.ownerId && item.id !== book.id && item.status === "Lendo" ? { ...item, status: "Quero ler" as BookStatus } : item) : prev.books; return { ...prev, books: book.id ? nextBooks.map((item) => item.id === book.id ? { ...book, id: item.id } : item) : [...nextBooks, { ...book, id: crypto.randomUUID() }] }; });
  const deleteBook = (id: string) => { commit((prev) => ({ ...prev, books: prev.books.filter((book) => book.id !== id) })); toast.success("Livro removido da estante"); };
  const setCurrentBook = (id: string) => commit((prev) => { const target = prev.books.find((book) => book.id === id); return !target ? prev : { ...prev, books: prev.books.map((book) => book.ownerId === target.ownerId ? { ...book, status: book.id === id ? "Lendo" : book.status === "Lendo" ? "Quero ler" : book.status } : book) }; });
  const updateGoal = (days: number, minutes: number) => { commit((prev) => ({ ...prev, weeklyGoal: { days, minutes } })); toast.success("Meta semanal atualizada"); };
  const drawPact = () => commit((prev) => ({ ...prev, pact: { reward: prev.rewardCards[Math.floor(Math.random() * prev.rewardCards.length)]?.text ?? prev.pact.reward, penalty: prev.penaltyCards[Math.floor(Math.random() * prev.penaltyCards.length)]?.text ?? prev.pact.penalty } }));
  const updateCards = (kind: "reward" | "penalty", cards: CardOption[]) => commit((prev) => ({ ...prev, [kind === "reward" ? "rewardCards" : "penaltyCards"]: cards }));
  const addVault = (amount: number, user: string, reason: string) => commit((prev) => ({ ...prev, vault: { balance: prev.vault.balance + amount, history: [{ id: crypto.randomUUID(), amount, user, reason, date: new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(new Date()) }, ...prev.vault.history] } }));
  const setActiveUser = (id: string) => commit((prev) => ({ ...prev, activeUserId: id })); const reset = () => { clubStorage.reset(); setData(initialData); toast.success("Dados de demonstração restaurados"); };
  return { data, hydrated, currentBook, totalXp, nextLevel, saveSession, upsertBook, deleteBook, setCurrentBook, updateGoal, drawPact, updateCards, addVault, setActiveUser, reset };
}
export type ReadingClub = ReturnType<typeof useReadingClub>;
