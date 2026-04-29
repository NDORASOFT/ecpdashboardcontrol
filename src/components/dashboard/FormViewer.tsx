import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClipboardList, ExternalLink, RefreshCw, Pencil, Trash2, Zap, ZapOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export const FormViewer = ({
  onSubmitDetected,
}: {
  onSubmitDetected?: () => void;
}) => {
  const [url, setUrl] = useLocalStorage<string>("ecp.formUrl", "");
  const [draft, setDraft] = useState(url);
  const [key, setKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastTriggerRef = useRef<number>(0);

  const toEmbed = (u: string) => {
    if (!u) return "";
    if (u.includes("docs.google.com/forms") && !u.includes("embedded=true")) {
      const sep = u.includes("?") ? "&" : "?";
      return `${u}${sep}embedded=true`;
    }
    return u;
  };

  // Heuristic: when the iframe has focus and then the window regains focus
  // (user clicked "Submit" inside the form), trigger the count prompt.
  useEffect(() => {
    if (!url || !onSubmitDetected) return;

    let iframeWasFocused = false;

    const checkFocus = () => {
      if (document.activeElement === iframeRef.current) {
        iframeWasFocused = true;
      }
    };

    const onWindowFocus = () => {
      if (iframeWasFocused) {
        const now = Date.now();
        // debounce 2s to avoid double triggers
        if (now - lastTriggerRef.current > 2000) {
          lastTriggerRef.current = now;
          onSubmitDetected();
        }
        iframeWasFocused = false;
      }
    };

    const interval = setInterval(checkFocus, 300);
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("blur", checkFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("blur", checkFocus);
    };
  }, [url, onSubmitDetected, key]);

  return (
    <Card className="surface-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground grid place-items-center">
          <ClipboardList className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-xs font-semibold leading-tight">Order Tracker</h3>
          <p className="text-[9px] text-muted-foreground">Completa tras cada orden</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7"
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
};
