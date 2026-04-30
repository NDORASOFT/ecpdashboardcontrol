import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ShippingProgress, vehicleFor } from "./ShippingProgress";

const QUOTES = [
  "Bonjour, courage — small steps, big day.",
  "Doucement, but never stop. Keep typing.",
  "C'est la vie — one PO at a time.",
  "Allez, allez! Your goal is closer than it looks.",
  "Petit à petit, l'oiseau fait son nid. Build it order by order.",
  "On y va — momentum beats perfection.",
  "Chaque ordre compte. Every order counts.",
  "Respire, focus, livre. Breathe, focus, deliver.",
  "Vas-y, champion — finish strong.",
  "La patience est amère, mais son fruit est doux. Push through.",
];

const moodFor = (pct: number) => {
  if (pct >= 1) return { face: "🤩", label: "¡Meta!", color: "hsl(var(--mint))" };
  if (pct >= 0.66) return { face: "😄", label: "Cerca", color: "hsl(var(--sun))" };
  return { face: "😟", label: "Push it", color: "hsl(var(--coral))" };
};

export const GoalGauge = ({ count, goal = 70 }: { count: number; goal?: number }) => {
  const pct = Math.min(count / goal, 1);
  const remaining = Math.max(goal - count, 0);
  const showRemaining = count >= 36 && count < goal;
  const mood = moodFor(pct);
  const v = vehicleFor(pct);
  const Icon = v.icon;
  const worried = pct < 0.7;

  // Rotating motivational quote (every 8s)
  const [qIdx, setQIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setQIdx((i) => (i + 1) % QUOTES.length), 8000);
    return () => clearInterval(id);
  }, []);

  // SVG ring
  const size = 120;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <Card className={`surface-card p-3 flex flex-col items-center gap-2 h-full overflow-hidden ${worried ? "ring-2 ring-coral/40" : ""}`}>
      {/* Title */}
      <div className="w-full text-center">
        <p className="font-display text-xs font-semibold leading-tight">Daily Goal</p>
        <p className="text-[9px] text-muted-foreground">Meta: {goal} órdenes</p>
      </div>

      {/* Ring */}
      <div className="relative" style={{ width: size, height: size }}>
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
          <div className="text-center leading-none">
            {showRemaining ? (
              <>
                <div className="font-display text-2xl font-bold">{count}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">de {goal}</div>
              </>
            ) : (
              <>
                <div className={`text-3xl ${worried ? "animate-worry" : "animate-float"}`}>{mood.face}</div>
                <div className="text-[9px] text-muted-foreground mt-1">{mood.label}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shipping bar + remaining */}
      <div className="w-full px-1 mt-auto">
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
        <div className="text-[10px] text-center mt-1.5 font-medium" style={{ color: v.color }}>
          {remaining > 0 ? `Faltan ${remaining} órdenes` : "¡Meta alcanzada! 🎉"}
        </div>
        <div
          key={qIdx}
          className={`text-[10px] text-center mt-1 italic text-muted-foreground px-1 leading-tight transition-opacity duration-700 ${
            worried ? "text-coral animate-pulse-soft" : ""
          }`}
        >
          “{QUOTES[qIdx]}”
        </div>
      </div>
    </Card>
  );
};
