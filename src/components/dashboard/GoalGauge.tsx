import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ShippingProgress, vehicleFor } from "./ShippingProgress";

const QUOTES = [
  "Bonjour, courage — small steps, big day.",
  "Doucement, but never stop. Keep typing.",
  "C'est la vie — one PO at a time.",
  "Allez, allez! Your goal is closer than it looks.",
  "Petit à petit, l'oiseau fait son nid.",
  "On y va — momentum beats perfection.",
  "Chaque ordre compte. Every order counts.",
  "Respire, focus, livre. Breathe, focus, deliver.",
  "Vas-y, champion — finish strong.",
  "La patience est amère, mais son fruit est doux.",
];

const moodFor = (pct: number) => {
  if (pct >= 1) return { face: "🤩", label: "Goal!", color: "hsl(var(--mint))" };
  if (pct >= 0.66) return { face: "😄", label: "Close", color: "hsl(var(--sun))" };
  return { face: "😟", label: "Push it", color: "hsl(var(--coral))" };
};

export const GoalGauge = ({ count, goal = 70 }: { count: number; goal?: number }) => {
  const pct = Math.min(count / goal, 1);
  const remaining = Math.max(goal - count, 0);
  const mood = moodFor(pct);
  const v = vehicleFor(pct);
  const Icon = v.icon;
  const worried = pct < 0.7;

  const [qIdx, setQIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setQIdx((i) => (i + 1) % QUOTES.length), 8000);
    return () => clearInterval(id);
  }, []);

  const size = 90;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <Card className={`surface-card p-2.5 flex flex-col items-center gap-1.5 h-full overflow-hidden ${worried ? "ring-2 ring-coral/40" : ""}`}>
      <p className="font-display text-[11px] font-semibold leading-tight">Daily Goal · {goal}</p>

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--secondary))" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={mood.color} strokeWidth={stroke} fill="none"
            strokeLinecap="round" strokeDasharray={`${dash} ${c}`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center leading-none">
            <div className={`text-2xl ${worried ? "animate-worry" : "animate-float"}`}>{mood.face}</div>
            <div className="font-display text-lg font-bold mt-0.5">{count}</div>
          </div>
        </div>
      </div>

      <div className="w-full px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded grid place-items-center shrink-0" style={{ background: `${v.color}22`, color: v.color }}>
            <Icon className="h-2.5 w-2.5" />
          </div>
          <div className="flex-1 min-w-0">
            <ShippingProgress pct={pct} compact />
          </div>
          <span className="text-[9px] font-semibold tabular-nums shrink-0" style={{ color: v.color }}>
            {Math.round(pct * 100)}%
          </span>
        </div>
        <div className="text-[9px] text-center mt-1 font-medium" style={{ color: v.color }}>
          {remaining > 0 ? `${remaining} left` : "Goal reached! 🎉"}
        </div>
        <div key={qIdx} className={`text-[8px] text-center mt-0.5 italic text-muted-foreground leading-tight ${worried ? "text-coral animate-pulse-soft" : ""}`}>
          "{QUOTES[qIdx]}"
        </div>
      </div>
    </Card>
  );
};
