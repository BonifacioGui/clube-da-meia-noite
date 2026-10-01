"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import type { Book, CardKind, CardOption, ClubState } from "@/types/reading";
import { activeProfile, currentBookFor, currentRoom, deriveClubView, formatWeekRange } from "@/utils/domain";
import { nextLevelForXp } from "@/utils/gamification";
import * as backend from "@/services/supabase-club";

const emptyState = (): ClubState => ({ schemaVersion: 2, activeProfileId: null, activeRoomId: null, profiles: [], rooms: [], memberships: [], books: [], sessions: [], weeklyGoals: [], weeklyPacts: [], pactCards: [], vaultEntries: [], weeklyResults: [] });
const message = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir a operação.";

export function useReadingClub(user: User | null) {
  const [state, setState] = useState<ClubState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ token: string; expiresAt: string } | null>(null);
  const refresh = useCallback(async () => {
    if (!user) { setState(emptyState()); setHydrated(true); return; }
    try { setStorageError(null); setState(await backend.loadClubState(user.id)); }
    catch (error) { setStorageError(message(error)); }
    finally { setHydrated(true); }
  }, [user]);
  useEffect(() => { queueMicrotask(() => { setHydrated(false); void refresh(); }); }, [refresh]);
  const data = useMemo(() => deriveClubView(state), [state]);
  const active = activeProfile(state); const room = currentRoom(state);
  const totalXp = data?.users.reduce((sum, member) => sum + member.xp, 0) ?? 0;
  const nextLevel = useMemo(() => nextLevelForXp(totalXp), [totalXp]);
  const currentBook = (profileId = user?.id ?? "") => room ? currentBookFor(state, room.id, profileId) : undefined;
  const run = async (action: () => Promise<void>, success?: string) => { try { await action(); await refresh(); if (success) toast.success(success); return true; } catch (error) { toast.error(message(error)); return false; } };
  const createRoom = (roomName: string) => run(() => backend.createRoom(roomName), "Sala criada. Agora convide a segunda pessoa.");
  const joinRoom = (token: string) => run(() => backend.joinRoom(token), "Você entrou no clube.");
  const createInvite = async () => { if (!room) return null; try { const value = await backend.createInvite(room.id); setInvite(value); return value; } catch (error) { toast.error(message(error)); return null; } };
  const saveSession = (payload: { minutes: number; startPage?: number; endPage?: number; note?: string }) => { const book = currentBook(); if (!book) return Promise.resolve(false); if (!Number.isFinite(payload.minutes) || payload.minutes < 1) { toast.error("A sessão precisa ter pelo menos um minuto."); return Promise.resolve(false); } if (payload.startPage != null && payload.endPage != null && payload.endPage < payload.startPage) { toast.error("A página final não pode vir antes da inicial."); return Promise.resolve(false); } return run(() => backend.recordSession(book.id, Math.round(payload.minutes), payload.startPage, payload.endPage, payload.note), "Sessão salva · progresso recalculado"); };
  const upsertBook = (book: Omit<Book, "id" | "roomId" | "ownerProfileId" | "createdAt"> & { id?: string }) => { if (!room || !user) return Promise.resolve(false); return run(() => backend.saveBook(room.id, user.id, book), "Livro salvo"); };
  const deleteBook = (bookId: string) => user ? run(() => backend.removeBook(bookId, user.id), "Livro removido") : Promise.resolve(false);
  const setCurrentBook = (bookId: string) => room && user ? run(() => backend.chooseCurrentBook(room.id, user.id, bookId), "Livro atual atualizado") : Promise.resolve(false);
  const updateGoal = (days: number, minutes: number) => { if (!room || !user) return Promise.resolve(false); return run(() => backend.saveGoal(room.id, user.id, Math.max(1, Math.min(7, Math.round(days))), Math.max(1, Math.round(minutes))), "Meta semanal atualizada"); };
  const updateCards = (kind: CardKind, cards: CardOption[]) => room ? run(() => backend.replaceCards(room.id, cards, kind), "Cartas atualizadas") : Promise.resolve(false);
  const drawPact = () => { if (!room || !user || !data) return Promise.resolve(false); if (data.currentWeekClosed) { toast.error("A semana já foi fechada."); return Promise.resolve(false); } const rewards = data.rewardCards; const penalties = data.penaltyCards; if (!rewards.length || !penalties.length) { toast.error("Cadastre ao menos uma recompensa e uma consequência."); return Promise.resolve(false); } const reward = rewards[Math.floor(Math.random() * rewards.length)].text; const penalty = penalties[Math.floor(Math.random() * penalties.length)].text; return run(() => backend.savePact(room.id, user.id, reward, penalty), "Pacto sorteado"); };
  const addVault = (amount: number, reason: string) => { if (!room || !user || !Number.isFinite(amount) || amount === 0) return Promise.resolve(false); return run(() => backend.addVaultEntry(room.id, user.id, amount, reason), "Lançamento registrado"); };
  const closeCurrentWeek = () => room ? run(() => backend.closeWeek(room.id), "Semana fechada com o histórico real") : Promise.resolve(false);
  const updateProfile = (name: string, accent: string) => user ? run(() => backend.updateProfile(user.id, name, accent), "Perfil atualizado") : Promise.resolve(false);
  const leaveRoom = (transferTo?: string) => room ? run(() => backend.leaveRoom(room.id, transferTo), "Você saiu da sala") : Promise.resolve(false);
  return { state, data, hydrated, storageError, dataSource: "supabase" as const, activeProfile: active, room, invite, weekLabel: formatWeekRange(), currentBook, totalXp, nextLevel, refresh, createRoom, joinRoom, createInvite, saveSession, upsertBook, deleteBook, setCurrentBook, updateGoal, drawPact, updateCards, addVault, closeCurrentWeek, updateProfile, leaveRoom };
}
export type ReadingClub = ReturnType<typeof useReadingClub>;
