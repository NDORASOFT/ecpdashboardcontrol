import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useEffect } from "react";

export type DailyRecord = { date: string; count: number; goal: number };

export const HistoryTable = ({ todayCount, goal }: { todayCount: number; goal: number }) => {
  const [history, setHistory] = useLocalStorage<DailyRecord[]>("ecp.history", []);
  const today = new Date().toISOString().slice(0, 10);

  // upsert today
  useEffect(() => {
    setHistory((prev) => {
      const others = prev.filter((p) => p.date !== today);
      return [{ date: today, count: todayCount, goal }, ...others].slice(0, 30);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayCount, goal]);

  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <Card className="surface-card p-4 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-secondary text-foreground grid place-items-center">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold leading-tight">Historial</h3>
          <p className="text-[10px] text-muted-foreground">Conteos pasados</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="text-muted-foreground border-b border-border/60">
              <th className="text-left font-medium py-1.5">Date</th>
              <th className="text-right font-medium py-1.5">Count</th>
              <th className="text-right font-medium py-1.5">Goal</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">Sin registros</td></tr>
            )}
            {history.map((r) => {
              const reached = r.count >= r.goal;
              return (
                <tr key={r.date} className="border-b border-border/40">
                  <td className="py-1.5">
                    {fmt(r.date)} {r.date === today && <span className="ml-1 text-[9px] text-coral">hoy</span>}
                  </td>
                  <td className="text-right tabular-nums font-semibold">{r.count}</td>
                  <td className={`text-right tabular-nums ${reached ? "text-mint" : "text-muted-foreground"}`}>
                    {r.goal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
