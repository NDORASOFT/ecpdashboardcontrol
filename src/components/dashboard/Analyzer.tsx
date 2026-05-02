import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, ClipboardPaste, ArrowRight, Trash2 } from "lucide-react";
import { analyzePaste, type ParsedPaste, formatMoney } from "@/lib/pasteAnalyzer";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "@/hooks/use-toast";

type Routed = { field: string; value: string; target: "PO#" | "T-Note" | "Cart" | "Tracker" | "Header" };

const route = (p: ParsedPaste): Routed[] => {
  const out: Routed[] = [];
  if (p.poNumber) out.push({ field: "PO#", value: p.poNumber, target: "PO#" });
  if (p.custNumber) out.push({ field: "Cust#", value: p.custNumber, target: "Header" });
  if (p.custPo) out.push({ field: "Cust PO", value: p.custPo, target: "Header" });
  if (p.contact) out.push({ field: "Contact", value: p.contact, target: "Header" });
  if (p.shipTo) out.push({ field: "Ship To", value: p.shipTo, target: "Header" });
  if (p.mailTo) out.push({ field: "Mail To", value: p.mailTo, target: "Header" });
  if (p.lineCount != null) out.push({ field: "Lines", value: String(p.lineCount), target: "Header" });
  if (p.vendorItem) out.push({ field: "Vendor Item", value: p.vendorItem, target: "T-Note" });
  if (p.netPrice != null) out.push({ field: "Net Price", value: formatMoney(p.netPrice), target: "T-Note" });
  if (p.leadTime) out.push({ field: "Lead Time", value: p.leadTime, target: "T-Note" });
  if (p.shipFrom) out.push({ field: "Ship From", value: p.shipFrom, target: "T-Note" });
  if (p.dsFee != null) out.push({ field: "DS Fee", value: formatMoney(p.dsFee), target: "T-Note" });
  if (p.minFee != null) out.push({ field: "Min Fee", value: formatMoney(p.minFee), target: "T-Note" });
  if (p.restockFee != null) out.push({ field: "Restock", value: formatMoney(p.restockFee), target: "T-Note" });
  if (p.senderName) out.push({ field: "From", value: p.senderName, target: "T-Note" });
  if (p.cart?.total != null) out.push({ field: "Cart TOT", value: formatMoney(p.cart.total), target: "Cart" });
  if (p.cart?.subtotal != null) out.push({ field: "SUB", value: formatMoney(p.cart.subtotal), target: "Cart" });
  if (p.cart?.tax != null) out.push({ field: "TAX", value: formatMoney(p.cart.tax), target: "Cart" });
  if (p.cart?.freight != null) out.push({ field: "FRT", value: formatMoney(p.cart.freight), target: "Cart" });
  if (p.orderAmount != null) out.push({ field: "Order Amt", value: formatMoney(p.orderAmount), target: "Tracker" });
  if (p.hasBO) out.push({ field: "B/O", value: "yes", target: "Header" });
  if (p.hasDS) out.push({ field: "DS", value: "yes", target: "Header" });
  return out;
};

export const Analyzer = () => {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedPaste | null>(null);
  const [, setActivePO] = useLocalStorage<string>("ecp.activePO", "");
  const [, setLastOrderAmount] = useLocalStorage<string>("ecp.lastOrderAmount", "");
  const [, setLastHeader] = useLocalStorage<Record<string, string>>("ecp.lastHeader", {});

  const run = (raw: string) => {
    const p = analyzePaste(raw);
    setParsed(p);

    // Route to localStorage / events
    if (p.poNumber) setActivePO(p.poNumber);
    if (p.orderAmount != null) setLastOrderAmount(p.orderAmount.toFixed(2));
    else if (p.cart?.total != null) setLastOrderAmount(p.cart.total.toFixed(2));

    const header: Record<string, string> = {};
    if (p.custNumber) header.custNumber = p.custNumber;
    if (p.custPo) header.custPo = p.custPo;
    if (p.contact) header.contact = p.contact;
    if (p.shipTo) header.shipTo = p.shipTo;
    if (p.mailTo) header.mailTo = p.mailTo;
    if (p.lineCount != null) header.lineCount = String(p.lineCount);
    if (Object.keys(header).length) setLastHeader(header);

    // Dispatch a global event so Notepad / Cart / Tracker can react
    window.dispatchEvent(new CustomEvent("ecp:analyzed", { detail: p }));
    if (p.cart) {
      window.dispatchEvent(new CustomEvent("ecp:cart-fill", { detail: p.cart }));
    }
    const found = route(p).length;
    toast({
      title: found > 0 ? "Analyzed" : "Nothing detected",
      description: found > 0 ? `${found} field${found !== 1 ? "s" : ""} routed` : "Try pasting an AS400 header, email quote, or cart",
    });
  };

  const pasteFromClipboard = async () => {
    try {
      const t = await navigator.clipboard.readText();
      setText(t);
      run(t);
    } catch {
      toast({ title: "Cannot read clipboard", variant: "destructive" });
    }
  };

  const routed = parsed ? route(parsed) : [];

  return (
    <Card className="surface-card p-3 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-xl bg-accent text-accent-foreground grid place-items-center">
          <ScanLine className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xs font-semibold leading-tight">Analyzer</h3>
          <p className="text-[9px] text-muted-foreground">Paste AS400 header / email / cart → auto-route</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 rounded-full text-[10px] px-2"
          onClick={pasteFromClipboard}
          title="Read clipboard"
        >
          <ClipboardPaste className="h-3 w-3 mr-1" /> Paste
        </Button>
        <Button
          size="sm"
          className="h-7 rounded-full text-[10px] px-2"
          onClick={() => run(text)}
          disabled={!text.trim()}
        >
          <ScanLine className="h-3 w-3 mr-1" /> Analyze
        </Button>
        {(text || parsed) && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => { setText(""); setParsed(null); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Pega aquí: AS400 header, email del vendor, carrito MSC, quote..."
        className="w-full h-24 resize-none bg-secondary/50 rounded-xl p-2 text-[11px] font-mono outline-none focus:ring-2 focus:ring-accent/40 scrollbar-thin"
      />

      <div className="flex-1 mt-2 overflow-y-auto scrollbar-thin">
        {routed.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            {parsed ? "Nada detectado" : "Listo para analizar"}
          </p>
        ) : (
          <div className="space-y-1">
            {routed.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-md bg-secondary/40 px-2 py-1 text-[10px]">
                <span className="text-muted-foreground font-mono w-16 shrink-0 truncate">{r.field}</span>
                <span className="font-mono font-semibold flex-1 min-w-0 truncate">{r.value}</span>
                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono shrink-0 ${
                  r.target === "T-Note" ? "bg-yellow-500/20 text-yellow-300" :
                  r.target === "Cart" ? "bg-sky/20 text-sky" :
                  r.target === "PO#" ? "bg-mint/20 text-mint" :
                  r.target === "Tracker" ? "bg-primary/20 text-primary" :
                  "bg-muted text-muted-foreground"
                }`}>{r.target}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
