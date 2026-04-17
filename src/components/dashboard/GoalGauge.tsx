import { Card } from "@/components/ui/card";

const moodFor = (pct: number) => {
  if (pct >= 1) return { face: "🤩", label: "¡Meta!", color: "hsl(var(--mint))" };
  if (pct >= 0.66) return { face: "😄", label: "Cerca", color: "hsl(var(--sun))" };
  if (pct >= 0.33) return { face: "🙂", label: "Avanzando", color: "hsl(var(--coral))" };
  return { face: "😐", label: "Empezando", color: "hsl(var(--coral))" };
};

export const GoalGauge = ({ count, goal = 70 }: { count: number; goal?: number }) => {
  const pct = Math.min(count / goal, 1);
  const remaining = Math.max(goal - count, 0);
  const showRemaining = count >= 36 && count < goal;
  const mood = moodFor(pct);

  // SVG ring
  const size = 160;
  const stroke = 14;
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
      <div className="mt-3">
        <p className="font-display text-sm font-semibold">Daily Goal</p>
        <p className="text-[11px] text-muted-foreground">Meta: {goal} órdenes</p>
      </div>
    </Card>
  );
};

export const MoodChip = ({ count, goal = 70 }: { count: number; goal?: number }) => {
  const pct = Math.min(count / goal, 1);
  const mood = moodFor(pct);
  const remaining = Math.max(goal - count, 0);

  return (
    <Card className="surface-card p-3 flex items-center gap-3 h-full">
      <div
        className="h-12 w-12 rounded-2xl grid place-items-center text-2xl shrink-0"
        style={{ background: `${mood.color}22` }}
      >
        {mood.face}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Estado</div>
        <div className="font-display text-sm font-semibold truncate">{mood.label}</div>
        <div className="text-[10px] text-muted-foreground">
          {remaining > 0 ? `${remaining} para meta` : "¡Meta alcanzada!"}
        </div>
      </div>
    </Card>
  );
};
