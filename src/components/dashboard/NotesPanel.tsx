import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, StickyNote } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Note = { id: string; title: string; body: string };

const blank = (): Note => ({ id: crypto.randomUUID(), title: "", body: "" });

export const NotesPanel = () => {
  const [notes, setNotes] = useLocalStorage<Note[]>("ecp.notes.panel", [blank()]);
  const [activeId, setActiveId] = useState<string>(notes[0]?.id ?? "");

  // Always keep at least one blank note available
  useEffect(() => {
    if (notes.length === 0) {
      const n = blank();
      setNotes([n]);
      setActiveId(n.id);
    } else if (!notes.find((n) => n.id === activeId)) {
      setActiveId(notes[0].id);
    }
  }, [notes, activeId, setNotes]);

  const active = notes.find((n) => n.id === activeId) ?? notes[0];

  const addTab = () => {
    const n = blank();
    setNotes([...notes, n]);
    setActiveId(n.id);
  };

  const closeTab = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    if (next.length === 0) {
      // Auto-create a fresh blank note when last is deleted
      const n = blank();
      setNotes([n]);
      setActiveId(n.id);
    } else {
      setNotes(next);
      if (id === activeId) setActiveId(next[0].id);
    }
  };

  const update = (patch: Partial<Note>) =>
    setNotes(notes.map((n) => (n.id === activeId ? { ...n, ...patch } : n)));

  return (
    <Card className="surface-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-sun text-accent-foreground grid place-items-center">
          <StickyNote className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-xs font-semibold leading-tight truncate">Notas</h3>
          <p className="text-[9px] text-muted-foreground">{notes.length} nota{notes.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-2">
        {notes.map((n) => (
          <div
            key={n.id}
            onClick={() => setActiveId(n.id)}
            className={`group flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-full text-xs cursor-pointer transition-smooth shrink-0
              ${n.id === activeId ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-muted"}`}
          >
            <span className="max-w-[70px] truncate">{n.title || "Sin título"}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(n.id); }}
              className="opacity-60 hover:opacity-100 rounded-full p-0.5"
              aria-label="Cerrar nota"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 rounded-full" onClick={addTab}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <input
        value={active?.title ?? ""}
        onChange={(e) => update({ title: e.target.value })}
        placeholder="Título"
        className="bg-transparent border-0 border-b border-border/60 px-1 py-1 text-sm font-medium focus:outline-none focus:border-accent mb-2"
      />
      <textarea
        value={active?.body ?? ""}
        onChange={(e) => update({ body: e.target.value })}
        placeholder="Escribe aquí..."
        className="flex-1 w-full resize-none bg-secondary/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-accent/40 scrollbar-thin"
      />
    </Card>
  );
};
