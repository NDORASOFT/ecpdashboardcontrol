import { useEffect, useRef, useState } from "react";
import { Calculator } from "@/components/dashboard/Calculator";
import { Notepad } from "@/components/dashboard/Notepad";
import { SplitOrderCalc } from "@/components/dashboard/SplitOrderCalc";
import { FormViewer, type FormViewerHandle } from "@/components/dashboard/FormViewer";

import { GoalHistoryToggle } from "@/components/dashboard/GoalHistoryToggle";
import { VendorVault } from "@/components/dashboard/VendorVault";
import { Analyzer } from "@/components/dashboard/Analyzer";
import { Podium } from "@/components/dashboard/Podium";
import { SuggestionDialog } from "@/components/dashboard/SuggestionDialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LayoutDashboard } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SubmissionLog } from "@/components/dashboard/HistoryTable";

const todayKey = () => new Date().toISOString().slice(0, 10);
const isoWeek = (d = new Date()) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

type OrderType = "PO regular" | "76 Screen" | "UNA Single" | "UNA Double" | "UNC" | "Cancel order" | "Fraud" | "Machinery" | "Other";

const TYPE_PILLS: { key: OrderType; label: string; tone: string }[] = [
  { key: "PO regular", label: "PO", tone: "default" },
  { key: "76 Screen", label: "76", tone: "secondary" },
  { key: "UNA Single", label: "UNA-S", tone: "secondary" },
  { key: "UNA Double", label: "UNA-D", tone: "secondary" },
  { key: "UNC", label: "UNC", tone: "secondary" },
  { key: "Machinery", label: "Mach", tone: "outline" },
  { key: "Cancel order", label: "Cancel", tone: "outline" },
  { key: "Fraud", label: "Fraud", tone: "destructive" },
  { key: "Other", label: "Other", tone: "ghost" },
];

const useEstClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
  return fmt.format(now);
};

const Index = () => {
  const GOAL = 70;
  const [count, setCount] = useLocalStorage<number>("ecp.count", 0);
  const [poCount, setPoCount] = useLocalStorage<number>("ecp.count.po", 0);
  const [otherCount, setOtherCount] = useLocalStorage<number>("ecp.count.other", 0);
  const [countDay, setCountDay] = useLocalStorage<string>("ecp.count.day", todayKey());
  const [submissions, setSubmissions] = useLocalStorage<SubmissionLog[]>("ecp.submissions", []);
  const [sa] = useLocalStorage<string>("ecp.sa", "");
  const [activePO] = useLocalStorage<string>("ecp.activePO", "");
  const [lastOrderAmount] = useLocalStorage<string>("ecp.lastOrderAmount", "");

  const [askType, setAskType] = useState(false);
  const [draftPO, setDraftPO] = useState("");
  const [draftAmount, setDraftAmount] = useState("");
  const [fraudReason, setFraudReason] = useState("");
  const [fraudCredit, setFraudCredit] = useState<"yes" | "no" | "">("");
  const [showFraud, setShowFraud] = useState(false);

  const formRef = useRef<FormViewerHandle | null>(null);
  const estLabel = useEstClock();

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
    setDraftPO(activePO || "");
    setDraftAmount(lastOrderAmount || "");
    setShowFraud(false);
    setFraudReason("");
    setFraudCredit("");
    setAskType(true);
  };

  const confirmType = (type: OrderType) => {
    if (type === "Fraud" && !showFraud) {
      setShowFraud(true);
      return;
    }
    const amount = parseFloat(draftAmount) || 0;
    setSubmissions([
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        poNumber: draftPO.trim().toUpperCase(),
        amount,
        type: type === "Fraud" || type === "UNA Single" || type === "UNA Double" || type === "UNC" || type === "Machinery"
          ? "Other"
          : type as SubmissionLog["type"],
        cart: type === "Fraud" ? `FRAUD: ${fraudReason} | credit:${fraudCredit}` : undefined,
      },
      ...submissions,
    ].slice(0, 500));

    if (type !== "Cancel order") {
      setCount(count + 1);
      if (type === "PO regular") setPoCount(poCount + 1);
      else setOtherCount(otherCount + 1);
    }
    setAskType(false);
    setShowFraud(false);
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
      <header className="max-w-[1500px] mx-auto mb-4 flex items-center gap-3 flex-wrap">
        <div className="h-10 w-10 rounded-2xl bg-gradient-charcoal text-primary-foreground grid place-items-center shadow-soft">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold leading-tight">
            {sa ? <>Hola! <span className="text-accent">{sa}</span> · </> : null}
            ECP Data Entry Dashboard
          </h1>
          <p className="text-[10px] text-muted-foreground">PO#-centric · W38 control by Michael Ponce™</p>
        </div>
        <div className="ml-auto flex items-center gap-2 surface-card px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-mint animate-pulse-soft" />
          <span className="text-[10px] text-muted-foreground font-mono">{estLabel} EST</span>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto flex flex-wrap gap-3 items-start">
        {/* Col 1: PO# Notes — only column allowed to grow vertically */}
        <div className="w-full md:w-[24rem] md:flex-shrink-0 min-h-[600px] flex">
          <Notepad />
        </div>

        {/* Col 2: Calculator + Cart — fixed width, hugs content */}
        <div className="w-full md:w-[13.5rem] md:flex-shrink-0 self-start flex flex-col gap-3">
          <Calculator />
          <SplitOrderCalc />
        </div>

        {/* Col 3: Order Tracker (Counter merged into FormViewer) */}
        <div className="w-full md:w-[22rem] md:flex-shrink-0 self-start min-h-[560px] flex">
          <FormViewer
            ref={formRef}
            onSubmitDetected={handleSubmitDetected}
            count={count} setCount={setCount}
            poCount={poCount} setPoCount={setPoCount}
            otherCount={otherCount} setOtherCount={setOtherCount}
            onResetCounter={resetAll}
          />
        </div>

        {/* Col 4: Goal + Podium — fixed width, hugs content */}
        <div className="w-full md:w-[13rem] md:flex-shrink-0 self-start flex flex-col gap-3">
          <GoalHistoryToggle count={count} goal={GOAL} setTodayCount={setCount} />
          <Podium />
        </div>

        {/* Bottom row: VendorVault + Analyzer */}
        <div className="w-full md:flex-1 md:min-w-[28rem] min-h-[350px]">
          <VendorVault />
        </div>
        <div className="w-full md:w-[22rem] md:flex-shrink-0 min-h-[350px]">
          <Analyzer />
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
        <AlertDialogContent className="max-w-md p-3.5">
          <AlertDialogHeader className="pb-1">
            <AlertDialogTitle className="text-sm">Log Order {sa && <span className="text-[10px] text-muted-foreground font-normal">· {sa}</span>}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-2 py-1">
            <div>
              <label className="text-[9px] text-muted-foreground">PO#</label>
              <Input
                value={draftPO}
                onChange={(e) => setDraftPO(e.target.value)}
                onBlur={(e) => setDraftPO(e.target.value.toUpperCase())}
                placeholder="PO#"
                className="h-8 text-xs font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Order Amount</label>
              <Input
                type="number"
                inputMode="decimal"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                placeholder="0.00"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {!showFraud ? (
            <div className="grid grid-cols-3 gap-1 pt-1">
              {TYPE_PILLS.map((p) => (
                <Button
                  key={p.key}
                  size="sm"
                  variant={p.tone === "default" ? "default" : p.tone === "destructive" ? "destructive" : p.tone === "outline" ? "outline" : p.tone === "ghost" ? "ghost" : "secondary"}
                  className="h-7 text-[10px] px-1"
                  onClick={() => confirmType(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-2 pt-1 border-t border-border/40">
              <div>
                <label className="text-[9px] text-muted-foreground">Fraud reason</label>
                <select
                  value={fraudReason}
                  onChange={(e) => setFraudReason(e.target.value)}
                  className="w-full h-8 rounded-md bg-secondary border border-border px-2 text-xs"
                >
                  <option value="">Select reason...</option>
                  <option value="High-value">High-value order</option>
                  <option value="New customer">New customer</option>
                  <option value="Mismatch ship/bill">Ship/Bill mismatch</option>
                  <option value="Suspicious">Suspicious pattern</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground">Went to credit?</span>
                {(["yes", "no"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFraudCredit(opt)}
                    className={`px-2 py-0.5 rounded-full text-[10px] ${fraudCredit === opt ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                  >
                    {opt.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 text-[10px] flex-1" onClick={() => setShowFraud(false)}>
                  ← Back
                </Button>
                <Button size="sm" variant="destructive" className="h-7 text-[10px] flex-1" onClick={() => confirmType("Fraud")} disabled={!fraudReason}>
                  Submit Fraud
                </Button>
              </div>
            </div>
          )}

          <div className="pt-1.5 flex items-center justify-end">
            <button onClick={skipCount} className="text-[10px] text-muted-foreground hover:text-foreground">
              Skip counting
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
