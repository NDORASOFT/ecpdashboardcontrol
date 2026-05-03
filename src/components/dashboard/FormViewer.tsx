import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClipboardList, ExternalLink, RefreshCw, Pencil, Trash2, Zap, ZapOff, Check, Plus, Minus, RotateCcw } from "lucide-react";
import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type FormViewerHandle = { reload: () => void };

type CounterProps = {
  count: number; setCount: (n: number) => void;
  poCount: number; setPoCount: (n: number) => void;
  otherCount: number; setOtherCount: (n: number) => void;
  onResetCounter: () => void;
};

export const FormViewer = forwardRef<
  FormViewerHandle,
  { onSubmitDetected?: () => void } & Partial<CounterProps>
>(({ onSubmitDetected, count = 0, setCount, poCount = 0, setPoCount, otherCount = 0, setOtherCount, onResetCounter }, ref) => {
  const [url, setUrl] = useLocalStorage<string>("ecp.formUrl", "");
  const [autoDetect, setAutoDetect] = useLocalStorage<boolean>("ecp.formAutoDetect", true);
  const [draft, setDraft] = useState(url);
  const [key, setKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastTriggerRef = useRef<number>(0);
  const loadCountRef = useRef<number>(0);
  const initialLoadAtRef = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    reload: () => setKey((k) => k + 1),
  }));

  const triggerSubmit = () => {
    if (!onSubmitDetected) return;
    const now = Date.now();
    if (now - lastTriggerRef.current < 3000) return;
    lastTriggerRef.current = now;
    onSubmitDetected();
  };

  // Google Forms flow:
  //   load 1 = initial render
  //   load 2 = "Next" page (intermediate) -> NOT submit
  //   load 3 = final "/formResponse" thank-you page -> SUBMIT
  // We trigger ONLY on load >= 3 with a min elapsed time, so partial Fraud-expanding
  // re-renders or back nav do not falsely count.
  const handleIframeLoad = () => {
    loadCountRef.current += 1;
    if (loadCountRef.current === 1) {
      initialLoadAtRef.current = Date.now();
      return;
    }
    if (!autoDetect) return;
    const elapsed = Date.now() - initialLoadAtRef.current;
    // Strictly require 3+ loads AND ≥10s elapsed (real fill time).
    if (loadCountRef.current >= 3 && elapsed > 10000) {
      triggerSubmit();
    }
  };

  const toEmbed = (u: string) => {
    if (!u) return "";
    if (u.includes("docs.google.com/forms") && !u.includes("embedded=true")) {
      const sep = u.includes("?") ? "&" : "?";
      return `${u}${sep}embedded=true`;
    }
    return u;
  };

  useEffect(() => {
    loadCountRef.current = 0;
    initialLoadAtRef.current = 0;
  }, [key, url]);

  return (
    <Card className="surface-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground grid place-items-center">
          <ClipboardList className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-xs font-semibold leading-tight">Order Tracker</h3>
          <p className="text-[9px] text-muted-foreground">Counter + Form</p>
        </div>
        {url && onSubmitDetected && (
          <Button
            size="sm"
            variant="default"
            className="ml-auto h-7 bg-mint text-primary-foreground hover:brightness-110 font-semibold text-[11px] px-2.5"
            onClick={triggerSubmit}
            title="Mark order as counted"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Contar
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${autoDetect ? "text-mint" : "text-muted-foreground"}`}
          onClick={() => setAutoDetect(!autoDetect)}
          title={autoDetect ? "Auto-detect ON" : "Auto-detect OFF"}
        >
          {autoDetect ? <Zap className="h-3.5 w-3.5" /> : <ZapOff className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setKey((k) => k + 1)}
          aria-label="Recargar"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        {url && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => { setDraft(url); setEditing((v) => !v); }}
              aria-label="Editar URL"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => { setUrl(""); setDraft(""); setEditing(false); }}
              aria-label="Eliminar URL"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <a href={url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </>
        )}
      </div>

      {setPoCount && setCount && setOtherCount && onResetCounter && (
        <div className="flex items-center gap-1.5 mb-2 px-1 py-1.5 rounded-lg bg-secondary/40">
          <button
            onClick={() => { setPoCount(Math.max(0, poCount - 1)); setCount(Math.max(0, count - 1)); }}
            className="h-6 w-6 grid place-items-center rounded-md bg-secondary hover:bg-muted"
            title="PO -1"
          >
            <Minus className="h-3 w-3" />
          </button>
          <div className="flex flex-col items-center px-1">
            <span className="font-display text-base font-bold tabular-nums leading-none">{poCount}</span>
            <span className="text-[8px] text-muted-foreground uppercase">PO</span>
          </div>
          <button
            onClick={() => { setPoCount(poCount + 1); setCount(count + 1); }}
            className="h-6 w-6 grid place-items-center rounded-md bg-primary text-primary-foreground hover:brightness-110"
            title="PO +1"
          >
            <Plus className="h-3 w-3" />
          </button>
          <div className="mx-1 h-6 w-px bg-border/60" />
          <button
            onClick={() => { setOtherCount(Math.max(0, otherCount - 1)); setCount(Math.max(0, count - 1)); }}
            className="h-5 w-5 grid place-items-center rounded-md bg-secondary hover:bg-muted text-muted-foreground"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
          <div className="flex flex-col items-center px-0.5">
            <span className="text-sm font-semibold tabular-nums leading-none">{otherCount}</span>
            <span className="text-[8px] text-muted-foreground uppercase">76</span>
          </div>
          <button
            onClick={() => { setOtherCount(otherCount + 1); setCount(count + 1); }}
            className="h-5 w-5 grid place-items-center rounded-md bg-secondary hover:bg-muted text-muted-foreground"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
          <div className="ml-auto flex flex-col items-center px-1">
            <span className="text-sm font-semibold tabular-nums leading-none">{count}</span>
            <span className="text-[8px] text-muted-foreground uppercase">Tot</span>
          </div>
          <button
            onClick={onResetCounter}
            className="h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Reset counters"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      )}

      {(!url || editing) && (
        <div className="flex gap-2 mb-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Pega aquí el link del Google Form..."
            className="h-9 text-xs"
          />
          <Button size="sm" className="h-9" onClick={() => { setUrl(draft); setEditing(false); setKey((k) => k + 1); }}>
            {url ? "Actualizar" : "Cargar"}
          </Button>
          {editing && (
            <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          )}
        </div>
      )}

      <div className="flex-1 rounded-2xl overflow-hidden bg-secondary/50 border border-border/60">
        {url ? (
          <iframe
            ref={iframeRef}
            key={key}
            src={toEmbed(url)}
            onLoad={handleIframeLoad}
            className="w-full h-full"
            title="Google Form"
            loading="lazy"
          />
        ) : (
          <div className="h-full grid place-items-center text-center p-6">
            <div>
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-sun grid place-items-center mb-3 animate-float">
                <ClipboardList className="h-6 w-6 text-accent-foreground" />
              </div>
              <p className="text-sm font-medium">Visor de Google Form</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Pega arriba la URL de tu formulario para verlo y completarlo aquí mismo.
              </p>
            </div>
          </div>
        )}
      </div>

    </Card>
  );
});
FormViewer.displayName = "FormViewer";
