import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, NotebookPen, FileText, StickyNote, Trash2, Copy, Check, Truck, ClipboardPaste } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "@/hooks/use-toast";
import { computeESD } from "@/lib/leadTime";

type Note = { id: string; title: string; body: string };
type ExtraField = { id: string; label: string; value: string };
type TNote = {
  id: string;
  mscItem: string;
  michaelRno: string;
  sw: string;
  netPrice: string;
  leapTime: string;
  shipFrom: string;
  minDsFee: string;
  returnableRestockableFee: string;
  extras: ExtraField[];
};
type Mode = "notepad" | "tnotes";

const BASE_FIELDS: { key: keyof Omit<TNote, "id" | "extras">; label: string }[] = [
  { key: "mscItem", label: "MSC ITEM" },
  { key: "michaelRno", label: "Michael RNO" },
  { key: "sw", label: "SW" },
  { key: "netPrice", label: "Net price" },
  { key: "leapTime", label: "Lead Time" },
  { key: "shipFrom", label: "Ship From" },
  { key: "minDsFee", label: "Min / DS Fee" },
  { key: "returnableRestockableFee", label: "Returnable / Restockable Fee" },
];

const emptyTNote = (): TNote => ({
  id: crypto.randomUUID(),
  mscItem: "",
  michaelRno: "",
  sw: "",
  netPrice: "",
  leapTime: "",
  shipFrom: "",
  minDsFee: "",
  returnableRestockableFee: "",
  extras: [],
});

const formatTNote = (t: TNote) => {
  const lines: string[] = [];
  for (const f of BASE_FIELDS) {
    if (f.key === "mscItem") continue; // referencia, no se copia
    const val = (t[f.key] as string) ?? "";
    lines.push(`${f.label}: ${val}`);
  }
  for (const ex of t.extras) {
    if (!ex.label && !ex.value) continue;
    lines.push(`${ex.label || "Field"}: ${ex.value}`);
  }
  return lines.join("\n");
};

export const Notepad = () => {
  const [mode, setMode] = useLocalStorage<Mode>("ecp.notepad.mode", "notepad");

  const [notes, setNotes] = useLocalStorage<Note[]>("ecp.notes", [
    { id: "1", title: "Notas", body: "" },
  ]);
  const [activeId, setActiveId] = useState(notes[0]?.id ?? "1");

  const [tnotes, setTnotes] = useLocalStorage<TNote[]>("ecp.tnotes.v2", []);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingNetPrice, setPendingNetPrice] = useState<string | null>(null);

  // Always keep at least one empty T-Note at the top so user can start typing.
  useEffect(() => {
    if (tnotes.length === 0) {
      setTnotes([emptyTNote()]);
      return;
    }
    const top = tnotes[0];
    const isEmpty =
      !top.mscItem && !top.michaelRno && !top.sw && !top.netPrice &&
      !top.leapTime && !top.shipFrom && !top.minDsFee && !top.returnableRestockableFee &&
      top.extras.length === 0;
    if (!isEmpty) setTnotes([emptyTNote(), ...tnotes]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tnotes]);

  // Listen for discount-calculated events to enable "paste to net price" indicator
  // on the most recent T-Note.
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ value: string }>;
      if (!ce.detail?.value) return;
      setPendingNetPrice(ce.detail.value);
      setMode("tnotes");
    };
    window.addEventListener("ecp:net-price", handler as EventListener);
    return () => window.removeEventListener("ecp:net-price", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPendingNetPrice = () => {
    if (!pendingNetPrice || tnotes.length === 0) return;
    const target = tnotes[0];
    updateTNote(target.id, { netPrice: pendingNetPrice });
    setPendingNetPrice(null);
    toast({ title: "Net price actualizado", description: `$${pendingNetPrice}` });
  };

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

  const addTNote = () => setTnotes([emptyTNote(), ...tnotes]);

  const updateTNote = (id: string, patch: Partial<TNote>) =>
    setTnotes(tnotes.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const removeTNote = (id: string) => setTnotes(tnotes.filter((t) => t.id !== id));

  const addExtra = (id: string) => {
    const t = tnotes.find((x) => x.id === id);
    if (!t) return;
    updateTNote(id, {
      extras: [...t.extras, { id: crypto.randomUUID(), label: "", value: "" }],
    });
  };

  const updateExtra = (tid: string, eid: string, patch: Partial<ExtraField>) => {
    const t = tnotes.find((x) => x.id === tid);
    if (!t) return;
    updateTNote(tid, {
      extras: t.extras.map((e) => (e.id === eid ? { ...e, ...patch } : e)),
    });
  };

  const removeExtra = (tid: string, eid: string) => {
    const t = tnotes.find((x) => x.id === tid);
    if (!t) return;
    updateTNote(tid, { extras: t.extras.filter((e) => e.id !== eid) });
  };

  const copyTNote = async (t: TNote) => {
    const text = formatTNote(t);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(t.id);
      toast({ title: "Copiado", description: "T-Note listo para pegar en AS400" });
      setTimeout(() => setCopiedId((c) => (c === t.id ? null : c)), 1500);
    } catch {
      toast({ title: "Error", description: "No se pudo copiar", variant: "destructive" });
    }
  };

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
              {tnotes.length} T-Note{tnotes.length === 1 ? "" : "s"}
            </span>
            <Button size="sm" variant="secondary" className="h-7 rounded-full text-xs" onClick={addTNote}>
              <Plus className="h-3.5 w-3.5" />
              Nuevo T-Note
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2.5 pr-1">
            {/* always at least one T-Note via effect */}

            {tnotes.map((t) => (
              <div key={t.id} className="bg-black border border-yellow-500/40 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-yellow-500/30">
                  <span className="text-[9px] uppercase tracking-wide text-yellow-500 font-mono font-semibold">
                    T-NOTE · {(t.mscItem || "sin item").toString().slice(0, 14)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyTNote(t)}
                      className="text-yellow-500 hover:text-yellow-300 p-1 rounded-md transition-smooth"
                      aria-label="Copiar T-Note"
                      title="Copiar al portapapeles"
                    >
                      {copiedId === t.id ? <Check className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => removeTNote(t.id)}
                      className="text-yellow-500 hover:text-destructive p-1 rounded-md transition-smooth"
                      aria-label="Eliminar T-Note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {BASE_FIELDS.map((f) => {
                    const isLead = f.key === "leapTime";
                    const isNetPrice = f.key === "netPrice";
                    const isTopMost = tnotes[0]?.id === t.id;
                    const showPasteHint = isNetPrice && isTopMost && !!pendingNetPrice;
                    const esd = isLead ? computeESD((t.leapTime as string) || "") : null;
                    return (
                      <div key={f.key}>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <label
                            className="text-[10px] text-yellow-600 font-mono whitespace-nowrap"
                            title={f.label}
                          >
                            {f.label}:
                          </label>
                          <input
                            value={(t[f.key] as string) ?? ""}
                            onChange={(e) => updateTNote(t.id, { [f.key]: e.target.value } as Partial<TNote>)}
                            onKeyDown={(e) => {
                              if (showPasteHint && e.key === "Tab") {
                                e.preventDefault();
                                applyPendingNetPrice();
                              }
                            }}
                            placeholder={showPasteHint ? `Tab ↹ pega $${pendingNetPrice}` : ""}
                            className={`flex-1 min-w-[60px] bg-transparent border-b border-yellow-500/20 px-1 py-0.5 text-xs font-mono outline-none focus:border-yellow-400 ${
                              showPasteHint
                                ? "text-yellow-500/40 placeholder:text-yellow-500/50 italic"
                                : "text-yellow-300"
                            }`}
                          />
                          {showPasteHint && (
                            <button
                              onClick={applyPendingNetPrice}
                              className="shrink-0 inline-flex items-center gap-1 rounded-md bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-1.5 py-0.5 text-[9px] font-mono"
                              title="Pegar precio con descuento al Net price"
                            >
                              <ClipboardPaste className="h-3 w-3" />
                              ${pendingNetPrice}
                            </button>
                          )}
                        </div>
                        {isLead && esd?.label && (
                          <div className="flex items-center gap-1.5 pl-3 mt-0.5">
                            <Truck className="h-3 w-3 text-yellow-500" />
                            <span className="text-[10px] font-mono text-yellow-600">ESD</span>
                            <span className="text-[11px] font-mono text-yellow-300 as400-blink">
                              {esd.label}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {t.extras.map((ex) => (
                    <div key={ex.id} className="flex items-baseline gap-1.5 flex-wrap">
                      <input
                        value={ex.label}
                        onChange={(e) => updateExtra(t.id, ex.id, { label: e.target.value })}
                        placeholder="Campo:"
                        size={Math.max(6, ex.label.length + 1)}
                        className="bg-transparent border-b border-dashed border-yellow-500/30 px-1 py-0.5 text-[10px] text-yellow-600 font-mono focus:outline-none focus:border-yellow-400"
                      />
                      <input
                        value={ex.value}
                        onChange={(e) => updateExtra(t.id, ex.id, { value: e.target.value })}
                        className="flex-1 min-w-[60px] bg-transparent border-b border-yellow-500/20 px-1 py-0.5 text-xs text-yellow-300 font-mono outline-none focus:border-yellow-400"
                      />
                      <button
                        onClick={() => removeExtra(t.id, ex.id)}
                        className="text-yellow-600 hover:text-destructive p-0.5 rounded-md transition-smooth"
                        aria-label="Quitar campo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 rounded-full text-[10px] mt-1 text-yellow-500 hover:text-yellow-300 hover:bg-yellow-500/10"
                  onClick={() => addExtra(t.id)}
                >
                  <Plus className="h-3 w-3" />
                  Agregar campo
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};
