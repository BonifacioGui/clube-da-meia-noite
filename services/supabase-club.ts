import { requireSupabase } from "@/lib/supabase";
import type { Book, BookStatus, CardKind, CardOption, ClubState } from "@/types/reading";
import { dateKey, getWeekStart } from "@/utils/domain";

type Row = Record<string, unknown>;
const statusToDb: Record<BookStatus, string> = { "Quero ler": "want_to_read", Lendo: "reading", "Concluído": "completed" };
const statusFromDb: Record<string, BookStatus> = { want_to_read: "Quero ler", reading: "Lendo", completed: "Concluído" };
const rows = (value: unknown): Row[] => (Array.isArray(value) ? value : []) as Row[];
const row = (value: unknown): Row | null => value && typeof value === "object" ? value as Row : null;
const text = (value: unknown) => typeof value === "string" ? value : "";

async function ensureCurrentWeek(roomId: string) {
  const supabase = requireSupabase();
  const weekStart = dateKey(getWeekStart());
  const { error } = await supabase.rpc("ensure_current_week", { target_room: roomId, target_week: weekStart });
  if (error) throw error;
}

export async function loadClubState(userId: string): Promise<ClubState> {
  const supabase = requireSupabase();
  const { data: ownProfile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (profileError) throw profileError;
  const { data: ownMembership, error: membershipError } = await supabase.from("room_members").select("*").eq("user_id", userId).is("left_at", null).maybeSingle();
  if (membershipError) throw membershipError;
  const membership = row(ownMembership);
  const own = row(ownProfile)!;
  const base: ClubState = { schemaVersion: 2, activeProfileId: userId, activeRoomId: null, profiles: [{ id: userId, name: text(own.display_name), initials: text(own.display_name).slice(0, 1).toUpperCase(), accent: text(own.accent) || "#5f8ee6", createdAt: text(own.created_at) }], rooms: [], memberships: [], books: [], sessions: [], weeklyGoals: [], weeklyPacts: [], pactCards: [], vaultEntries: [], weeklyResults: [], roomInvites: [] };
  if (!membership) return base;
  const roomId = text(membership.room_id);
  await ensureCurrentWeek(roomId);
  const [roomResult, membersResult, booksResult, sessionsResult, goalsResult, pactsResult, cardsResult, vaultResult, resultsResult, invitesResult] = await Promise.all([
    supabase.from("rooms").select("*").eq("id", roomId).single(),
    supabase.from("room_members").select("*").eq("room_id", roomId),
    supabase.from("books").select("*").eq("room_id", roomId).order("created_at", { ascending: false }),
    supabase.from("reading_sessions").select("*").eq("room_id", roomId).order("created_at", { ascending: false }),
    supabase.from("weekly_goals").select("*").eq("room_id", roomId),
    supabase.from("weekly_pacts").select("*").eq("room_id", roomId),
    supabase.from("pact_cards").select("*").eq("room_id", roomId).eq("active", true),
    supabase.from("vault_transactions").select("*").eq("room_id", roomId).order("created_at", { ascending: false }),
    supabase.from("weekly_results").select("*").eq("room_id", roomId).order("week_start", { ascending: false }),
    supabase.from("room_invites").select("id, room_id, expires_at, created_at").eq("room_id", roomId).is("revoked_at", null).is("used_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
  ]);
  for (const result of [roomResult, membersResult, booksResult, sessionsResult, goalsResult, pactsResult, cardsResult, vaultResult, resultsResult, invitesResult]) if (result.error) throw result.error;
  const allMemberRows = rows(membersResult.data);
  const memberRows = allMemberRows.filter((item) => item.left_at == null);
  const memberIds = [...new Set(allMemberRows.map((item) => text(item.user_id)))];
  const { data: profileData, error: profilesError } = await supabase.from("profiles").select("*").in("id", memberIds);
  if (profilesError) throw profilesError;
  const profiles = rows(profileData);
  const roomData = row(roomResult.data)!;
  return {
    ...base, activeRoomId: roomId,
    profiles: profiles.map((item) => ({ id: text(item.id), name: text(item.display_name), initials: text(item.display_name).slice(0, 1).toUpperCase(), accent: text(item.accent) || "#5f8ee6", createdAt: text(item.created_at) })),
    rooms: [{ id: roomId, name: text(roomData.name), ownerProfileId: text(roomData.owner_id), createdAt: text(roomData.created_at) }],
    memberships: memberRows.map((item) => ({ id: `${text(item.room_id)}:${text(item.user_id)}`, roomId, profileId: text(item.user_id), role: item.role === "owner" ? "owner" : "member", joinedAt: text(item.joined_at) })),
    books: rows(booksResult.data).map((item) => ({ id: text(item.id), roomId, ownerProfileId: text(item.owner_id), title: text(item.title), author: text(item.author), currentPage: Number(item.current_page), totalPages: Number(item.total_pages), status: statusFromDb[text(item.status)] ?? "Quero ler", color: text(item.color), createdAt: text(item.created_at), completedAt: item.completed_at ? text(item.completed_at) : undefined })),
    sessions: rows(sessionsResult.data).map((item) => ({ id: text(item.id), roomId, profileId: text(item.user_id), bookId: text(item.book_id), occurredOn: text(item.read_on), durationMinutes: Number(item.duration_minutes), startPage: item.start_page == null ? undefined : Number(item.start_page), endPage: item.end_page == null ? undefined : Number(item.end_page), note: item.note ? text(item.note) : undefined, createdAt: text(item.created_at) })),
    weeklyGoals: rows(goalsResult.data).map((item) => ({ id: text(item.id), roomId, weekStart: text(item.week_start), minDays: Number(item.min_days), minMinutes: Number(item.min_minutes) })),
    weeklyPacts: rows(pactsResult.data).map((item) => { const elements = Array.isArray(item.elements) ? item.elements as Row[] : []; return { id: text(item.id), roomId, weekStart: text(item.week_start), reward: text(elements.find((element) => element.kind === "reward")?.title), penalty: text(elements.find((element) => element.kind === "penalty")?.title) }; }),
    pactCards: rows(cardsResult.data).map((item) => ({ id: text(item.id), roomId, kind: text(item.kind) as CardKind, text: text(item.title) })).filter((item) => item.kind === "reward" || item.kind === "penalty"),
    vaultEntries: rows(vaultResult.data).map((item) => ({ id: text(item.id), roomId, profileId: text(item.created_by), amount: Number(item.amount), reason: text(item.reason), occurredOn: text(item.occurred_on) })),
    weeklyResults: rows(resultsResult.data).map((item) => { const raw = row(item.member_results) ?? {}; const memberResults = Object.fromEntries(Object.entries(raw).map(([id, value]) => [id, Boolean(row(value)?.met ?? value)])); return { id: text(item.id), roomId, weekStart: text(item.week_start), memberResults, outcome: text(item.outcome) as "both_met" | "one_met" | "none_met" }; }),
    roomInvites: rows(invitesResult.data).map((item) => ({ id: text(item.id), roomId: text(item.room_id), expiresAt: text(item.expires_at), createdAt: text(item.created_at) })),
  };
}

export async function createRoom(name: string) { const { error } = await requireSupabase().rpc("create_room", { room_name: name.trim() }); if (error) throw error; }
export async function joinRoom(token: string) { const { error } = await requireSupabase().rpc("join_room_by_invite", { raw_token: token.trim() }); if (error) throw error; }
export async function createInvite(roomId: string) { const { data, error } = await requireSupabase().rpc("create_room_invite", { target_room: roomId }); if (error) throw error; const invite = rows(data)[0]; return { token: text(invite?.token), expiresAt: text(invite?.expires_at) }; }
export async function revokeInvites(roomId: string) { const { error } = await requireSupabase().rpc("revoke_room_invites", { target_room: roomId }); if (error) throw error; }
export async function renameRoom(roomId: string, name: string) { const { error } = await requireSupabase().rpc("rename_room", { target_room: roomId, new_name: name.trim() }); if (error) throw error; }
export async function updateProfile(userId: string, displayName: string, accent: string) { const { error } = await requireSupabase().from("profiles").update({ display_name: displayName.trim(), accent }).eq("id", userId); if (error) throw error; }
export async function saveBook(roomId: string, userId: string, book: Omit<Book, "id" | "roomId" | "ownerProfileId" | "createdAt"> & { id?: string }) {
  const supabase = requireSupabase(); const status = statusToDb[book.status];
  if (status === "reading") { const { error } = await supabase.from("books").update({ status: "want_to_read" }).eq("room_id", roomId).eq("owner_id", userId).eq("status", "reading").neq("id", book.id ?? "00000000-0000-0000-0000-000000000000"); if (error) throw error; }
  const payload = { room_id: roomId, owner_id: userId, title: book.title.trim(), author: book.author.trim(), current_page: Math.max(0, Math.round(book.currentPage)), total_pages: Math.max(0, Math.round(book.totalPages)), status, color: book.color, completed_at: status === "completed" ? dateKey(new Date()) : null };
  const result = book.id ? await supabase.from("books").update(payload).eq("id", book.id).eq("owner_id", userId) : await supabase.from("books").insert(payload);
  if (result.error) throw result.error;
}
export async function removeBook(bookId: string, userId: string) { const { error } = await requireSupabase().from("books").delete().eq("id", bookId).eq("owner_id", userId); if (error) throw error; }
export async function chooseCurrentBook(roomId: string, userId: string, bookId: string) { const supabase = requireSupabase(); const first = await supabase.from("books").update({ status: "want_to_read" }).eq("room_id", roomId).eq("owner_id", userId).eq("status", "reading"); if (first.error) throw first.error; const second = await supabase.from("books").update({ status: "reading" }).eq("id", bookId).eq("owner_id", userId); if (second.error) throw second.error; }
export async function recordSession(bookId: string, minutes: number, startPage?: number, endPage?: number, note?: string) { const ended = new Date(); const started = new Date(ended.getTime() - minutes * 60_000); const { error } = await requireSupabase().rpc("record_reading_session", { target_book: bookId, session_started_at: started.toISOString(), session_ended_at: ended.toISOString(), session_start_page: startPage ?? null, session_end_page: endPage ?? null, session_note: note ?? null }); if (error) throw error; }
export async function saveGoal(roomId: string, _userId: string, days: number, minutes: number) { const { error } = await requireSupabase().rpc("set_weekly_goal", { target_room: roomId, target_week: dateKey(getWeekStart()), target_days: days, target_minutes: minutes }); if (error) throw error; }
export async function replaceCards(roomId: string, cards: CardOption[], kind: CardKind) { const { error } = await requireSupabase().rpc("replace_pact_cards", { target_room: roomId, target_kind: kind, cards: cards.map((card) => ({ id: card.id, title: card.text.trim() })).filter((card) => card.title) }); if (error) throw error; }
export async function savePact(roomId: string, _userId: string, reward: string, penalty: string) { const elements = [{ kind: "reward", title: reward }, { kind: "penalty", title: penalty }]; const { error } = await requireSupabase().rpc("set_weekly_pact", { target_room: roomId, target_week: dateKey(getWeekStart()), target_elements: elements }); if (error) throw error; }
export async function addVaultEntry(roomId: string, userId: string, amount: number, reason: string) { const { error } = await requireSupabase().from("vault_transactions").insert({ room_id: roomId, created_by: userId, amount, reason: reason.trim(), occurred_on: dateKey(new Date()) }); if (error) throw error; }
export async function closeWeek(roomId: string, weekStart: string) { const { error } = await requireSupabase().rpc("close_week", { target_room: roomId, target_week: weekStart }); if (error) throw error; }
export async function leaveRoom(roomId: string, transferTo?: string) { const { error } = await requireSupabase().rpc("leave_room", { target_room: roomId, transfer_to: transferTo ?? null }); if (error) throw error; }
