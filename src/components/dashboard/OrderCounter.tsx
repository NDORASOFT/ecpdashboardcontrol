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
  return (
    <Card className="surface-card p-3 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-7 w-7 rounded-xl bg-mint text-primary-foreground grid place-items-center">
          <Hash className="h-3.5 w-3.5" />
        </div>
        <h3 className="font-display text-xs font-semibold leading-tight">PO Counter</h3>
        <Button size="icon" variant="ghost" className="ml-auto h-6 w-6" onClick={onReset}>
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2 py-1">
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-xl"
          onClick={() => {
            setPoCount(Math.max(0, poCount - 1));
            setCount(Math.max(0, count - 1));
          }}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <div className="font-display text-4xl font-bold tabular-nums">{poCount}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">PO</div>
        </div>
        <Button
          size="icon"
          className="h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:brightness-110"
          onClick={() => {
            setPoCount(poCount + 1);
            setCount(count + 1);
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-center">
        <div className="rounded-lg bg-secondary/60 py-1 px-1.5">
          <div className="text-sm font-semibold tabular-nums">{count}</div>
          <div className="text-[8px] text-muted-foreground uppercase">Worked</div>
        </div>
        <div className="rounded-lg bg-secondary/60 py-1 px-1.5 flex items-center justify-between">
          <button
            onClick={() => { setOtherCount(Math.max(0, otherCount - 1)); setCount(Math.max(0, count - 1)); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
          <div>
            <div className="text-sm font-semibold tabular-nums">{otherCount}</div>
            <div className="text-[8px] text-muted-foreground uppercase">76 Scr</div>
          </div>
          <button
            onClick={() => { setOtherCount(otherCount + 1); setCount(count + 1); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </Card>
  );
};
