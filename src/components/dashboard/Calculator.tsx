import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Percent, Calculator as CalcIcon, Delete, Copy, Check, ChevronDown, ChevronUp, ClipboardPaste } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const Calculator = () => {
  const [discountMode, setDiscountMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [lastOp, setLastOp] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // discount mode state
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");

  const input = (n: string) => {
    if (overwrite || display === "0") {
      setDisplay(n === "." ? "0." : n);
      setOverwrite(false);
    } else {
      if (n === "." && display.includes(".")) return;
      setDisplay(display.length > 14 ? display : display + n);
    }
  };

  const calc = (a: number, b: number, o: string) => {
    switch (o) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? 0 : a / b;
      default: return b;
    }
  };

  const setOperator = (o: string) => {
    const cur = parseFloat(display);
    if (prev !== null && op && !overwrite) {
      const res = calc(prev, cur, op);
      setPrev(res);
      setDisplay(String(+res.toFixed(8)));
    } else {
      setPrev(cur);
    }
    setOp(o);
    setOverwrite(true);
  };

  const equals = () => {
    if (prev === null || !op) return;
    const cur = parseFloat(display);
    const res = calc(prev, cur, op);
    const resStr = String(+res.toFixed(8));
    setLastOp(`${prev} ${op} ${cur} = ${resStr}`);
    setDisplay(resStr);
    setPrev(null);
    setOp(null);
    setOverwrite(true);
  };

  const clearAll = () => {
    setDisplay("0"); setPrev(null); setOp(null); setOverwrite(true);
  };
  const back = () => setDisplay(display.length <= 1 ? "0" : display.slice(0, -1));

  const copyDisplay = async () => {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      toast({ title: "Copied", description: display });
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast({ title: "Error copying", variant: "destructive" });
    }
  };

  const pasteToPrice = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const m = text.replace(/[,$\s]/g, "").match(/\d+(\.\d+)?/);
      if (m) {
        setPrice(m[0]);
        toast({ title: "Pasted", description: `$${m[0]}` });
      }
    } catch { /* ignore */ }
  };

  // Auto-collapse when Cart Split opens
  useEffect(() => {
    const handler = () => setCollapsed(true);
    window.addEventListener("ecp:cart-split-open", handler);
    return () => window.removeEventListener("ecp:cart-split-open", handler);
  }, []);

  useEffect(() => {
    if (discountMode || collapsed) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }

      const k = e.key;
      if (/^[0-9]$/.test(k)) { e.preventDefault(); input(k); return; }
      if (k === ".") { e.preventDefault(); input("."); return; }
      if (k === "+") { e.preventDefault(); setOperator("+"); return; }
      if (k === "-") { e.preventDefault(); setOperator("-"); return; }
      if (k === "*" || k === "x" || k === "X") { e.preventDefault(); setOperator("×"); return; }
      if (k === "/") { e.preventDefault(); setOperator("÷"); return; }
      if (k === "Enter" || k === "=") { e.preventDefault(); equals(); return; }
      if (k === "Backspace") { e.preventDefault(); back(); return; }
      if (k === "Escape") { e.preventDefault(); clearAll(); return; }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountMode, collapsed, display, prev, op, overwrite]);

  const p = parseFloat(price) || 0;
  const d = parseFloat(discount) || 0;
  const saved = +(p * (d / 100)).toFixed(2);
  const final = +(p - saved).toFixed(2);

  const Btn = ({ children, onClick, variant = "ghost", className = "" }: any) => (
    <button
      onClick={onClick}
      className={`h-10 rounded-xl text-sm font-semibold transition-smooth active:scale-95
        ${variant === "op" ? "bg-accent text-accent-foreground hover:brightness-105" :
          variant === "eq" ? "bg-primary text-primary-foreground hover:brightness-110" :
          variant === "fn" ? "bg-secondary text-secondary-foreground hover:bg-muted" :
          "bg-card hover:bg-muted text-foreground border border-border/60"}
        ${className}`}
    >
      {children}
    </button>
  );

  return (
    <Card ref={containerRef as any} className="surface-card p-3 flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-xl bg-primary text-primary-foreground grid place-items-center">
            {discountMode ? <Percent className="h-3.5 w-3.5" /> : <CalcIcon className="h-3.5 w-3.5" />}
          </div>
          <h3 className="font-display text-xs font-semibold leading-tight">
            {discountMode ? "Discount" : "Calculator"}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">%</span>
          <Switch checked={discountMode} onCheckedChange={setDiscountMode} />
          {!discountMode && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="text-muted-foreground hover:text-foreground p-1"
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {discountMode ? (
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground">Price</label>
              <Input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="h-8 text-xs" />
            </div>
            <button onClick={pasteToPrice} className="mt-4 text-muted-foreground hover:text-foreground" title="Paste price from clipboard">
              <ClipboardPaste className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Discount %</label>
            <Input type="number" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className="h-8 text-xs" />
          </div>
          <div className="mt-auto rounded-xl bg-gradient-charcoal text-primary-foreground p-2.5">
            <div className="flex items-center justify-between text-[10px] opacity-80">
              <span>Saved</span><span>${saved.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="text-[10px] opacity-80">Total</span>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-bold">${final.toFixed(2)}</span>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(final.toFixed(2));
                      setCopied(true);
                      window.dispatchEvent(new CustomEvent("ecp:net-price", { detail: { value: final.toFixed(2) } }));
                      toast({ title: "Copied", description: `$${final.toFixed(2)} · Ready for Net Price` });
                      setTimeout(() => setCopied(false), 1200);
                    } catch {
                      toast({ title: "Error copying", variant: "destructive" });
                    }
                  }}
                  className="h-6 w-6 rounded-lg bg-primary-foreground/15 hover:bg-primary-foreground/25 grid place-items-center transition-smooth"
                  title="Copy & send to Net Price"
                >
                  {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="rounded-xl bg-secondary/70 px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0 text-right">
                <div className="text-[9px] text-muted-foreground h-3">
                  {prev !== null ? `${prev} ${op ?? ""}` : ""}
                </div>
                <div className="font-display text-xl font-bold tracking-tight truncate">{display}</div>
              </div>
              <button
                onClick={copyDisplay}
                className="shrink-0 mt-1 h-6 w-6 rounded-lg bg-background/60 hover:bg-background grid place-items-center transition-smooth"
                title="Copy result"
              >
                {copied ? <Check className="h-3 w-3 text-mint" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
              </button>
            </div>
            {!collapsed && (
              <div className="mt-1 pt-1 border-t border-border/40 text-right text-[9px] text-muted-foreground font-mono truncate min-h-[12px]">
                {lastOp || "—"}
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="grid grid-cols-4 gap-1">
              <Btn variant="fn" onClick={clearAll}>AC</Btn>
              <Btn variant="fn" onClick={back}><Delete className="h-3.5 w-3.5 mx-auto" /></Btn>
              <Btn variant="fn" onClick={() => setDisplay(String(parseFloat(display) / 100))}>%</Btn>
              <Btn variant="op" onClick={() => setOperator("÷")}>÷</Btn>

              {["7","8","9"].map(n => <Btn key={n} onClick={() => input(n)}>{n}</Btn>)}
              <Btn variant="op" onClick={() => setOperator("×")}>×</Btn>

              {["4","5","6"].map(n => <Btn key={n} onClick={() => input(n)}>{n}</Btn>)}
              <Btn variant="op" onClick={() => setOperator("-")}>−</Btn>

              {["1","2","3"].map(n => <Btn key={n} onClick={() => input(n)}>{n}</Btn>)}
              <Btn variant="op" onClick={() => setOperator("+")}>+</Btn>

              <Btn className="col-span-2" onClick={() => input("0")}>0</Btn>
              <Btn onClick={() => input(".")}>.</Btn>
              <Btn variant="eq" onClick={equals}>=</Btn>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
