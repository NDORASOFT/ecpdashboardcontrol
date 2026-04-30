import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Suggestion = { id: string; text: string; at: string };

export const SuggestionDialog = () => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [items, setItems] = useLocalStorage<Suggestion[]>("ecp.suggestions", []);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setItems([{ id: crypto.randomUUID(), text: t, at: new Date().toISOString() }, ...items]);
    setText("");
    setOpen(false);
    toast({
      title: "Sugerencia guardada",
      description: "Gracias por tu feedback — Michael la revisará.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center gap-1 rounded-full bg-sun/20 hover:bg-sun/30 px-2 py-0.5 text-[10px] text-foreground transition-smooth"
          title="Send a suggestion"
        >
          <Lightbulb className="h-3 w-3" />
          Suggestions
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Send a suggestion</DialogTitle>
          <DialogDescription>
            Tell Michael what would make the dashboard better. Stored locally and listed below.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your idea, bug, or feature request..."
          rows={4}
        />
        {items.length > 0 && (
          <div className="max-h-32 overflow-y-auto scrollbar-thin space-y-1 text-xs border-t border-border/60 pt-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Recent
            </p>
            {items.slice(0, 6).map((s) => (
              <div key={s.id} className="bg-secondary/60 rounded-lg px-2 py-1">
                <p className="text-foreground">{s.text}</p>
                <p className="text-[9px] text-muted-foreground">
                  {new Date(s.at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={send}>
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
