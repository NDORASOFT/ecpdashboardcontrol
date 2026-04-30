import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Percent, Calculator as CalcIcon, Delete, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const Calculator = () => {
  const [discountMode, setDiscountMode] = useState(false);
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
      toast({ title: "Copiado", description: display });
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast({ title: "Error al copiar", variant: "destructive" });
    }
  };

  // Keyboard support — only when calculator card is focused/hovered (not in discount mode)
  useEffect(() => {
    if (discountMode) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Ignore when typing in any input/textarea/contenteditable elsewhere
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
  }, [discountMode, display, prev, op, overwrite]);

  const p = parseFloat(price) || 0;
  const d = parseFloat(discount) || 0;
  const saved = +(p * (d / 100)).toFixed(2);
  const final = +(p - saved).toFixed(2);

  const Btn = ({ children, onClick, variant = "ghost", className = "" }: any) => (
    <button
      onClick={onClick}
      className={`h-11 rounded-xl text-sm font-semibold transition-smooth active:scale-95
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
    <Card ref={containerRef as any} className="surface-card p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground grid place-items-center">
            {discountMode ? <Percent className="h-4 w-4" /> : <CalcIcon className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="font-display text-xs font-semibold leading-tight">
              {discountMode ? "Descuento" : "Calculadora"}
            </h3>
            <p className="text-[9px] text-muted-foreground">
              {discountMode ? "Calcula precio final" : "Teclado activo · Enter = ="}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">%</span>
          <Switch checked={discountMode} onCheckedChange={setDiscountMode} />
        </div>
      </div>

      {discountMode ? (
        <div className="flex flex-col gap-3 flex-1">
          <div>
            <label className="text-[11px] text-muted-foreground">Precio</label>
            <Input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">Descuento %</label>
            <Input type="number" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
          </div>
          <div className="mt-auto rounded-2xl bg-gradient-charcoal text-primary-foreground p-3">
            <div className="flex items-center justify-between text-[11px] opacity-80">
              <span>Ahorras</span><span>${saved.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="text-[11px] opacity-80">Total</span>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-bold">${final.toFixed(2)}</span>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(final.toFixed(2));
                      setCopied(true);
                      toast({ title: "Copiado", description: `$${final.toFixed(2)}` });
                      setTimeout(() => setCopied(false), 1200);
                    } catch {
                      toast({ title: "Error al copiar", variant: "destructive" });
                    }
                  }}
                  className="h-7 w-7 rounded-lg bg-primary-foreground/15 hover:bg-primary-foreground/25 grid place-items-center transition-smooth"
                  aria-label="Copiar total con descuento"
                  title="Copiar total con descuento"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1">
          <div className="rounded-2xl bg-secondary/70 px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0 text-right">
                <div className="text-[10px] text-muted-foreground h-3">
                  {prev !== null ? `${prev} ${op ?? ""}` : ""}
                </div>
                <div className="font-display text-2xl font-bold tracking-tight truncate">{display}</div>
              </div>
              <button
                onClick={copyDisplay}
                className="shrink-0 mt-1 h-7 w-7 rounded-lg bg-background/60 hover:bg-background grid place-items-center transition-smooth"
                aria-label="Copiar resultado"
                title="Copiar resultado"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </div>
            <div className="mt-1 pt-1 border-t border-border/40 text-right text-[10px] text-muted-foreground font-mono truncate min-h-[14px]">
              {lastOp || "—"}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <Btn variant="fn" onClick={clearAll}>AC</Btn>
            <Btn variant="fn" onClick={back}><Delete className="h-4 w-4 mx-auto" /></Btn>
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
        </div>
      )}
    </Card>
  );
};
