import { SceneCard } from "./ui/SceneCard";
import { Sparkles } from "lucide-react";

export const DailySummaryCard = ({
  count,
  poCount,
  otherCount,
  goal,
}: {
  count: number;
  poCount: number;
  otherCount: number;
  goal: number;
}) => {
  const pct = goal > 0 ? Math.min(100, Math.round((count / goal) * 100)) : 0;
  return (
    <SceneCard tone="sky" icon={<Sparkles className="h-4 w-4" />}>
      <div className="flex flex-col gap-2">
        <div>
          <div className="font-display text-3xl font-bold leading-none">{count}</div>
          <div className="text-[10px] opacity-70 mt-1">orders today · {pct}% of {goal}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="rounded-xl bg-white/60 px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider opacity-60">PO</div>
            <div className="font-display text-base font-semibold">{poCount}</div>
          </div>
          <div className="rounded-xl bg-white/60 px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider opacity-60">Other</div>
            <div className="font-display text-base font-semibold">{otherCount}</div>
          </div>
        </div>
        <div className="mt-1">
          <div className="h-1.5 w-full rounded-full bg-white/50 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </SceneCard>
  );
};
