import { Card } from "@/components/ui/card";
import { ShippingProgress, vehicleFor } from "./ShippingProgress";

const moodFor = (pct: number) => {
  if (pct >= 1) return { face: "🤩", label: "¡Meta!", color: "hsl(var(--mint))" };
  if (pct >= 0.66) return { face: "😄", label: "Cerca", color: "hsl(var(--sun))" };
  return { face: "🙂", label: "En ruta", color: "hsl(var(--coral))" };
};

export const GoalGauge = ({ count, goal = 70 }: { count: number; goal?: number }) => {
  const pct = Math.min(count / goal, 1);
  const remaining = Math.max(goal - count, 0);
  const showRemaining = count >= 36 && count < goal;
  const mood = moodFor(pct);
  const v = vehicleFor(pct);
  const Icon = v.icon;

  // Compact SVG ring
  const size = 86;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <Card className="surface-card p-3 flex flex-row items-center gap-3 h-full overflow-hidden">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--secondary))" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={mood.color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          {showRemaining ? (
            <div className="text-center leading-none">
              <div className="font-display text-lg font-bold">{count}</div>
              <div className="text-[8px] text-muted-foreground">de {goal}</div>
            </div>
          ) : (
            <div className="text-2xl animate-float leading-none">{mood.face}</div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-display text-xs font-semibold truncate">Daily Goal</p>
          <span className="text-[9px] text-muted-foreground shrink-0">{count}/{goal}</span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="h-5 w-5 rounded-md grid place-items-center shrink-0 animate-float"
            style={{ background: `${v.color}22`, color: v.color }}
          >
            <Icon className="h-3 w-3" />
          </div>
          <div className="flex-1 min-w-0">
            <ShippingProgress pct={pct} compact />
          </div>
          <span className="text-[10px] font-semibold tabular-nums shrink-0" style={{ color: v.color }}>
            {Math.round(pct * 100)}%
          </span>
        </div>

        <div className="text-[9px] text-muted-foreground truncate">
          {v.label} · {remaining > 0 ? `faltan ${remaining}` : "¡Meta alcanzada!"}
        </div>
      </div>
    </Card>
  );
};
