import { useEffect, useState } from "react";
import { Calculator } from "@/components/dashboard/Calculator";
import { Notepad } from "@/components/dashboard/Notepad";
import { SplitOrderCalc } from "@/components/dashboard/SplitOrderCalc";
import { FormViewer } from "@/components/dashboard/FormViewer";
import { OrderCounter } from "@/components/dashboard/OrderCounter";
import { GoalGauge } from "@/components/dashboard/GoalGauge";
import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LayoutDashboard } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const todayKey = () => new Date().toISOString().slice(0, 10);

const Index = () => {
  const GOAL = 70;
  const [count, setCount] = useLocalStorage<number>("ecp.count", 0);
  const [poCount, setPoCount] = useLocalStorage<number>("ecp.count.po", 0);
  const [otherCount, setOtherCount] = useLocalStorage<number>("ecp.count.other", 0);
  const [countDay, setCountDay] = useLocalStorage<string>("ecp.count.day", todayKey());
  const [askType, setAskType] = useState(false);

  useEffect(() => {
    const t = todayKey();
    if (countDay !== t) {
      setCount(0);
      setPoCount(0);
      setOtherCount(0);
      setCountDay(t);
    }
  }, [countDay, setCount, setPoCount, setOtherCount, setCountDay]);

  useEffect(() => {
    document.title = "ECP Data Entry Dashboard";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Panel de control diario para ECP Data Entry: notas, tracker, split orders y meta diaria.");
  }, []);

  const handleSubmitDetected = () => setAskType(true);

  const confirmType = (type: "po" | "other") => {
    setCount(count + 1);
    if (type === "po") setPoCount(poCount + 1);
    else setOtherCount(otherCount + 1);
    setAskType(false);
  };

  const resetAll = () => {
    setCount(0);
    setPoCount(0);
    setOtherCount(0);
  };

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
        <div className="col-span-12 md:col-span-3 row-span-2 min-h-[700px]">
          <Notepad />
        </div>
        <div className="col-span-12 md:col-span-4 row-span-2 min-h-[700px] flex flex-col gap-4">
          <div className="shrink-0">
            <OrderCounter
              count={count}
              setCount={setCount}
              poCount={poCount}
              setPoCount={setPoCount}
              otherCount={otherCount}
              setOtherCount={setOtherCount}
              onReset={resetAll}
            />
          </div>
          <div className="flex-1 min-h-0">
            <FormViewer onSubmitDetected={handleSubmitDetected} />
          </div>
        </div>
        <div className="col-span-6 md:col-span-2 row-span-2 min-h-[700px] flex flex-col gap-4">
          <div className="shrink-0">
            <GoalGauge count={count} goal={GOAL} />
          </div>
          <div className="flex-1 min-h-0">
            <HistoryTable todayCount={count} goal={GOAL} setTodayCount={setCount} />
          </div>
        </div>

        {/* Row 2 */}
        <div className="col-span-12 md:col-span-3 min-h-[340px]">
          <SplitOrderCalc />
        </div>
      </main>

      <footer className="max-w-[1500px] mx-auto mt-6 text-center text-[10px] text-muted-foreground">
        Datos guardados localmente en tu navegador
      </footer>

      <AlertDialog open={askType} onOpenChange={setAskType}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Qué tipo de orden enviaste?</AlertDialogTitle>
            <AlertDialogDescription>
              Detectamos que enviaste el formulario. Selecciona el tipo para sumar al contador correspondiente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-center py-2">
            <Button onClick={() => confirmType("po")} className="flex-1">
              PO regular
            </Button>
            <Button onClick={() => confirmType("other")} variant="secondary" className="flex-1">
              Otro
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>No contar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
