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
        poNumber: draftPO.trim().toUpperCase(),
        amount,
        type,
        cart: draftCart.trim() || undefined,
      },
      ...submissions,
    ].slice(0, 500));

    if (type !== "Cancel order") {
      setCount(count + 1);
      if (type === "PO regular") setPoCount(poCount + 1);
      else setOtherCount(otherCount + 1);
    }
    setAskType(false);
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
    <div className="min-h-screen w-full px-3 sm:px-5 lg:px-6 py-4">
      <header className="max-w-[1500px] mx-auto mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-charcoal text-primary-foreground grid place-items-center shadow-soft">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold leading-tight">
            ECP Data Entry Dashboard
          </h1>
          <p className="text-[10px] text-muted-foreground">
            PO#-centric order tracking
          </p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2 surface-card px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-mint animate-pulse-soft" />
          <span className="text-[10px] text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto grid grid-cols-12 gap-3 auto-rows-[minmax(0,_auto)]">
        {/* Col 1: Counter + Calculator + Cart */}
        <div className="col-span-12 md:col-span-2 flex flex-col gap-3">
          <OrderCounter
            count={count} setCount={setCount}
            poCount={poCount} setPoCount={setPoCount}
            otherCount={otherCount} setOtherCount={setOtherCount}
            onReset={resetAll}
          />
          <Calculator />
          <SplitOrderCalc />
        </div>

        {/* Col 2: PO# Notes (tall) */}
        <div className="col-span-12 md:col-span-4 min-h-[600px]">
          <Notepad />
        </div>

        {/* Col 3: Form Viewer (tall) */}
        <div className="col-span-12 md:col-span-4 min-h-[600px]">
          <FormViewer ref={formRef} onSubmitDetected={handleSubmitDetected} />
        </div>

        {/* Col 4: Goal + History */}
        <div className="col-span-12 md:col-span-2 min-h-[600px]">
          <GoalHistoryToggle count={count} goal={GOAL} setTodayCount={setCount} />
        </div>

        {/* Bottom row */}
        <div className="col-span-12 md:col-span-5 min-h-[350px]">
          <VendorVault />
        </div>
        <div className="col-span-12 md:col-span-3 min-h-[350px]">
          <Dialer />
        </div>
      </main>

      <footer className="max-w-[1500px] mx-auto mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-[9px] text-muted-foreground">
        <span>Created by W38 Michael Ponce<sup>™</sup></span>
        <span className="hidden sm:inline">·</span>
        <span>Saved locally</span>
        <span className="hidden sm:inline">·</span>
        <SuggestionDialog />
      </footer>

      {/* Compact order entry modal */}
      <AlertDialog open={askType} onOpenChange={setAskType}>
        <AlertDialogContent className="max-w-sm p-4">
          <AlertDialogHeader className="pb-1">
            <AlertDialogTitle className="text-sm">Log Order</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="grid grid-cols-3 gap-2 py-1">
            <div>
              <label className="text-[9px] text-muted-foreground">PO#</label>
              <Input value={draftPO} onChange={(e) => setDraftPO(e.target.value)} placeholder="PO#" className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Amount</label>
              <Input type="number" inputMode="decimal" value={draftAmount} onChange={(e) => setDraftAmount(e.target.value)} placeholder="0.00" className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Cart</label>
              <Input value={draftCart} onChange={(e) => setDraftCart(e.target.value)} placeholder="Note" className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <Button size="sm" className="h-7 text-xs flex-1" onClick={() => confirmType("PO regular")}>PO</Button>
            <Button size="sm" variant="secondary" className="h-7 text-xs flex-1" onClick={() => confirmType("76 Screen")}>76 Scr</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => confirmType("Cancel order")}>Cancel</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={() => confirmType("Other")}>Other</Button>
          </div>
          <AlertDialogFooter className="pt-1">
            <button onClick={skipCount} className="text-[10px] text-muted-foreground hover:text-foreground">Skip counting</button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
