import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, NotebookPen } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Note = { id: string; title: string; body: string };

export const Notepad = () => {
  const [notes, setNotes] = useLocalStorage<Note[]>("ecp.notes", [
    { id: "1", title: "Notas", body: "" },
  ]);
  const [activeId, setActiveId] = useState(notes[0]?.id ?? "1");

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

  return (
    <Card className="surface-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-sun text-accent-foreground grid place-items-center">
          <NotebookPen className="h-4 w-4" />
        </div>
        <h3 className="font-display text-xs font-semibold">Notepad</h3>
        <span className="text-[9px] text-muted-foreground ml-auto">{notes.length} tab{notes.length>1?"s":""}</span>
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
    </Card>
  );
};
