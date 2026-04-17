import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, NotebookPen, FileText, StickyNote, Trash2 } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Note = { id: string; title: string; body: string };
type TNote = { id: string; name: string; rno: string; sw: string; item: string };
type Mode = "notepad" | "tnotes";

export const Notepad = () => {
  const [mode, setMode] = useLocalStorage<Mode>("ecp.notepad.mode", "notepad");

  const [notes, setNotes] = useLocalStorage<Note[]>("ecp.notes", [
    { id: "1", title: "Notas", body: "" },
  ]);
  const [activeId, setActiveId] = useState(notes[0]?.id ?? "1");

  const [tnotes, setTnotes] = useLocalStorage<TNote[]>("ecp.tnotes", []);

  const active = notes.find((n) => n.id === activeId) ?? notes[0];

  const addTab = () => {
    const id = crypto.randomUUID();
    const next = [...notes, { id, title: `Tab ${notes.length + 1}`, body: "" }];
    setNotes(next);
    setActiveId(id);
  };

  const closeTab = (id: string) => {
    if (notes.length === 1) return;
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    if (id === activeId) setActiveId(next[0].id);
  };

  const update = (patch: Partial<Note>) =>
    setNotes(notes.map((n) => (n.id === activeId ? { ...n, ...patch } : n)));

  const addTNote = () => {
    setTnotes([
      { id: crypto.randomUUID(), name: "", rno: "", sw: "", item: "" },
      ...tnotes,
    ]);
  };

  const updateTNote = (id: string, patch: Partial<TNote>) =>
    setTnotes(tnotes.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const removeTNote = (id: string) => setTnotes(tnotes.filter((t) => t.id !== id));

  return (
    <Card className="surface-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-sun text-accent-foreground grid place-items-center">
          <NotebookPen className="h-4 w-4" />
        </div>
        <h3 className="font-display text-xs font-semibold">
          {mode === "notepad" ? "Notepad" : "T-Notes"}
        </h3>
        <div className="ml-auto flex items-center gap-1 bg-secondary rounded-full p-0.5">
          <button
            onClick={() => setMode("notepad")}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-smooth ${
              mode === "notepad" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Modo Notepad"
          >
            <StickyNote className="h-3 w-3" />
            Notepad
          </button>
          <button
            onClick={() => setMode("tnotes")}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-smooth ${
              mode === "tnotes" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Modo T-Notes"
          >
            <FileText className="h-3 w-3" />
            T-Notes
          </button>
        </div>
      </div>

      {mode === "notepad" ? (
        <>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-2">
            {notes.map((n) => (
              <div
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={`group flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-full text-xs cursor-pointer transition-smooth shrink-0
                  ${n.id === activeId ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-muted"}`}
              >
                <span className="max-w-[70px] truncate">{n.title || "Sin título"}</span>
                {notes.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(n.id); }}
                    className="opacity-60 hover:opacity-100 rounded-full p-0.5"
                    aria-label="Cerrar tab"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
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
            placeholder="Escribe aquí... (solo se guarda en este dashboard)"
            className="flex-1 w-full resize-none bg-secondary/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-accent/40 scrollbar-thin"
          />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-muted-foreground">
              {tnotes.length} item{tnotes.length === 1 ? "" : "s"}
            </span>
            <Button size="sm" variant="secondary" className="h-7 rounded-full text-xs" onClick={addTNote}>
              <Plus className="h-3.5 w-3.5" />
              Agregar item
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1">
            {tnotes.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8">
                No hay items todavía. Agrega uno para empezar.
              </div>
            )}
            {tnotes.map((t) => (
              <div key={t.id} className="bg-secondary/50 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    value={t.name}
                    onChange={(e) => updateTNote(t.id, { name: e.target.value })}
                    placeholder="Name (ej. Michael)"
                    className="flex-1 bg-transparent border-0 border-b border-border/60 px-1 py-0.5 text-sm font-medium focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => removeTNote(t.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-smooth"
                    aria-label="Eliminar item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <label className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground">RNO</span>
                    <input
                      value={t.rno}
                      onChange={(e) => updateTNote(t.id, { rno: e.target.value })}
                      className="bg-background/60 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-accent"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground">SW</span>
                    <input
                      value={t.sw}
                      onChange={(e) => updateTNote(t.id, { sw: e.target.value })}
                      className="bg-background/60 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-accent"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Item</span>
                    <input
                      value={t.item}
                      onChange={(e) => updateTNote(t.id, { item: e.target.value })}
                      className="bg-background/60 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-accent"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};
