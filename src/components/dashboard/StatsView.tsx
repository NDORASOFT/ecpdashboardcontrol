import { Card } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { TrendingUp, Award, Clock, BarChart3 } from "lucide-react";
import type { DailyRecord, SubmissionLog } from "./HistoryTable";

export const StatsView = () => {
  const [history] = useLocalStorage<DailyRecord[]>("ecp.history", []);
  const [logs] = useLocalStorage<SubmissionLog[]>("ecp.submissions", []);

  // Weekly progress (last 7 days)
  const last7 = history.slice(0, 7);
  const weekTotal = last7.reduce((s, r) => s + r.count, 0);
  const weekGoal = last7.reduce((s, r) => s + r.goal, 0) || 1;
  const weekPct = Math.round((weekTotal / weekGoal) * 100);

  // Average per day
  const avg = history.length > 0 ? (history.reduce((s, r) => s + r.count, 0) / history.length).toFixed(1) : "0";

  // Avg time between submits (from submission timestamps)
  let avgTimeBetween = "—";
  if (logs.length >= 2) {
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = logs.filter((l) => l.date.startsWith(today)).sort((a, b) => a.date.localeCompare(b.date));
    if (todayLogs.length >= 2) {
      let totalMs = 0;
      for (let i = 1; i < todayLogs.length; i++) {
        totalMs += new Date(todayLogs[i].date).getTime() - new Date(todayLogs[i - 1].date).getTime();
      }
      const avgMs = totalMs / (todayLogs.length - 1);
      const mins = Math.round(avgMs / 60000);
      avgTimeBetween = mins < 1 ? "<1 min" : `${mins} min`;
    }
  }

  // 76 Screen count
  const screen76 = logs.filter((l) => l.type === "76 Screen").length;

  // Best day
  const bestDay = history.length > 0 ? history.reduce((best, r) => r.count > best.count ? r : best, history[0]) : null;

  const Stat = ({ icon: Icon, label, value, color = "text-foreground" }: { icon: any; label: string; value: string; color?: string }) => (
    <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-2.5 py-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-muted-foreground truncate">{label}</div>
        <div className={`text-sm font-semibold tabular-nums ${color}`}>{value}</div>
      </div>
    </div>
  );

  return (
    <Card className="surface-card p-3 h-full flex flex-col gap-2 overflow-y-auto scrollbar-thin">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-display text-xs font-semibold">Stats</h3>
      </div>

      <div className="space-y-1.5">
        <Stat icon={TrendingUp} label="Weekly Progress" value={`${weekTotal}/${weekGoal} (${weekPct}%)`} color={weekPct >= 100 ? "text-mint" : weekPct >= 70 ? "text-sun" : "text-coral"} />
        <Stat icon={BarChart3} label="Avg Orders/Day" value={avg} />
        <Stat icon={Clock} label="Avg Time Between Submits" value={avgTimeBetween} />
        <Stat icon={Award} label="76 Screen Returns" value={String(screen76)} />
        {bestDay && (
          <Stat icon={Award} label={`Best Day (${bestDay.date.slice(5)})`} value={String(bestDay.count)} color="text-mint" />
        )}
      </div>
    </Card>
  );
};
