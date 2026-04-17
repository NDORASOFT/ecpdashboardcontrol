import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw, Hash } from "lucide-react";

export const OrderCounter = ({
  count,
  setCount,
  onReset,
}: {
  count: number;
  setCount: (n: number) => void;
  onReset: () => void;
}) => {
  return (
    <Card className="surface-card p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-xl bg-mint text-primary-foreground grid place-items-center">
          <Hash className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold leading-tight">Órdenes procesadas</h3>
          <p className="text-[10px] text-muted-foreground">Hoy</p>
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
          onClick={() => setCount(Math.max(0, count - 1))}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="font-display text-5xl font-bold tabular-nums">{count}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">total</div>
        </div>
        <Button
          size="icon"
          className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground hover:brightness-110"
          onClick={() => setCount(count + 1)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
};
