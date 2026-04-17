import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Package, Trash2, ExternalLink } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type Quote = {
  id: string;
  order: string;
  note?: string;
  link?: string;
  createdAt: number;
};

export const QuoteBucket = ({
  quotes,
  setQuotes,
}: {
  quotes: Quote[];
  setQuotes: (q: Quote[]) => void;
}) => {
  const [order, setOrder] = useState("");
  const [note, setNote] = useState("");

  const add = () => {
    if (!order.trim()) return;
    setQuotes([
      { id: crypto.randomUUID(), order: order.trim(), note: note.trim() || undefined, createdAt: Date.now() },
      ...quotes,
    ]);
    setOrder("");
    setNote("");
  };

  const remove = (id: string) => setQuotes(quotes.filter((q) => q.id !== id));

  return (
    <Card className="surface-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-sky text-primary-foreground grid place-items-center">
          <Package className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-xs font-semibold leading-tight">Quote Requests</h3>
          <p className="text-[9px] text-muted-foreground">Pendientes de respuesta</p>
        </div>
        <span className="ml-auto text-xs font-semibold bg-sky/15 text-sky px-2 py-0.5 rounded-full">
          {quotes.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        <Input value={order} onChange={(e) => setOrder(e.target.value)} placeholder="Orden #" className="h-9" />
        <div className="flex gap-2">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" className="h-9" />
          <Button onClick={add} size="icon" className="h-9 w-9 shrink-0 rounded-xl">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin -mx-1 px-1 space-y-1.5">
        {quotes.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">Sin quotes pendientes ✨</p>
        )}
        {quotes.map((q) => (
          <div key={q.id} className="group flex items-start gap-2 rounded-xl bg-secondary/70 hover:bg-muted px-2.5 py-2 transition-smooth">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">#{q.order}</div>
              {q.note && <div className="text-[11px] text-muted-foreground truncate">{q.note}</div>}
            </div>
            <button
              onClick={() => remove(q.id)}
              className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-smooth"
              aria-label="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};
