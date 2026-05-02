import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ShippingProgress, vehicleFor } from "./ShippingProgress";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { DailyRecord, SubmissionLog } from "./HistoryTable";

const moodFor = (pct: number) => {
  if (pct >= 1) return { face: "🤩", label: "Goal!", color: "hsl(var(--mint))" };
  if (pct >= 0.66) return { face: "😄", label: "Close", color: "hsl(var(--sun))" };
  return { face: "😟", label: "Push it", color: "hsl(var(--coral))" };
};

const WEEKLY_BONUS = 350; // weekly bonus threshold (configurable later)

const useTips = (count: number, goal: number, weekTotal: number) => {
  return useMemo(() => {
    const remaining = Math.max(goal - count, 0);
    const weekRemaining = Math.max(WEEKLY_BONUS - weekTotal, 0);
    return [
      "No olvides tu M-Note en los BO",
      "Saca tus órdenes antes del Cut Out Time",
      remaining > 0
        ? `Estás a ${remaining} ${remaining === 1 ? "orden" : "órdenes"} de tu meta diaria`
        : "Meta diaria alcanzada — ¡sigue!",
      weekRemaining > 0
        ? `Faltan ${weekRemaining} órdenes para tu bono semanal`
        : "¡Bono semanal asegurado!",
      "Split tus órdenes antes del Cut Out",
      "Revisa BO/DS antes de hacer T-Note",
      "PO arriba de $1500 → Crédito (UNC)",
    ];
  }, [count, goal, weekTotal]);
};

export const GoalGauge = ({ count, goal = 70 }: { count: number; goal?: number }) => {
  const pct = Math.min(count / goal, 1);
  const remaining = Math.max(goal - count, 0);
  const mood = moodFor(pct);
  const v = vehicleFor(pct);
  const Icon = v.icon;
  const worried = pct < 0.7;

  const [history] = useLocalStorage<DailyRecord[]>("ecp.history", []);
  const weekTotal = useMemo(() => history.slice(0, 7).reduce((s, r) => s + r.count, 0), [history]);

  const tips = useTips(count, goal, weekTotal);
  const [tIdx, setTIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTIdx((i) => (i + 1) % tips.length), 8000);
    return () => clearInterval(id);
  }, [tips.length]);

  const size = 80;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <Card className={`surface-card p-2.5 flex flex-col items-center gap-1.5 overflow-hidden ${worried ? "ring-2 ring-coral/40" : ""}`}>
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
            <div className={`text-xl ${worried ? "animate-worry" : "animate-float"}`}>{mood.face}</div>
            <div className="font-display text-base font-bold mt-0.5">{count}</div>
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
          {remaining > 0 ? `${remaining} left · Wk ${weekTotal}/${WEEKLY_BONUS}` : `Goal! · Wk ${weekTotal}/${WEEKLY_BONUS}`}
        </div>
        <div key={tIdx} className={`text-[9px] text-center mt-1 leading-tight font-medium ${worried ? "text-coral animate-pulse-soft" : "text-foreground/80"}`}>
          💡 {tips[tIdx]}
        </div>
      </div>
    </Card>
  );
};
