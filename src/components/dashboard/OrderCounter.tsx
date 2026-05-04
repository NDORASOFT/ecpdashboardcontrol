import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw, Hash } from "lucide-react";

export const OrderCounter = ({
  count,
  setCount,
  poCount,
  setPoCount,
  otherCount,
  setOtherCount,
  onReset,
}: {
  count: number;
  setCount: (n: number) => void;
  poCount: number;
  setPoCount: (n: number) => void;
  otherCount: number;
  setOtherCount: (n: number) => void;
  onReset: () => void;
}) => {
  // Big number = PO regular (the primary KPI).
  // Bottom-left = "Worked POs" total (PO + 76 Screen, count).
  // Bottom-right = "76 Screen" (otherCount).
  return (
    <Card className="surface-card p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-xl bg-mint text-primary-foreground grid place-items-center">
          <Hash className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-xs font-semibold leading-tight">PO Counter</h3>
          <p className="text-[9px] text-muted-foreground">Hoy</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="ml-auto h-7 w-7"
          onClick={onReset}
          aria-label="Reiniciar"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-between gap-3">
        <Button
          size="icon"
          variant="secondary"
          className="h-12 w-12 rounded-2xl"
          onClick={() => {
            const next = Math.max(0, poCount - 1);
            setPoCount(next);
            setCount(Math.max(0, count - 1));
          }}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="font-display text-5xl font-bold tabular-nums">{poCount}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">PO</div>
        </div>
        <Button
          size="icon"
          className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground hover:brightness-110"
          onClick={() => {
            setPoCount(poCount + 1);
            setCount(count + 1);
          }}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Bottom: Worked POs (total) + 76 Screen */}
      <div className="mt-2 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-secondary/60 py-1.5 px-2 flex items-center justify-center">
          <div className="leading-none">
            <div className="text-sm font-semibold tabular-nums">{count}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Worked POs</div>
          </div>
        </div>
        <div className="rounded-lg bg-secondary/60 py-1.5 px-2 flex items-center justify-between">
          <button
            onClick={() => {
              const next = Math.max(0, otherCount - 1);
              setOtherCount(next);
              setCount(Math.max(0, count - 1));
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Menos 76 Screen"
          >
            <Minus className="h-3 w-3" />
          </button>
          <div className="leading-none">
            <div className="text-sm font-semibold tabular-nums">{otherCount}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">76 Screen</div>
          </div>
          <button
            onClick={() => {
              setOtherCount(otherCount + 1);
              setCount(count + 1);
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Más 76 Screen"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </Card>
  );
};
