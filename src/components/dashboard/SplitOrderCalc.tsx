import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Split,
  ClipboardPaste,
  RotateCcw,
  AlertTriangle,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Scan,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { analyzePaste } from "@/lib/pasteAnalyzer";

type Cart = {
  subtotal: number;
  tax: number;
  freight: number;
  total: number;
  raw: string;
};

const EMPTY: Cart = { subtotal: 0, tax: 0, freight: 0, total: 0, raw: "" };

const num = (s: string): number => {
  const m = s.replace(/[,$\s]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

const parseCart = (raw: string): Cart => {
  const lines = raw.split(/\r?\n/);
  let subtotal = 0, tax = 0, freight = 0, total = 0;
  for (const line of lines) {
    const l = line.toLowerCase().trim();
    if (!l) continue;
    if (/\b(sub\s*t(o(t(a(l)?)?)?)?|subt|sub-?total)\b/.test(l)) {
      subtotal = num(line);
    } else if (/\b(tax|tx|impuesto|iva)\b/.test(l)) {
      tax = num(line);
    } else if (/\b(freight|frt|frgh|shipping|ship|env[ií]o|flete)\b/.test(l)) {
      freight = num(line);
    } else if (/\b(tot(al)?|grand\s*total|order\s*total|amount|tot\b)\b/i.test(l)) {
      total = num(line);
    }
  }
  return { subtotal, tax, freight, total, raw };
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const round2 = (n: number) => Math.round(n * 100) / 100;

const CartInput = ({
  label,
  cart,
  onChange,
  accent,
  showCopyAmount = false,
}: {
  label: string;
  cart: Cart;
  onChange: (c: Cart) => void;
  accent: string;
  showCopyAmount?: boolean;
}) => {
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(parseCart(text));
    } catch { /* ignore */ }
  };
  const copyAmount = async () => {
    try {
      await navigator.clipboard.writeText(cart.total.toFixed(2));
      toast({ title: "Copied", description: `Order amount: $${cart.total.toFixed(2)}` });
    } catch {
      toast({ title: "Error copying", variant: "destructive" });
    }
  };
  return (
    <div className="bg-black border border-yellow-500/40 rounded-xl p-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: `hsl(var(--${accent}))` }} />
        <span className="text-[10px] font-semibold text-yellow-400 font-mono uppercase tracking-wider">{label}</span>
        <div className="ml-auto flex items-center gap-1">
          {showCopyAmount && cart.total > 0 && (
            <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[9px] text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10" onClick={copyAmount} title="Copy order amount">
              <Copy className="h-2.5 w-2.5 mr-0.5" />Amt
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[9px] text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10" onClick={paste} title="Paste from clipboard">
            <ClipboardPaste className="h-2.5 w-2.5 mr-0.5" />Paste
          </Button>
          <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[9px] text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10" onClick={() => onChange({ ...EMPTY })} title="Clear">
            <RotateCcw className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      <textarea
        value={cart.raw}
        onChange={(e) => onChange(parseCart(e.target.value))}
        placeholder="Paste cart here..."
        className="w-full resize-none bg-black border border-yellow-500/30 rounded-lg p-1.5 text-[10px] text-yellow-400 placeholder:text-yellow-700 font-mono outline-none focus:ring-1 focus:ring-yellow-500 scrollbar-thin h-16"
      />

      <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
        {[
          { k: "SUB", v: cart.subtotal },
          { k: "TAX", v: cart.tax },
          { k: "FRT", v: cart.freight },
          { k: "TOT", v: cart.total },
        ].map(({ k, v }) => (
          <div key={k} className={`flex flex-col items-center rounded px-1 py-0.5 ${k === "TOT" ? "bg-yellow-500/10 border border-yellow-500/40" : "bg-yellow-500/5 border border-yellow-500/20"}`}>
            <span className="text-yellow-600">{k}</span>
            <span className={k === "TOT" ? "text-yellow-300 font-semibold" : "text-yellow-400"}>{fmt(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SplitOrderCalc = () => {
  const [original, setOriginal] = useState<Cart>({ ...EMPTY });
  const [splitA, setSplitA] = useState<Cart>({ ...EMPTY });
  const [splitB, setSplitB] = useState<Cart>({ ...EMPTY });
  const [showSplits, setShowSplits] = useState(false);

  // Consume analyzer's cart payload
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ subtotal?: number; tax?: number; freight?: number; total?: number }>;
      const c = ce.detail || {};
      const next: Cart = {
        subtotal: c.subtotal ?? 0,
        tax: c.tax ?? 0,
        freight: c.freight ?? 0,
        total: c.total ?? 0,
        raw: `Subtotal: ${c.subtotal ?? 0}\nTax: ${c.tax ?? 0}\nFreight: ${c.freight ?? 0}\nTotal: ${c.total ?? 0}`,
      };
      setOriginal(next);
    };
    window.addEventListener("ecp:cart-fill", handler as EventListener);
    return () => window.removeEventListener("ecp:cart-fill", handler as EventListener);
  }, []);

  // Notify when split opens (Calculator collapses on this event)
  useEffect(() => {
    if (showSplits) window.dispatchEvent(new CustomEvent("ecp:cart-split-open"));
  }, [showSplits]);

  const sum = useMemo(() => ({
    subtotal: round2(splitA.subtotal + splitB.subtotal),
    tax: round2(splitA.tax + splitB.tax),
    freight: round2(splitA.freight + splitB.freight),
    total: round2(splitA.total + splitB.total),
  }), [splitA, splitB]);

  const diff = useMemo(() => ({
    subtotal: round2(sum.subtotal - original.subtotal),
    tax: round2(sum.tax - original.tax),
    freight: round2(sum.freight - original.freight),
    total: round2(sum.total - original.total),
  }), [sum, original]);

  const hasOriginal = original.total > 0 || original.subtotal > 0;
  const hasSplits = (splitA.total > 0 || splitA.subtotal > 0) && (splitB.total > 0 || splitB.subtotal > 0);
  const showDiff = hasOriginal && hasSplits;
  // Only validate that A+B totals match the main TOT (±$0.01). If not, show which line(s) diverged.
  const totalOk = showDiff && Math.abs(diff.total) < 0.01;
  const taxOk = Math.abs(diff.tax) < 0.01;
  const freightOk = Math.abs(diff.freight) < 0.01;
  const allMatch = showDiff && totalOk && taxOk && freightOk;

  const DivergeRow = ({ label, value }: { label: string; value: number }) => {
    if (Math.abs(value) < 0.01) return null;
    const dir = value > 0 ? "increased" : "decreased";
    return (
      <div className="flex items-center justify-between rounded px-2 py-1 text-[10px] bg-coral/10">
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-coral" />
          <span>{label} {dir} by</span>
        </div>
        <span className="font-mono font-semibold text-coral">
          {value > 0 ? "+" : ""}{fmt(value)}
        </span>
      </div>
    );
  };

  return (
    <Card className="surface-card p-3 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-xl bg-sky text-primary-foreground grid place-items-center">
          <Split className="h-3.5 w-3.5" />
        </div>
        <h3 className="font-display text-xs font-semibold leading-tight truncate">
          {showSplits ? "Split Order" : "Cart"}
        </h3>
        <Button
          size="sm"
          variant={showSplits ? "default" : "secondary"}
          className="ml-auto h-6 rounded-full text-[9px] px-2"
          onClick={() => setShowSplits((s) => !s)}
        >
          {showSplits ? <><ChevronUp className="h-3 w-3 mr-0.5" />Hide</> : <><ChevronDown className="h-3 w-3 mr-0.5" />Split</>}
        </Button>
      </div>

      <div className={`flex-1 overflow-y-auto scrollbar-thin pr-1 ${showSplits ? "grid grid-cols-2 gap-2" : "flex flex-col"}`}>
        <div className={showSplits ? "flex flex-col" : "flex-1 flex flex-col"}>
          <CartInput label="Main Cart" cart={original} onChange={setOriginal} accent="primary" showCopyAmount />
        </div>

        {showSplits && (
          <div className="flex flex-col gap-2">
            <CartInput label="Cart A" cart={splitA} onChange={setSplitA} accent="sky" showCopyAmount />
            <CartInput label="Cart B" cart={splitB} onChange={setSplitB} accent="coral" showCopyAmount />

            {allMatch ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-mint/15 border border-mint/30 p-3">
                <CheckCircle2 className="h-5 w-5 text-mint" />
                <div>
                  <div className="text-sm font-semibold text-mint">Totals Match</div>
                  <div className="text-[10px] text-muted-foreground">All fields confirmed equal</div>
                </div>
              </div>
            ) : showDiff ? (
              <div className="rounded-xl bg-secondary/60 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1">
                  <span>A+B Total: <span className="font-mono">{fmt(sum.total)}</span></span>
                  <span>Main TOT: <span className="font-mono">{fmt(original.total)}</span></span>
                </div>
                {!totalOk && <DivergeRow label="TOTAL" value={diff.total} />}
                <DivergeRow label="Tax" value={diff.tax} />
                <DivergeRow label="Freight" value={diff.freight} />
                {totalOk && taxOk && freightOk && (
                  <div className="text-[10px] text-mint text-center font-mono">All match — confirmed</div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground text-center py-2">
                Paste Main + Cart A + Cart B to compare
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
