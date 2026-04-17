import { useEffect } from "react";
import { Calculator } from "@/components/dashboard/Calculator";
import { Notepad } from "@/components/dashboard/Notepad";
import { TodoList } from "@/components/dashboard/TodoList";
import { QuoteBucket, type Quote } from "@/components/dashboard/QuoteBucket";
import { FormViewer } from "@/components/dashboard/FormViewer";
import { OrderCounter } from "@/components/dashboard/OrderCounter";
import { GoalGauge } from "@/components/dashboard/GoalGauge";
import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LayoutDashboard } from "lucide-react";

const todayKey = () => new Date().toISOString().slice(0, 10);

const Index = () => {
  const GOAL = 70;
  const [count, setCount] = useLocalStorage<number>("ecp.count", 0);
  const [countDay, setCountDay] = useLocalStorage<string>("ecp.count.day", todayKey());
  const [quotes, setQuotes] = useLocalStorage<Quote[]>("ecp.quotes", []);

  useEffect(() => {
    const t = todayKey();
    if (countDay !== t) {
      setCount(0);
      setCountDay(t);
    }
  }, [countDay, setCount, setCountDay]);

  useEffect(() => {
    document.title = "ECP Data Entry Dashboard";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Panel de control diario para ECP Data Entry: tareas, quotes, tracker y meta de órdenes.");
  }, []);

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-6">
      <header className="max-w-[1500px] mx-auto mb-6 flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-charcoal text-primary-foreground grid place-items-center shadow-soft">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            ECP Data Entry Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">
            Tu control de tareas diarias en un solo lugar
          </p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2 surface-card px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-mint animate-pulse-soft" />
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto grid grid-cols-12 gap-4 auto-rows-[minmax(0,_auto)]">
        {/* Row 1 */}
        <div className="col-span-12 md:col-span-3 min-h-[340px]">
          <Calculator />
        </div>
        <div className="col-span-12 md:col-span-3 row-span-2 min-h-[700px] flex flex-col gap-4">
          <div className="flex-1 min-h-0">
            <TodoList />
          </div>
          <div className="shrink-0">
            <OrderCounter
              count={count}
              setCount={setCount}
              onReset={() => setCount(0)}
            />
          </div>
        </div>
        <div className="col-span-12 md:col-span-4 row-span-2 min-h-[700px]">
          <FormViewer />
        </div>
        <div className="col-span-6 md:col-span-2 row-span-2 min-h-[700px]">
          <GoalGauge count={count} goal={GOAL} />
        </div>

        {/* Row 2 */}
        <div className="col-span-12 md:col-span-3 min-h-[340px]">
          <Notepad />
        </div>

        {/* Row 3 */}
        <div className="col-span-12 md:col-span-3 min-h-[280px]">
          <QuoteBucket quotes={quotes} setQuotes={setQuotes} />
        </div>
        <div className="col-span-12 md:col-span-9 min-h-[280px]">
          <HistoryTable todayCount={count} goal={GOAL} />
        </div>
      </main>

      <footer className="max-w-[1500px] mx-auto mt-6 text-center text-[10px] text-muted-foreground">
        Datos guardados localmente en tu navegador
      </footer>
    </div>
  );
};

export default Index;
