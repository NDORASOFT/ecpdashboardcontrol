import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ShippingProgress, vehicleFor } from "./ShippingProgress";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Pencil, Check } from "lucide-react";
import type { DailyRecord, SubmissionLog } from "./HistoryTable";

const moodFor = (pct: number) => {
  if (pct >= 1) return { face: "🤩", label: "Goal!", color: "hsl(var(--mint))" };
  if (pct >= 0.66) return { face: "😄", label: "Close", color: "hsl(var(--sun))" };
  return { face: "😟", label: "Push it", color: "hsl(var(--coral))" };
};

const WEEKLY_BONUS = 350;

export const GoalGauge = ({
  count,
  goal: goalProp = 70,
  onGoalChange,
}: {
  count: number;
  goal?: number;
  onGoalChange?: (g: number) => void;
}) => {
  const [storedGoal, setStoredGoal] = useLocalStorage<number>("ecp.goal", goalProp);
  const goal = storedGoal || goalProp;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));

  const pct = Math.min(count / goal, 1);
  const remaining = Math.max(goal - count, 0);
  const mood = moodFor(pct);
  const v = vehicleFor(pct);
  const Icon = v.icon;
  const worried = pct < 0.7;

  const [history] = useLocalStorage<DailyRecord[]>("ecp.history", []);
  const [logs] = useLocalStorage<SubmissionLog[]>("ecp.submissions", []);
  const weekTotal = useMemo(() => history.slice(0, 7).reduce((s, r) => s + r.count, 0), [history]);
  const last5 = logs.slice(0, 5);

  const size = 80;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  const commitGoal = () => {
    const n = Math.max(1, parseInt(draft, 10) || goal);
    setStoredGoal(n);
    onGoalChange?.(n);
    setEditing(false);
  };

  return (
    <Card className={`surface-card p-2.5 flex flex-col items-center gap-1.5 overflow-hidden ${worried ? "ring-2 ring-coral/40" : ""}`}>
      <div className="flex items-center gap-1">
        <p className="font-display text-[11px] font-semibold leading-tight">Daily Goal ·</p>
        {editing ? (
          <div className="flex items-center gap-0.5">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitGoal}
              onKeyDown={(e) => { if (e.key === "Enter") commitGoal(); }}
              className="w-10 h-5 text-[11px] bg-secondary rounded px-1 text-center"
            />
            <Check className="h-3 w-3 text-mint cursor-pointer" onClick={commitGoal} />
          </div>
        ) : (
          <button
            onClick={() => { setDraft(String(goal)); setEditing(true); }}
            className="flex items-center gap-0.5 text-[11px] font-bold hover:text-accent"
          >
            {goal} <Pencil className="h-2.5 w-2.5 opacity-60" />
          </button>
        )}
      </div>

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
      </div>

      {/* Last 5 mini history */}
      <div className="w-full mt-1 border-t border-border/40 pt-1.5">
        <div className="text-[9px] text-muted-foreground font-mono mb-1">Last 5</div>
        <div className="space-y-0.5 overflow-x-auto scrollbar-thin">
          {last5.length === 0 ? (
            <div className="text-[9px] text-muted-foreground/60 text-center py-1">No orders yet</div>
          ) : (
            last5.map((s) => (
              <div key={s.id} className="flex items-center gap-1 text-[9px] font-mono whitespace-nowrap">
                <span className="truncate max-w-[60px] text-yellow-500">{s.poNumber || "—"}</span>
                <span className={`px-1 rounded text-[8px] ${
                  s.type === "PO regular" ? "bg-primary/20 text-primary" :
                  s.type === "76 Screen" ? "bg-muted text-muted-foreground" :
                  s.type === "Cancel order" ? "bg-coral/20 text-coral" :
                  "bg-secondary text-foreground"
                }`}>
                  {s.type === "PO regular" ? "PO" : s.type === "76 Screen" ? "76" : s.type === "Cancel order" ? "X" : "OT"}
                </span>
                <span className="ml-auto tabular-nums">${s.amount.toFixed(0)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};
