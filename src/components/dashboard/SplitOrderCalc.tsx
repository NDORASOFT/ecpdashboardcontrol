import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Split, ClipboardPaste, RotateCcw, ArrowRight, AlertTriangle, Check } from "lucide-react";

type Cart = {
  subtotal: number;
  tax: number;
  freight: number;
  total: number;
  raw: string;
};

const EMPTY: Cart = { subtotal: 0, tax: 0, freight: 0, total: 0, raw: "" };

// Parse a money number from a string (handles $, commas, spaces)
const num = (s: string): number => {
  const m = s.replace(/[,$\s]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

const parseCart = (raw: string): Cart => {
  const lines = raw.split(/\r?\n/);
  let subtotal = 0, tax = 0, freight = 0, total = 0;
  for (const line of lines) {
    const l = line.toLowerCase();
    if (!l.trim()) continue;
    if (/sub\s*total|subtotal/.test(l)) subtotal = num(line);
    else if (/\btax\b|impuesto/.test(l)) tax = num(line);
    else if (/freight|shipping|env[ií]o|flete/.test(l)) freight = num(line);
    else if (/total/.test(l)) total = num(line);
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
}: {
  label: string;
  cart: Cart;
  onChange: (c: Cart) => void;
  accent: string;
}) => {
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(parseCart(text));
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="bg-secondary/50 rounded-xl p-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full`}
          style={{ background: `hsl(var(--${accent}))` }}
        />
        <span className="text-[11px] font-semibold">{label}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px]"
            onClick={paste}
            title="Pegar desde portapapeles"
          >
            <ClipboardPaste className="h-3 w-3 mr-1" />
            Pegar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px]"
            onClick={() => onChange({ ...EMPTY })}
            title="Limpiar"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <textarea
        value={cart.raw}
        onChange={(e) => onChange(parseCart(e.target.value))}
        placeholder={"Pega aquí el carrito\nSubtotal $...\nTax $...\nFreight $...\nTotal $..."}
        className="w-full resize-none bg-background/60 rounded-lg p-2 text-[11px] outline-none focus:ring-1 focus:ring-accent scrollbar-thin h-20"
      />

      <div className="grid grid-cols-2 gap-1 text-[10px]">
        <div className="flex justify-between bg-background/40 rounded px-1.5 py-0.5">
          <span className="text-muted-foreground">Sub</span>
          <span className="font-mono">{fmt(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between bg-background/40 rounded px-1.5 py-0.5">
          <span className="text-muted-foreground">Tax</span>
          <span className="font-mono">{fmt(cart.tax)}</span>
        </div>
        <div className="flex justify-between bg-background/40 rounded px-1.5 py-0.5">
          <span className="text-muted-foreground">Freight</span>
          <span className="font-mono">{fmt(cart.freight)}</span>
        </div>
        <div className="flex justify-between bg-background/40 rounded px-1.5 py-0.5 font-semibold">
          <span>Total</span>
          <span className="font-mono">{fmt(cart.total)}</span>
        </div>
      </div>
    </div>
  );
};

export const SplitOrderCalc = () => {
  const [original, setOriginal] = useState<Cart>({ ...EMPTY });
  const [splitA, setSplitA] = useState<Cart>({ ...EMPTY });
  const [splitB, setSplitB] = useState<Cart>({ ...EMPTY });

  const sum = useMemo(
    () => ({
      subtotal: round2(splitA.subtotal + splitB.subtotal),
      tax: round2(splitA.tax + splitB.tax),
      freight: round2(splitA.freight + splitB.freight),
      total: round2(splitA.total + splitB.total),
    }),
    [splitA, splitB]
  );

  const diff = useMemo(
    () => ({
      subtotal: round2(sum.subtotal - original.subtotal),
      tax: round2(sum.tax - original.tax),
      freight: round2(sum.freight - original.freight),
      total: round2(sum.total - original.total),
    }),
    [sum, original]
  );

  const hasOriginal = original.total > 0 || original.subtotal > 0;
  const hasSplits = (splitA.total > 0 || splitA.subtotal > 0) && (splitB.total > 0 || splitB.subtotal > 0);
  const showDiff = hasOriginal && hasSplits;

  const Row = ({ label, value }: { label: string; value: number }) => {
    const ok = Math.abs(value) < 0.01;
    return (
      <div
        className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px] ${
          ok ? "bg-mint/10 text-foreground" : "bg-coral/10 text-foreground"
        }`}
      >
        <div className="flex items-center gap-1.5">
          {ok ? (
            <Check className="h-3 w-3 text-mint" />
          ) : (
            <AlertTriangle className="h-3 w-3 text-coral" />
          )}
          <span>{label}</span>
        </div>
        <span className={`font-mono font-semibold ${ok ? "text-mint" : "text-coral"}`}>
          {value > 0 ? "+" : ""}
          {fmt(value)}
        </span>
      </div>
    );
  };

  return (
    <Card className="surface-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-sky text-primary-foreground grid place-items-center">
          <Split className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-xs font-semibold leading-tight truncate">
            Split Order Calculator
          </h3>
          <p className="text-[9px] text-muted-foreground">
            Pega el carrito original y los 2 splits
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2.5 pr-1">
        <CartInput label="Carrito Original" cart={original} onChange={setOriginal} accent="primary" />

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className="flex-1 h-px bg-border/60" />
          <ArrowRight className="h-3 w-3" />
          <span>Splits</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        <CartInput label="Split A" cart={splitA} onChange={setSplitA} accent="sky" />
        <CartInput label="Split B" cart={splitB} onChange={setSplitB} accent="coral" />

        <div className="bg-gradient-charcoal text-primary-foreground rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] opacity-80">
            <span>Suma A + B</span>
            <span className="font-mono">{fmt(sum.total)}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] opacity-80">
            <span>Original</span>
            <span className="font-mono">{fmt(original.total)}</span>
          </div>
          <div className="h-px bg-primary-foreground/20 my-1" />
          {showDiff ? (
            <div className="space-y-1">
              <Row label="Subtotal" value={diff.subtotal} />
              <Row label="Tax" value={diff.tax} />
              <Row label="Freight" value={diff.freight} />
              <Row label="Total" value={diff.total} />
            </div>
          ) : (
            <p className="text-[10px] opacity-70 text-center py-2">
              Pega los 3 carritos para ver diferencias
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
