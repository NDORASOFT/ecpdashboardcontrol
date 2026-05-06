import { useMemo, useState } from "react";
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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { upsertOrder } from "@/lib/orders";

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
  let subtotal = 0,
    tax = 0,
    freight = 0,
    total = 0;
  for (const line of lines) {
    const l = line.toLowerCase().trim();
    if (!l) continue;
    // Order matters: check subtotal before total (since "subtotal" contains "total")
    if (/\b(sub\s*t(o(t(a(l)?)?)?)?|subt|sub-?total)\b/.test(l)) {
      subtotal = num(line);
    } else if (/\b(tax|tx|impuesto|iva)\b/.test(l)) {
      tax = num(line);
    } else if (/\b(freight|frt|frgh|shipping|ship|env[ií]o|flete)\b/.test(l)) {
      freight = num(line);
    } else if (/\b(tot(a(l)?)?|grand\s*total|order\s*total|amount)\b/.test(l)) {
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
    } catch {
      /* ignore */
    }
  };
  const copyAmount = async () => {
    try {
      await navigator.clipboard.writeText(cart.total.toFixed(2));
      // Try to attach to currently active PO from Notepad sidebar
      try {
        const raw = localStorage.getItem("ecp.tnotes.activePO");
        const po = raw ? JSON.parse(raw) : "";
        if (po && typeof po === "string") {
          upsertOrder(po, {
            amount: cart.total,
            cart: {
              label: (label.toLowerCase().includes("a")
                ? "a"
                : label.toLowerCase().includes("b")
                ? "b"
                : "main") as "a" | "b" | "main",
              subtotal: cart.subtotal,
              tax: cart.tax,
              freight: cart.freight,
              total: cart.total,
            },
          });
        }
      } catch {
        /* noop */
      }
      toast({ title: "Copiado", description: `Order amount: $${cart.total.toFixed(2)}` });
    } catch {
      toast({ title: "Error al copiar", variant: "destructive" });
    }
  };
  return (
    <div className="bg-black border border-yellow-500/40 rounded-xl p-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: `hsl(var(--${accent}))` }}
        />
        <span className="text-[11px] font-semibold text-yellow-400 font-mono uppercase tracking-wider">{label}</span>
        <div className="ml-auto flex items-center gap-1">
          {showCopyAmount && cart.total > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px] text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
              onClick={copyAmount}
              title="Copiar order amount"
            >
              <Copy className="h-3 w-3 mr-1" />
              Amount
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
            onClick={paste}
            title="Pegar desde portapapeles"
          >
            <ClipboardPaste className="h-3 w-3 mr-1" />
            Pegar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
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
        className="w-full resize-none bg-black border border-yellow-500/30 rounded-lg p-2 text-[11px] text-yellow-400 placeholder:text-yellow-700 font-mono outline-none focus:ring-1 focus:ring-yellow-500 scrollbar-thin h-20"
      />

      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
        <div className="flex justify-between bg-yellow-500/5 border border-yellow-500/20 rounded px-1.5 py-0.5">
          <span className="text-yellow-600">SUB</span>
          <span className="text-yellow-400">{fmt(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between bg-yellow-500/5 border border-yellow-500/20 rounded px-1.5 py-0.5">
          <span className="text-yellow-600">TAX</span>
          <span className="text-yellow-400">{fmt(cart.tax)}</span>
        </div>
        <div className="flex justify-between bg-yellow-500/5 border border-yellow-500/20 rounded px-1.5 py-0.5">
          <span className="text-yellow-600">FRT</span>
          <span className="text-yellow-400">{fmt(cart.freight)}</span>
        </div>
        <div className="flex justify-between bg-yellow-500/10 border border-yellow-500/40 rounded px-1.5 py-0.5 font-semibold">
          <span className="text-yellow-300">TOT</span>
          <span className="text-yellow-300">{fmt(cart.total)}</span>
        </div>
      </div>
    </div>
  );
};

export const SplitOrderCalc = () => {
  const [original, setOriginal] = useState<Cart>({ ...EMPTY });
  const [splitA, setSplitA] = useState<Cart>({ ...EMPTY });
  const [splitB, setSplitB] = useState<Cart>({ ...EMPTY });
  const [showSplits, setShowSplits] = useState(false);

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
  const hasSplits =
    (splitA.total > 0 || splitA.subtotal > 0) &&
    (splitB.total > 0 || splitB.subtotal > 0);
  const showDiff = hasOriginal && hasSplits;

  const Row = ({ label, value }: { label: string; value: number }) => {
    const ok = Math.abs(value) < 0.01;
    const direction = value > 0 ? "incrementó" : value < 0 ? "disminuyó" : "match";
    return (
      <div
        className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px] ${
          ok ? "bg-mint/10" : "bg-coral/10"
        }`}
      >
        <div className="flex items-center gap-1.5">
          {ok ? (
            <Check className="h-3 w-3 text-mint" />
          ) : (
            <AlertTriangle className="h-3 w-3 text-coral" />
          )}
          <span>
            {label} {ok ? "match" : direction}
          </span>
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
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xs font-semibold leading-tight truncate">
            {showSplits ? "Split Order Calculator" : "Cart"}
          </h3>
          <p className="text-[9px] text-muted-foreground">
            {showSplits ? "Main + Split A + Split B" : "Solo Main Cart · activa split para comparar"}
          </p>
        </div>
        <Button
          size="sm"
          variant={showSplits ? "default" : "secondary"}
          className="h-7 rounded-full text-[10px] px-2.5"
          onClick={() => setShowSplits((s) => !s)}
        >
          {showSplits ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" /> Ocultar splits
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" /> Split
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2.5 pr-1">
        <CartInput
          label="Main Cart"
          cart={original}
          onChange={setOriginal}
          accent="primary"
          showCopyAmount
        />

        {showSplits && (
          <>
            <CartInput
              label="Cart A"
              cart={splitA}
              onChange={setSplitA}
              accent="sky"
              showCopyAmount
            />
            <CartInput
              label="Cart B"
              cart={splitB}
              onChange={setSplitB}
              accent="coral"
              showCopyAmount
            />

            <div className="bg-gradient-charcoal text-primary-foreground rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] opacity-80">
                <span>Suma A + B</span>
                <span className="font-mono">{fmt(sum.total)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] opacity-80">
                <span>Main Cart</span>
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
                  Pega Main + Cart A + Cart B para comparar
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
