import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Bell, Eye, EyeOff, RotateCcw, Trash2, Clock } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ensureNotificationPermission, fireNotification } from "@/lib/notify";
import { toast } from "@/hooks/use-toast";

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

const todayKey = () => new Date().toISOString().slice(0, 10);

const PRESETS: Omit<Task, "id" | "done" | "createdAt">[] = [
  { text: "Check email", preset: true },
  { text: "Trabajar 76 screen", preset: true },
];

export const TodoList = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>("ecp.tasks", []);
  const [seeded, setSeeded] = useLocalStorage<string>("ecp.tasks.seedDay", "");
  const [showCompleted, setShowCompleted] = useState(false);
  const [text, setText] = useState("");
  const [hours, setHours] = useState<string>("");

  // Seed presets once per day, marking them undone for the new day
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

  return (
    <Card className="surface-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-coral text-primary-foreground grid place-items-center">
          <Bell className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-xs font-semibold leading-tight">To-Do del día</h3>
          <p className="text-[9px] text-muted-foreground">{completedToday} completadas hoy</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 px-2 text-[11px]"
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
    </Card>
  );
};
