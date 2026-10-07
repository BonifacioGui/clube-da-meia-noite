"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import type { Book, CardKind, CardOption, ClubState } from "@/types/reading";
import { activeProfile, currentBookFor, currentRoom, deriveClubView, formatWeekRange } from "@/utils/domain";
import { progressionForXp } from "@/utils/gamification";
import * as backend from "@/services/supabase-club";
import { getSupabase } from "@/lib/supabase";

const emptyState = (): ClubState => ({ schemaVersion: 2, activeProfileId: null, activeRoomId: null, profiles: [], rooms: [], memberships: [], books: [], sessions: [], weeklyGoals: [], weeklyPacts: [], pactCards: [], vaultEntries: [], weeklyResults: [], roomInvites: [] });
const message = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir a operação.";

export function useReadingClub(user: User | null) {
  const [state, setState] = useState<ClubState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ token: string; expiresAt: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<"connecting" | "live" | "fallback">("connecting");
  const refreshSequence = useRef(0);
  const refresh = useCallback(async () => {
    if (!user) { setState(emptyState()); setHydrated(true); return; }
    const sequence = ++refreshSequence.current;
    try { const loaded = await backend.loadClubState(user.id); if (sequence === refreshSequence.current) { setStorageError(null); setState(loaded); } }
    catch (error) { if (sequence === refreshSequence.current) setStorageError(message(error)); }
    finally { if (sequence === refreshSequence.current) setHydrated(true); }
  }, [user]);
  useEffect(() => { queueMicrotask(() => { setHydrated(false); void refresh(); }); }, [refresh]);
  const data = useMemo(() => deriveClubView(state), [state]);
  const active = activeProfile(state); const room = currentRoom(state);
  const clubXp = data?.users.reduce((sum, member) => sum + member.xp, 0) ?? 0;
  const activeXp = data?.users.find((member) => member.id === user?.id)?.xp ?? 0;
  const activeProgress = useMemo(() => progressionForXp(activeXp), [activeXp]);

  useEffect(() => {
    const handleFocus = () => void refresh();
    const handleVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { window.removeEventListener("focus", handleFocus); document.removeEventListener("visibilitychange", handleVisibility); };
  }, [refresh]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !room?.id) return;
    let timer: number | undefined;
    const revalidate = () => { window.clearTimeout(timer); timer = window.setTimeout(() => void refresh(), 350); };
    const roomScopedTables = ["room_members", "room_invites", "books", "reading_sessions", "weekly_goals", "weekly_pacts", "pact_cards", "vault_transactions", "weekly_results"];
    let channel = supabase.channel(`club-room-${room.id}`);
    for (const table of roomScopedTables) channel = channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `room_id=eq.${room.id}` }, revalidate);
    channel = channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` }, revalidate);
    channel = channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, revalidate);
    channel.subscribe((status) => setSyncStatus(status === "SUBSCRIBED" ? "live" : status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "fallback" : "connecting"));
    return () => { window.clearTimeout(timer); void supabase.removeChannel(channel); };
  }, [refresh, room?.id]);
  const currentBook = (profileId = user?.id ?? "") => room ? currentBookFor(state, room.id, profileId) : undefined;
  const run = async (action: () => Promise<void>, success?: string) => { try { await action(); await refresh(); if (success) toast.success(success); return true; } catch (error) { toast.error(message(error)); return false; } };
  const createRoom = (roomName: string) => run(() => backend.createRoom(roomName), "Sala criada. Agora convide a segunda pessoa.");
  const joinRoom = (token: string) => run(() => backend.joinRoom(token), "Você entrou no clube.");
  const createInvite = async () => { if (!room) return null; try { const value = await backend.createInvite(room.id); setInvite(value); await refresh(); return value; } catch (error) { toast.error(message(error)); return null; } };
  const revokeInvite = () => room ? run(async () => { await backend.revokeInvites(room.id); setInvite(null); }, "Convite revogado") : Promise.resolve(false);
  const renameRoom = (name: string) => room ? run(() => backend.renameRoom(room.id, name), "Nome do clube atualizado") : Promise.resolve(false);
  const saveSession = (payload: { minutes: number; startPage?: number; endPage?: number; note?: string }) => { const book = currentBook(); if (!book) return Promise.resolve(false); if (!Number.isFinite(payload.minutes) || payload.minutes < 1) { toast.error("A sessão precisa ter pelo menos um minuto."); return Promise.resolve(false); } if (payload.startPage != null && payload.endPage != null && payload.endPage < payload.startPage) { toast.error("A página final não pode vir antes da inicial."); return Promise.resolve(false); } return run(() => backend.recordSession(book.id, Math.round(payload.minutes), payload.startPage, payload.endPage, payload.note), "Sessão salva · progresso recalculado"); };
  const upsertBook = (book: Omit<Book, "id" | "roomId" | "ownerProfileId" | "createdAt"> & { id?: string }) => { if (!room || !user) return Promise.resolve(false); return run(() => backend.saveBook(room.id, user.id, book), "Livro salvo"); };
  const deleteBook = (bookId: string) => user ? run(() => backend.removeBook(bookId, user.id), "Livro removido") : Promise.resolve(false);
  const setCurrentBook = (bookId: string) => room && user ? run(() => backend.chooseCurrentBook(room.id, user.id, bookId), "Livro atual atualizado") : Promise.resolve(false);
  const updateGoal = (days: number, minutes: number) => { if (!room || !user) return Promise.resolve(false); return run(() => backend.saveGoal(room.id, user.id, Math.max(1, Math.min(7, Math.round(days))), Math.max(1, Math.round(minutes))), "Meta semanal atualizada"); };
  const updateCards = (kind: CardKind, cards: CardOption[]) => room ? run(() => backend.replaceCards(room.id, cards, kind), "Cartas atualizadas") : Promise.resolve(false);
  const drawPact = () => { if (!room || !user || !data) return Promise.resolve(false); if (data.currentWeekClosed) { toast.error("A semana já foi fechada."); return Promise.resolve(false); } const rewards = data.rewardCards; const penalties = data.penaltyCards; if (!rewards.length || !penalties.length) { toast.error("Cadastre ao menos uma recompensa e uma consequência."); return Promise.resolve(false); } const reward = rewards[Math.floor(Math.random() * rewards.length)].text; const penalty = penalties[Math.floor(Math.random() * penalties.length)].text; return run(() => backend.savePact(room.id, user.id, reward, penalty), "Pacto sorteado"); };
  const addVault = (amount: number, reason: string) => { if (!room || !user || !Number.isFinite(amount) || amount === 0) return Promise.resolve(false); return run(() => backend.addVaultEntry(room.id, user.id, amount, reason), "Lançamento registrado"); };
  const closeWeek = (weekStart: string) => room ? run(() => backend.closeWeek(room.id, weekStart), "Semana fechada com o histórico real") : Promise.resolve(false);
  const updateProfile = (name: string, accent: string) => user ? run(() => backend.updateProfile(user.id, name, accent), "Perfil atualizado") : Promise.resolve(false);
  const leaveRoom = (transferTo?: string) => room ? run(() => backend.leaveRoom(room.id, transferTo), "Você saiu da sala") : Promise.resolve(false);
  return { state, data, hydrated, storageError, dataSource: "supabase" as const, activeProfile: active, room, invite, syncStatus, weekLabel: formatWeekRange(), currentBook, clubXp, activeXp, activeProgress, refresh, createRoom, joinRoom, createInvite, revokeInvite, renameRoom, saveSession, upsertBook, deleteBook, setCurrentBook, updateGoal, drawPact, updateCards, addVault, closeWeek, updateProfile, leaveRoom };
}
export type ReadingClub = ReturnType<typeof useReadingClub>;
