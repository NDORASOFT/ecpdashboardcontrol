import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Bell, Eye, EyeOff, Trash2, Clock, ListChecks, Package } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ensureNotificationPermission, fireNotification } from "@/lib/notify";
import { toast } from "@/hooks/use-toast";
import type { Quote } from "./QuoteBucket";

type Task = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  completedDate?: string; // YYYY-MM-DD
  remindAt?: number;      // epoch ms
  reminded?: boolean;
  preset?: boolean;
};

type Mode = "tasks" | "quotes";

const todayKey = () => new Date().toISOString().slice(0, 10);

const PRESETS: Omit<Task, "id" | "done" | "createdAt">[] = [
  { text: "Check email", preset: true },
  { text: "Trabajar 76 screen", preset: true },
];

export const TodoList = ({
  quotes,
  setQuotes,
}: {
  quotes: Quote[];
  setQuotes: (q: Quote[]) => void;
}) => {
  const [mode, setMode] = useLocalStorage<Mode>("ecp.todo.mode", "tasks");
  const [tasks, setTasks] = useLocalStorage<Task[]>("ecp.tasks", []);
  const [seeded, setSeeded] = useLocalStorage<string>("ecp.tasks.seedDay", "");
  const [showCompleted, setShowCompleted] = useState(false);
  const [text, setText] = useState("");
  const [hours, setHours] = useState<string>("");

  // Quote inputs
  const [qOrder, setQOrder] = useState("");
  const [qNote, setQNote] = useState("");

  // Seed presets once per day
  useEffect(() => {
    const t = todayKey();
    if (seeded !== t) {
      setTasks((prev) => {
        const withoutOldPresets = prev.filter((p) => !p.preset);
        const newPresets: Task[] = PRESETS.map((p) => ({
          id: crypto.randomUUID(),
          done: false,
          createdAt: Date.now(),
          ...p,
        }));
        return [...newPresets, ...withoutOldPresets];
      });
      setSeeded(t);
    }
  }, [seeded, setSeeded, setTasks]);

  // Reminder ticker
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const next = tasks.map((t) => {
        if (t.remindAt && !t.reminded && t.remindAt <= now) {
          fireNotification("Recordatorio ECP", t.text);
          toast({ title: "⏰ Recordatorio", description: t.text });
          changed = true;
          return { ...t, reminded: true };
        }
        return t;
      });
      if (changed) setTasks(next);
    }, 15000);
    return () => clearInterval(id);
  }, [tasks, setTasks]);

  const add = async () => {
    if (!text.trim()) return;
    const h = parseFloat(hours);
    let remindAt: number | undefined;
    if (!isNaN(h) && h > 0) {
      const capped = Math.min(h, 32);
      remindAt = Date.now() + capped * 3600 * 1000;
      const ok = await ensureNotificationPermission();
      if (!ok) toast({ title: "Permiso denegado", description: "No se podrán mostrar notificaciones del sistema." });
    }
    setTasks([
      { id: crypto.randomUUID(), text: text.trim(), done: false, createdAt: Date.now(), remindAt },
      ...tasks,
    ]);
    setText("");
    setHours("");
  };

  const toggle = (id: string) => {
    setTasks(tasks.map((t) =>
      t.id === id
        ? { ...t, done: !t.done, completedDate: !t.done ? todayKey() : undefined }
        : t
    ));
  };

  const remove = (id: string) => setTasks(tasks.filter((t) => t.id !== id));

  const addQuote = () => {
    if (!qOrder.trim()) return;
    setQuotes([
      { id: crypto.randomUUID(), order: qOrder.trim(), note: qNote.trim() || undefined, createdAt: Date.now() },
      ...quotes,
    ]);
    setQOrder("");
    setQNote("");
  };

  const removeQuote = (id: string) => setQuotes(quotes.filter((q) => q.id !== id));

  const today = todayKey();
  const visible = tasks.filter((t) => !t.done || (showCompleted && t.completedDate === today));
  const completedToday = tasks.filter((t) => t.done && t.completedDate === today).length;

  const fmtRemind = (ts: number) => {
    const diff = ts - Date.now();
    if (diff <= 0) return "ya";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const isTasks = mode === "tasks";

  return (
    <Card className="surface-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-8 w-8 rounded-xl text-primary-foreground grid place-items-center ${isTasks ? "bg-coral" : "bg-sky"}`}>
          {isTasks ? <Bell className="h-4 w-4" /> : <Package className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-xs font-semibold leading-tight truncate">
            {isTasks ? "To-Do del día" : "Quote Requests"}
          </h3>
          <p className="text-[9px] text-muted-foreground">
            {isTasks ? `${completedToday} completadas hoy` : `${quotes.length} pendientes`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 bg-secondary rounded-full p-0.5 shrink-0">
          <button
            onClick={() => setMode("tasks")}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-smooth ${
              isTasks ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Tareas"
          >
            <ListChecks className="h-3 w-3" />
            Tasks
          </button>
          <button
            onClick={() => setMode("quotes")}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-smooth ${
              !isTasks ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Quotes"
          >
            <Package className="h-3 w-3" />
            Quotes
          </button>
        </div>
      </div>

      {isTasks ? (
        <>
          <div className="flex items-center justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setShowCompleted((s) => !s)}
            >
              {showCompleted ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showCompleted ? "Ocultar" : "Ver"} hechas
            </Button>
          </div>

          <div className="flex flex-col gap-2 mb-3">
            <div className="flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="Nueva tarea..."
                className="h-9"
              />
              <Button onClick={add} size="icon" className="h-9 w-9 shrink-0 rounded-xl">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <Input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Recordar en X horas (0-32)"
                min={0}
                max={32}
                step={0.5}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin -mx-1 px-1 space-y-1.5">
            {visible.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">¡Todo en orden! 🎉</p>
            )}
            {visible.map((t) => (
              <div
                key={t.id}
                className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-smooth
                  ${t.done ? "bg-secondary/40" : "bg-secondary/70 hover:bg-muted"}`}
              >
                <Checkbox checked={t.done} onCheckedChange={() => toggle(t.id)} />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {t.text}
                  </div>
                  {t.remindAt && !t.done && (
                    <div className="text-[10px] text-coral flex items-center gap-1 mt-0.5">
                      <Bell className="h-2.5 w-2.5" />
                      {t.reminded ? "avisado" : `en ${fmtRemind(t.remindAt)}`}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-smooth"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2 mb-3">
            <Input
              value={qOrder}
              onChange={(e) => setQOrder(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addQuote()}
              placeholder="Orden #"
              className="h-9"
            />
            <div className="flex gap-2">
              <Input
                value={qNote}
                onChange={(e) => setQNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addQuote()}
                placeholder="Nota (opcional)"
                className="h-9"
              />
              <Button onClick={addQuote} size="icon" className="h-9 w-9 shrink-0 rounded-xl">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin -mx-1 px-1 space-y-1.5">
            {quotes.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">Sin quotes pendientes ✨</p>
            )}
            {quotes.map((q) => (
              <div key={q.id} className="group flex items-start gap-2 rounded-xl bg-secondary/70 hover:bg-muted px-2.5 py-2 transition-smooth">
                <div className="h-6 w-6 rounded-lg bg-sky/15 text-sky grid place-items-center shrink-0 mt-0.5">
                  <Package className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">#{q.order}</div>
                  {q.note && <div className="text-[11px] text-muted-foreground truncate">{q.note}</div>}
                </div>
                <button
                  onClick={() => removeQuote(q.id)}
                  className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-smooth"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};
