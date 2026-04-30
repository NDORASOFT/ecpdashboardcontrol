import { Card } from "@/components/ui/card";
import { TrendingUp, Pencil, Check, X, Trash2, Download, FileSpreadsheet } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export type DailyRecord = { date: string; count: number; goal: number };
export type SubmissionLog = {
  id: string;
  date: string; // ISO date
  poNumber: string;
  amount: number;
  type: "PO regular" | "76 Screen" | "Cancel order" | "Other";
  cart?: string;
};

export const HistoryTable = ({
  todayCount,
  goal,
  setTodayCount,
}: {
  todayCount: number;
  goal: number;
  setTodayCount: (n: number) => void;
}) => {
  const [history, setHistory] = useLocalStorage<DailyRecord[]>("ecp.history", []);
  const [logs] = useLocalStorage<SubmissionLog[]>("ecp.submissions", []);
  const today = new Date().toISOString().slice(0, 10);

  const [tab, setTab] = useState<"daily" | "submissions">("daily");
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [draftCount, setDraftCount] = useState<string>("");
  const [draftGoal, setDraftGoal] = useState<string>("");

  // upsert today
  useEffect(() => {
    setHistory((prev) => {
      const others = prev.filter((p) => p.date !== today);
      return [{ date: today, count: todayCount, goal }, ...others].slice(0, 90);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayCount, goal]);

  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const startEdit = (r: DailyRecord) => {
    setEditingDate(r.date);
    setDraftCount(String(r.count));
    setDraftGoal(String(r.goal));
  };

  const cancelEdit = () => {
    setEditingDate(null);
    setDraftCount("");
    setDraftGoal("");
  };

  const saveEdit = (date: string) => {
    const c = Math.max(0, parseInt(draftCount) || 0);
    const g = Math.max(1, parseInt(draftGoal) || goal);
    if (date === today) {
      setTodayCount(c);
      setHistory((prev) => prev.map((r) => (r.date === date ? { ...r, count: c, goal: g } : r)));
    } else {
      setHistory((prev) => prev.map((r) => (r.date === date ? { ...r, count: c, goal: g } : r)));
    }
    cancelEdit();
  };

  const removeRow = (date: string) => {
    if (date === today) return;
    setHistory((prev) => prev.filter((r) => r.date !== date));
  };

  const downloadCsv = (filename: string, header: string[], rows: string[][]) => {
    const esc = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
    const lines = [header.join(","), ...rows.map((r) => r.map(esc).join(","))];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDaily = () =>
    downloadCsv(
      `daily-history-${today}.csv`,
      ["Date", "Count", "Goal", "Reached"],
      history.map((r) => [r.date, String(r.count), String(r.goal), r.count >= r.goal ? "Yes" : "No"])
    );

  const exportSubmissions = () =>
    downloadCsv(
      `submissions-${today}.csv`,
      ["Date", "PO Number", "Type", "Amount", "Cart"],
      logs.map((l) => [l.date, l.poNumber, l.type, l.amount.toFixed(2), l.cart || ""])
    );

  return (
    <Card className="surface-card p-4 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-secondary text-foreground grid place-items-center">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xs font-semibold leading-tight">Historial</h3>
          <p className="text-[9px] text-muted-foreground">
            {tab === "daily" ? "Editable · Excel export" : `${logs.length} submissions`}
          </p>
        </div>
        <button
          onClick={tab === "daily" ? exportDaily : exportSubmissions}
          className="text-muted-foreground hover:text-foreground"
          title={`Export ${tab} as CSV`}
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 bg-secondary rounded-full p-0.5 mb-2 self-center">
        <button
          onClick={() => setTab("daily")}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-smooth ${
            tab === "daily" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setTab("submissions")}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-smooth ${
            tab === "submissions" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Submissions
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {tab === "daily" ? (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card">
              <tr className="text-muted-foreground border-b border-border/60">
                <th className="text-left font-medium py-1.5">Date</th>
                <th className="text-right font-medium py-1.5">Count</th>
                <th className="text-right font-medium py-1.5">Goal</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted-foreground">
                    Sin registros
                  </td>
                </tr>
              )}
              {history.map((r) => {
                const reached = r.count >= r.goal;
                const isEditing = editingDate === r.date;
                return (
                  <tr key={r.date} className="border-b border-border/40 group">
                    <td className="py-1.5">
                      {fmt(r.date)} {r.date === today && <span className="ml-1 text-[9px] text-coral">hoy</span>}
                    </td>
                    {isEditing ? (
                      <>
                        <td className="py-1">
                          <input
                            type="number"
                            value={draftCount}
                            onChange={(e) => setDraftCount(e.target.value)}
                            className="w-12 ml-auto block bg-background border border-border rounded px-1 py-0.5 text-right text-xs"
                          />
                        </td>
                        <td className="py-1">
                          <input
                            type="number"
                            value={draftGoal}
                            onChange={(e) => setDraftGoal(e.target.value)}
                            className="w-12 ml-auto block bg-background border border-border rounded px-1 py-0.5 text-right text-xs"
                          />
                        </td>
                        <td className="py-1">
                          <div className="flex gap-0.5">
                            <button onClick={() => saveEdit(r.date)} className="text-mint hover:opacity-80" aria-label="Guardar">
                              <Check className="h-3 w-3" />
                            </button>
                            <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground" aria-label="Cancelar">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="text-right tabular-nums font-semibold">{r.count}</td>
                        <td className={`text-right tabular-nums ${reached ? "text-mint" : "text-muted-foreground"}`}>
                          {r.goal}
                        </td>
                        <td className="py-1">
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(r)} className="text-muted-foreground hover:text-foreground" aria-label="Editar">
                              <Pencil className="h-3 w-3" />
                            </button>
                            {r.date !== today && (
                              <button onClick={() => removeRow(r.date)} className="text-muted-foreground hover:text-destructive" aria-label="Eliminar">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card">
              <tr className="text-muted-foreground border-b border-border/60">
                <th className="text-left font-medium py-1.5">PO#</th>
                <th className="text-left font-medium py-1.5">Type</th>
                <th className="text-right font-medium py-1.5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-muted-foreground">
                    Sin submissions todavía
                  </td>
                </tr>
              )}
              {logs.slice(0, 60).map((l) => (
                <tr key={l.id} className="border-b border-border/40">
                  <td className="py-1.5 font-mono truncate max-w-[80px]" title={l.poNumber}>{l.poNumber || "—"}</td>
                  <td className="py-1.5 text-[10px] text-muted-foreground">{l.type}</td>
                  <td className="py-1.5 text-right tabular-nums">${l.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 mt-2 text-[10px] text-muted-foreground"
        onClick={tab === "daily" ? exportDaily : exportSubmissions}
      >
        <FileSpreadsheet className="h-3 w-3 mr-1" />
        Export {tab} CSV
      </Button>
    </Card>
  );
};
