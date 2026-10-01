"use client";
import { useState } from "react";
import { BookOpen, Check, Edit3, Plus, Star, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ReadingClub } from "@/hooks/use-reading-club";
import type { Book, BookStatus } from "@/types/reading";

type EditableBook = Omit<Book, "id" | "roomId" | "ownerProfileId" | "createdAt"> & { id?: string };
const emptyBook: EditableBook = { title: "", author: "", currentPage: 0, totalPages: 0, status: "Quero ler", color: "#744d62" };

export function LibraryPage({ club }: { club: ReadingClub }) {
  const [editing, setEditing] = useState<EditableBook | null>(null);
  if (!club.data || !club.activeProfile) return null;
  const books = club.data.books.filter((book) => book.ownerProfileId === club.activeProfile!.id);
  const submit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (editing?.title.trim()) { club.upsertBook(editing); setEditing(null); } };
  return <div className="library-layout"><section className="library-toolbar panel-card"><div><strong>{books.length}</strong><span>livros de {club.activeProfile.name}</span></div><div><strong>{books.filter((book) => book.status === "Concluído").length}</strong><span>histórias concluídas</span></div><button className="primary-button" onClick={() => setEditing(emptyBook)}><Plus size={17} /> Adicionar livro</button></section>
    <section className="books-grid">{books.map((book) => { const progress = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0; return <article className="book-card" key={book.id}>
      <div className="book-cover" style={{ background: `linear-gradient(135deg, ${book.color}, #241b25)` }}><span>{book.title.split(" ").slice(0, 2).join(" ")}</span><BookOpen size={20} /><i /></div>
      <div className="book-info"><div className="book-status-row"><span className={`status status-${book.status.replace(" ", "-").toLowerCase()}`}>{book.status}</span><span className="owner-dot" style={{ background: club.activeProfile!.accent }}>{club.activeProfile!.initials}</span></div><h3>{book.title}</h3><p>{book.author}</p><div className="book-progress"><div><i style={{ width: `${progress}%` }} /></div><span>{progress}%</span></div><small>Página {book.currentPage} de {book.totalPages || "—"}</small><div className="book-actions">{book.status !== "Lendo" && <button onClick={() => club.setCurrentBook(book.id)}><Star size={14} /> Ler agora</button>}<button onClick={() => setEditing(book)}><Edit3 size={14} /> Editar</button><button className="icon-danger" onClick={() => club.deleteBook(book.id)} aria-label={`Excluir ${book.title}`}><Trash2 size={14} /></button></div></div>
    </article>; })}{books.length === 0 && <div className="empty-library"><BookOpen size={30} /><h3>Sua estante começa aqui</h3><p>Adicione um livro e marque-o como “Lendo” para iniciar uma sessão.</p><button className="primary-button" onClick={() => setEditing(emptyBook)}><Plus size={17} /> Adicionar primeiro livro</button></div>}</section>
    <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}><DialogContent className="club-dialog"><DialogHeader><DialogTitle>{editing?.id ? "Editar livro" : "Novo livro na estante"}</DialogTitle><DialogDescription>Este livro ficará associado a {club.activeProfile.name}.</DialogDescription></DialogHeader>{editing && <form className="club-form" onSubmit={submit}><label>Título<input required value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label><label>Autor<input required value={editing.author} onChange={(event) => setEditing({ ...editing, author: event.target.value })} /></label><div className="form-row"><label>Página atual<input type="number" min="0" value={editing.currentPage} onChange={(event) => setEditing({ ...editing, currentPage: Number(event.target.value) })} /></label><label>Total de páginas<input type="number" min="0" value={editing.totalPages} onChange={(event) => setEditing({ ...editing, totalPages: Number(event.target.value) })} /></label></div><label>Status<select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as BookStatus })}><option>Quero ler</option><option>Lendo</option><option>Concluído</option></select></label><button className="primary-button" type="submit"><Check size={17} /> Salvar livro</button></form>}</DialogContent></Dialog>
  </div>;
}
