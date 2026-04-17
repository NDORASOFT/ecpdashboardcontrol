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

  // SVG ring
  const size = 150;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <Card className="surface-card p-4 flex flex-col items-center justify-center h-full text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="hsl(var(--secondary))"
            strokeWidth={stroke}
            fill="none"
          />
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
          <div>
            {showRemaining ? (
              <>
                <div className="font-display text-3xl font-bold leading-none">{count}</div>
                <div className="text-[10px] text-muted-foreground mt-1">de {goal}</div>
                <div className="text-[10px] text-coral font-semibold mt-1">faltan {remaining}</div>
              </>
            ) : (
              <>
                <div className="text-4xl leading-none animate-float">{mood.face}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{mood.label}</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 w-full px-1">
        <div className="flex items-center justify-center gap-2 mb-1">
          <p className="font-display text-xs font-semibold">Daily Goal</p>
          <span className="text-[9px] text-muted-foreground">· {goal} órdenes</span>
        </div>

        {/* Merged single-line shipping status + progress */}
        <div className="flex items-center gap-2 w-full">
          <div
            className="h-6 w-6 rounded-lg grid place-items-center shrink-0 animate-float"
            style={{ background: `${v.color}22`, color: v.color }}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <ShippingProgress pct={pct} compact />
          </div>
          <span className="text-[10px] font-semibold tabular-nums shrink-0" style={{ color: v.color }}>
            {Math.round(pct * 100)}%
          </span>
        </div>
        <div className="text-[9px] text-muted-foreground mt-1 truncate">
          {v.label} · {remaining > 0 ? `${remaining} para meta` : "¡Meta alcanzada!"}
        </div>
      </div>
    </Card>
  );
};
