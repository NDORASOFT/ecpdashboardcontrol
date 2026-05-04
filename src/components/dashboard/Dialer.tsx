import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Delete } from "lucide-react";

// Avaya dialer: prefixes 9 to outbound calls (per office PBX rule).
export const Dialer = () => {
  const [num, setNum] = useState("");

  const press = (k: string) => setNum((n) => (n + k).slice(0, 16));
  const back = () => setNum((n) => n.slice(0, -1));
  const clear = () => setNum("");

  const call = () => {
    const digits = num.replace(/\D/g, "");
    if (!digits) return;
    const tel = `tel:9${digits}`;
    window.location.href = tel;
  };

  const display = num ? `9 - ${num}` : "9 - ____";

  const keys = ["1","2","3","4","5","6","7","8","9","*","0","#"];

  return (
    <Card className="surface-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-mint text-primary-foreground grid place-items-center">
          <Phone className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-xs font-semibold leading-tight">Avaya Dialer</h3>
          <p className="text-[9px] text-muted-foreground">Auto-prefix 9 for outbound</p>
        </div>
      </div>

      <div className="bg-black border border-yellow-500/40 rounded-xl px-3 py-2 mb-2 font-mono text-yellow-400 text-base text-right tabular-nums">
        {display}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="h-9 rounded-xl bg-secondary hover:bg-muted text-sm font-semibold transition-smooth active:scale-95"
          >
            {k}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5 mt-1.5">
        <Button variant="ghost" className="h-9" onClick={back}>
          <Delete className="h-4 w-4" />
        </Button>
        <Button
          className="h-9 col-span-1 bg-mint text-primary-foreground hover:brightness-110"
          onClick={call}
        >
          <Phone className="h-4 w-4 mr-1" /> Call
        </Button>
        <Button variant="ghost" className="h-9 text-muted-foreground" onClick={clear}>
          Clear
        </Button>
      </div>

      <p className="text-[9px] text-muted-foreground mt-2 text-center">
        Opens system tel:// — Avaya one-X / Workplace will pick it up if registered.
      </p>
    </Card>
  );
};
