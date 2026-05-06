import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Target, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Order,
  loadOrders,
  removeOrder,
  upsertOrder,
  cutsForMonth,
  inRange,
  weekRange,
  MONTHS_ES,
} from "@/lib/orders";

const DAILY_GOAL = 70;
const WEEKLY_GOAL = 350;

const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const OrdersView = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [orders, setOrders] = useState<Order[]>(loadOrders());

  useEffect(() => {
    const refresh = () => setOrders(loadOrders());
    window.addEventListener("ecp:orders:changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("ecp:orders:changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const cuts = useMemo(() => cutsForMonth(year, month), [year, month]);
  const monthOrders = useMemo(
    () =>
      orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [orders, year, month]
  );

  // Weekly progress (current week)
  const week = useMemo(() => weekRange(new Date()), []);
  const weeklyOrders = orders.filter(
    (o) => !o.is76 && inRange(o.createdAt, week.start, week.end)
  );
  const weeklyCount = weeklyOrders.length;

  // Today
  const todayKey = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => !o.is76 && new Date(o.createdAt).toDateString() === todayKey
  );

  const updateField = (po: string, patch: Partial<Order>) =>
    upsertOrder(po, patch);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  const dailyPct = Math.min(100, Math.round((todayOrders.length / DAILY_GOAL) * 100));
  const weeklyPct = Math.min(100, Math.round((weeklyCount / WEEKLY_GOAL) * 100));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Goals header */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl bg-secondary/60 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="h-3 w-3 text-mint" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Hoy
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {todayOrders.length}/{DAILY_GOAL}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-background overflow-hidden">
            <div
              className="h-full bg-mint transition-all"
              style={{ width: `${dailyPct}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl bg-secondary/60 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Semana
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {weeklyCount}/{WEEKLY_GOAL}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-background overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${weeklyPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-2 mb-2">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-display text-sm font-semibold uppercase tracking-wider">
          {MONTHS_ES[month]} {year}
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {monthOrders.length} órdenes este mes
        </span>
      </div>

      {/* Cuts */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
        {cuts.map((cut, idx) => {
          const inCut = monthOrders.filter((o) =>
            inRange(o.createdAt, cut.start, cut.end)
          );
          const sumAmount = inCut.reduce((a, o) => a + (o.amount || 0), 0);
          const counted = inCut.filter((o) => !o.is76).length;
          return (
            <div key={idx} className="bg-black border border-yellow-500/40 rounded-xl overflow-hidden">
              <div className="bg-yellow-500/10 px-2.5 py-1.5 flex items-center justify-between border-b border-yellow-500/30">
                <span className="text-[10px] font-semibold text-yellow-300 font-mono uppercase tracking-wider">
                  {cut.label}
                </span>
                <div className="flex items-center gap-2 text-[10px] font-mono text-yellow-400">
                  <span>{counted} cuentan</span>
                  <span>·</span>
                  <span>{inCut.length} total</span>
                  <span>·</span>
                  <span>{fmtUSD(sumAmount)}</span>
                </div>
              </div>

              {inCut.length === 0 ? (
                <div className="text-center text-[10px] text-yellow-700 py-4 font-mono">
                  Sin órdenes en este corte
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] font-mono text-yellow-300">
                    <thead className="text-yellow-600 text-[9px] uppercase">
                      <tr className="border-b border-yellow-500/20">
                        <th className="text-left px-2 py-1">#</th>
                        <th className="text-left px-2 py-1">PO#</th>
                        <th className="text-left px-2 py-1">PS</th>
                        <th className="text-right px-2 py-1">Amount</th>
                        <th className="text-center px-2 py-1">76</th>
                        <th className="text-left px-2 py-1">Fecha</th>
                        <th className="px-1 py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {inCut.map((o, i) => (
                        <tr key={o.po} className="border-b border-yellow-500/10 hover:bg-yellow-500/5">
                          <td className="px-2 py-1 text-yellow-600">{i + 1}</td>
                          <td className="px-2 py-1 font-semibold">{o.po}</td>
                          <td className="px-2 py-1">
                            <Input
                              value={o.ps}
                              onChange={(e) =>
                                updateField(o.po, { ps: e.target.value.toUpperCase() })
                              }
                              placeholder="—"
                              className="h-6 text-[10px] bg-transparent border-yellow-500/30 text-yellow-300 font-mono px-1"
                            />
                          </td>
                          <td className="px-2 py-1 text-right">
                            <Input
                              type="number"
                              value={o.amount || ""}
                              onChange={(e) =>
                                updateField(o.po, {
                                  amount: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="0.00"
                              className="h-6 text-[10px] bg-transparent border-yellow-500/30 text-yellow-300 font-mono px-1 text-right w-24 ml-auto"
                            />
                          </td>
                          <td className="px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={o.is76}
                              onChange={(e) =>
                                updateField(o.po, { is76: e.target.checked })
                              }
                              className="accent-yellow-500"
                            />
                          </td>
                          <td className="px-2 py-1 text-yellow-600">
                            {new Date(o.createdAt).toLocaleDateString("en-US", {
                              month: "2-digit",
                              day: "2-digit",
                            })}
                          </td>
                          <td className="px-1 py-1">
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar PO ${o.po}?`)) removeOrder(o.po);
                              }}
                              className="text-yellow-600 hover:text-destructive p-0.5"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
