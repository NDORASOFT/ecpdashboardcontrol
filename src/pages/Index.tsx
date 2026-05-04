import { useEffect, useRef, useState } from "react";
import { Calculator } from "@/components/dashboard/Calculator";
import { Notepad } from "@/components/dashboard/Notepad";
import { SplitOrderCalc } from "@/components/dashboard/SplitOrderCalc";
import { FormViewer, type FormViewerHandle } from "@/components/dashboard/FormViewer";
import { OrderCounter } from "@/components/dashboard/OrderCounter";
import { GoalHistoryToggle } from "@/components/dashboard/GoalHistoryToggle";
import { VendorVault } from "@/components/dashboard/VendorVault";
import { Dialer } from "@/components/dashboard/Dialer";
import { SuggestionDialog } from "@/components/dashboard/SuggestionDialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LayoutDashboard } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SubmissionLog } from "@/components/dashboard/HistoryTable";

const todayKey = () => new Date().toISOString().slice(0, 10);

type OrderType = "PO regular" | "76 Screen" | "Cancel order" | "Other";

const Index = () => {
  const GOAL = 70;
  const [count, setCount] = useLocalStorage<number>("ecp.count", 0);
  const [poCount, setPoCount] = useLocalStorage<number>("ecp.count.po", 0);
  const [otherCount, setOtherCount] = useLocalStorage<number>("ecp.count.other", 0);
  const [countDay, setCountDay] = useLocalStorage<string>("ecp.count.day", todayKey());
  const [submissions, setSubmissions] = useLocalStorage<SubmissionLog[]>("ecp.submissions", []);

  const [askType, setAskType] = useState(false);
  const [draftPO, setDraftPO] = useState("");
  const [draftAmount, setDraftAmount] = useState("");
  const [draftCart, setDraftCart] = useState("");

  const formRef = useRef<FormViewerHandle | null>(null);

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
    if (meta) meta.setAttribute("content", "ECP Data Entry Dashboard: T-Notes, calculadora, split orders, Avaya dialer y vendor vault.");
  }, []);

  const handleSubmitDetected = () => {
    setDraftPO("");
    setDraftAmount("");
    setDraftCart("");
    setAskType(true);
  };

  const confirmType = (type: OrderType) => {
    const amount = parseFloat(draftAmount) || 0;
    setSubmissions([
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        poNumber: draftPO.trim(),
        amount,
        type,
        cart: draftCart.trim() || undefined,
      },
      ...submissions,
    ].slice(0, 500));

    if (type !== "Cancel order") {
      setCount(count + 1);
      if (type === "PO regular") setPoCount(poCount + 1);
      else if (type === "76 Screen") setOtherCount(otherCount + 1);
      else setOtherCount(otherCount + 1);
    }
    setAskType(false);
    // Refresh form back to initial URL after counting
    setTimeout(() => formRef.current?.reload(), 200);
  };

  const skipCount = () => {
    setAskType(false);
    setTimeout(() => formRef.current?.reload(), 200);
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
            <FormViewer ref={formRef} onSubmitDetected={handleSubmitDetected} />
          </div>
        </div>
        <div className="col-span-6 md:col-span-2 row-span-2 min-h-[700px]">
          <GoalHistoryToggle count={count} goal={GOAL} setTodayCount={setCount} />
        </div>

        {/* Row 2 */}
        <div className="col-span-12 md:col-span-3 min-h-[340px]">
          <SplitOrderCalc />
        </div>

        {/* Row 3 — new tools */}
        <div className="col-span-12 md:col-span-4 min-h-[420px] relative">
          <VendorVault />
        </div>
        <div className="col-span-12 md:col-span-3 min-h-[420px]">
          <Dialer />
        </div>
      </main>

      <footer className="max-w-[1500px] mx-auto mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <span>
          Created by W38 Michael Ponce<sup>™</sup>
        </span>
        <span className="hidden sm:inline">·</span>
        <span>Datos guardados localmente en tu navegador</span>
        <span className="hidden sm:inline">·</span>
        <SuggestionDialog />
      </footer>

      <AlertDialog open={askType} onOpenChange={setAskType}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar orden</AlertDialogTitle>
            <AlertDialogDescription>
              Detectamos un Submit. Llena los datos y elige el tipo. Al confirmar, el formulario se refresca al link inicial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-2 py-2">
            <div>
              <label className="text-[10px] text-muted-foreground">PO #</label>
              <Input value={draftPO} onChange={(e) => setDraftPO(e.target.value)} placeholder="PO123456" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Order amount</label>
              <Input
                type="number"
                inputMode="decimal"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-muted-foreground">Cart / nota (opcional)</label>
              <Input value={draftCart} onChange={(e) => setDraftCart(e.target.value)} placeholder="Vendor / detalle" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => confirmType("PO regular")}>PO regular</Button>
            <Button onClick={() => confirmType("76 Screen")} variant="secondary">76 Screen</Button>
            <Button onClick={() => confirmType("Cancel order")} variant="outline">Cancel order</Button>
            <Button onClick={() => confirmType("Other")} variant="ghost">Other</Button>
          </div>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={skipCount}>No contar</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
