import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClipboardList, ExternalLink, RefreshCw, Pencil, Trash2, Zap, ZapOff, Plus, Minus, RotateCcw, Hash, ListOrdered, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { OrdersView } from "./OrdersView";

type Stage = "viewform" | "thank-you";

export const Tracker = ({
  count,
  setCount,
  poCount,
  setPoCount,
  otherCount,
  setOtherCount,
  onReset,
  onSubmitDetected,
}: {
  count: number;
  setCount: (n: number) => void;
  poCount: number;
  setPoCount: (n: number) => void;
  otherCount: number;
  setOtherCount: (n: number) => void;
  onReset: () => void;
  onSubmitDetected?: () => void;
}) => {
  const [url, setUrl] = useLocalStorage<string>("ecp.formUrl", "");
  const [autoDetect, setAutoDetect] = useLocalStorage<boolean>("ecp.formAutoDetect", true);
  const [view, setView] = useLocalStorage<"form" | "orders">("ecp.tracker.view", "form");
  const [draft, setDraft] = useState(url);
  const [key, setKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const [stage, setStage] = useState<Stage>("viewform");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const loadCountRef = useRef(0);
  const lastLoadRef = useRef(0);
  const lastCountedAtRef = useRef(0);
  const focusedSinceLoadRef = useRef(false);

  const toEmbed = (u: string) => {
    if (!u) return "";
    if (u.includes("docs.google.com/forms") && !u.includes("embedded=true")) {
      const sep = u.includes("?") ? "&" : "?";
      return `${u}${sep}embedded=true`;
    }
    return u;
  };

  // Track iframe focus between loads
  useEffect(() => {
    if (!url) return;
    const interval = setInterval(() => {
      if (document.activeElement === iframeRef.current) {
        focusedSinceLoadRef.current = true;
      }
    }, 400);
    return () => clearInterval(interval);
  }, [url, key]);

  const handleIframeLoad = () => {
    const now = Date.now();
    loadCountRef.current += 1;
    const n = loadCountRef.current;
    const dt = now - lastLoadRef.current;
    lastLoadRef.current = now;

    if (!autoDetect) return;
    if (n === 1) return; // initial load (viewform)
    if (dt < 1500 || dt > 5 * 60 * 1000) {
      focusedSinceLoadRef.current = false;
      return;
    }
    if (!focusedSinceLoadRef.current) return;
    focusedSinceLoadRef.current = false;

    // Cooldown: never count twice within 8s (avoids the "submit another response" reload)
    if (now - lastCountedAtRef.current < 8000) {
      setStage("viewform");
      return;
    }

    // First qualifying load after focus = thank-you page → count once
    setStage("thank-you");
    lastCountedAtRef.current = now;
    onSubmitDetected?.();

    // After a short delay, assume we're back on viewform for next cycle
    setTimeout(() => setStage("viewform"), 4000);
  };

  const manualReload = () => {
    loadCountRef.current = 0;
    lastLoadRef.current = 0;
    lastCountedAtRef.current = 0;
    focusedSinceLoadRef.current = false;
    setStage("viewform");
    setKey((k) => k + 1);
  };

  const stageLabel = stage;

  return (
    <Card className="surface-card p-4 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-mint text-primary-foreground grid place-items-center">
          <Hash className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-xs font-semibold leading-tight">Tracker</h3>
          <p className="text-[9px] text-muted-foreground truncate">
            {view === "form" ? "Auto-cuenta cada submit · Hoy" : "Sub-dashboard de PO's"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 bg-secondary rounded-full p-0.5">
          <button
            onClick={() => setView("form")}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-smooth ${
              view === "form" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Vista Form"
          >
            <FileText className="h-3 w-3" />
            Form
          </button>
          <button
            onClick={() => setView("orders")}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-smooth ${
              view === "orders" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Vista Orders"
          >
            <ListOrdered className="h-3 w-3" />
            Orders
          </button>
        </div>
        {view === "form" && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${autoDetect ? "text-mint" : "text-muted-foreground"}`}
              onClick={() => setAutoDetect(!autoDetect)}
              title={autoDetect ? "Auto-detect ON" : "Auto-detect OFF"}
            >
              {autoDetect ? <Zap className="h-3.5 w-3.5" /> : <ZapOff className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={manualReload} aria-label="Recargar">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReset} aria-label="Reset contador">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            {url && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { setDraft(url); setEditing((v) => !v); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => { setUrl(""); setDraft(""); setEditing(false); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <a href={url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </>
            )}
          </>
        )}
      </div>

      {view === "orders" ? (
        <OrdersView />
      ) : (
        <>

      <div className="flex items-center justify-between gap-3 mb-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-12 w-12 rounded-2xl"
          onClick={() => setCount(Math.max(0, count - 1))}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="font-display text-5xl font-bold tabular-nums">{count}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">PO# TOTAL</div>
        </div>
        <Button
          size="icon"
          className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground hover:brightness-110"
          onClick={() => setCount(count + 1)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center mb-3">
        <div className="rounded-lg bg-secondary/60 py-1.5 px-2 flex items-center justify-between">
          <button onClick={() => setPoCount(Math.max(0, poCount - 1))} className="text-muted-foreground hover:text-foreground">
            <Minus className="h-3 w-3" />
          </button>
          <div className="leading-none">
            <div className="text-sm font-semibold tabular-nums">{poCount}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">PO TOTAL</div>
          </div>
          <button onClick={() => setPoCount(poCount + 1)} className="text-muted-foreground hover:text-foreground">
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <div className="rounded-lg bg-secondary/60 py-1.5 px-2 flex items-center justify-between">
          <button onClick={() => setOtherCount(Math.max(0, otherCount - 1))} className="text-muted-foreground hover:text-foreground">
            <Minus className="h-3 w-3" />
          </button>
          <div className="leading-none">
            <div className="text-sm font-semibold tabular-nums">{otherCount}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Otros</div>
          </div>
          <button onClick={() => setOtherCount(otherCount + 1)} className="text-muted-foreground hover:text-foreground">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* URL input */}
      {(!url || editing) && (
        <div className="flex gap-2 mb-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Pega aquí el link del Google Form..."
            className="h-9 text-xs"
          />
          <Button size="sm" className="h-9" onClick={() => { setUrl(draft); setEditing(false); manualReload(); }}>
            {url ? "Actualizar" : "Cargar"}
          </Button>
          {editing && (
            <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          )}
        </div>
      )}

      {/* Iframe */}
      <div className="flex-1 rounded-2xl overflow-hidden bg-secondary/50 border border-border/60 min-h-[240px]">
        {url ? (
          <iframe
            ref={iframeRef}
            key={key}
            src={toEmbed(url)}
            className="w-full h-full"
            title="Google Form"
            loading="lazy"
            onLoad={handleIframeLoad}
          />
        ) : (
          <div className="h-full grid place-items-center text-center p-6">
            <div>
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-sun grid place-items-center mb-3 animate-float">
                <ClipboardList className="h-6 w-6 text-accent-foreground" />
              </div>
              <p className="text-sm font-medium">Visor de Google Form</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Pega arriba la URL para verlo y que el contador suba automáticamente.
              </p>
            </div>
          </div>
        )}
      </div>

      {url && (
        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${stage === "thank-you" ? "bg-amber-500 animate-pulse" : "bg-mint"}`} />
          <span>stage: {stageLabel}</span>
          <span className="ml-auto">loads: {loadCountRef.current}</span>
        </div>
      )}
    </Card>
  );
};
