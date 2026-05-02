import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Users, Plus, X, ClipboardCopy, ClipboardPaste } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "@/hooks/use-toast";

const DEFAULT_TEAMS = [
  "Team Amanda", "Team Andre", "Team Brian", "Team Carlos",
  "Team Diana", "Team Erin", "Team Frank", "Team Gloria",
  "Team Hugo", "Team Ivan",
];

type Peer = { sa: string; team: string; daily: number; weekly: number };

export const Podium = () => {
  const [sa, setSa] = useLocalStorage<string>("ecp.sa", "");
  const [team, setTeam] = useLocalStorage<string>("ecp.team", DEFAULT_TEAMS[0]);
  const [teams] = useLocalStorage<string[]>("ecp.teams", DEFAULT_TEAMS);
  const [peers, setPeers] = useLocalStorage<Peer[]>("ecp.peers", []);
  const [view, setView] = useLocalStorage<"daily" | "weekly">("ecp.podium.view", "daily");
  const [count] = useLocalStorage<number>("ecp.count", 0);

  // Compute weekly total from history
  const [history] = useLocalStorage<{ date: string; count: number; goal: number }[]>("ecp.history", []);
  const weekTotal = useMemo(() => history.slice(0, 7).reduce((s, r) => s + r.count, 0), [history]);

  // Self entry merged with peers (peers excluding own SA + same team)
  const ranked = useMemo(() => {
    const myEntry: Peer = { sa: sa || "ME", team, daily: count, weekly: weekTotal };
    const sameTeam = peers.filter((p) => p.team === team && p.sa.toUpperCase() !== sa.toUpperCase());
    return [myEntry, ...sameTeam].sort((a, b) =>
      view === "daily" ? b.daily - a.daily : b.weekly - a.weekly
    );
  }, [peers, sa, team, count, weekTotal, view]);

  const top3 = ranked.slice(0, 3);

  const sharePayload = () => {
    const payload = JSON.stringify({ sa: sa || "ME", team, daily: count, weekly: weekTotal });
    navigator.clipboard.writeText(payload).then(
      () => toast({ title: "Copiado", description: "Pega esto en el dashboard de tu compañero" }),
      () => toast({ title: "Error al copiar", variant: "destructive" })
    );
  };

  const importPeer = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const obj = JSON.parse(text) as Peer;
      if (!obj.sa || !obj.team) throw new Error("invalid");
      const next = peers.filter((p) => p.sa.toUpperCase() !== obj.sa.toUpperCase());
      setPeers([...next, { sa: obj.sa, team: obj.team, daily: obj.daily || 0, weekly: obj.weekly || 0 }]);
      toast({ title: "Compañero agregado", description: `${obj.sa} (${obj.team})` });
    } catch {
      toast({ title: "Clipboard no es JSON válido", variant: "destructive" });
    }
  };

  const removePeer = (peerSa: string) => {
    setPeers(peers.filter((p) => p.sa.toUpperCase() !== peerSa.toUpperCase()));
  };

  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "•");

  return (
    <Card className="surface-card p-3 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-xl bg-sun text-accent-foreground grid place-items-center">
          <Trophy className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xs font-semibold leading-tight">Podium</h3>
          <p className="text-[9px] text-muted-foreground truncate">Local · pega JSON de tu team</p>
        </div>
        <div className="flex items-center gap-0.5 bg-secondary rounded-full p-0.5">
          <button
            onClick={() => setView("daily")}
            className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${view === "daily" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >Day</button>
          <button
            onClick={() => setView("weekly")}
            className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${view === "weekly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >Wk</button>
        </div>
      </div>

      {/* Identity */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        <Input
          value={sa}
          onChange={(e) => setSa(e.target.value.slice(0, 3).toUpperCase())}
          onBlur={(e) => setSa(e.target.value.toUpperCase())}
          placeholder="SA"
          className="h-7 text-[11px] font-mono uppercase text-center"
          maxLength={3}
        />
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="h-7 text-[10px] rounded-md bg-secondary border border-border px-1.5 outline-none"
        >
          {teams.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Top 3 */}
      <div className="space-y-1 mb-2">
        {top3.map((p, i) => {
          const isMe = p.sa.toUpperCase() === (sa || "ME").toUpperCase();
          const value = view === "daily" ? p.daily : p.weekly;
          return (
            <div
              key={p.sa + i}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 ${
                isMe ? "bg-sun/20 border border-sun/40" : "bg-secondary/50"
              }`}
            >
              <span className="text-base">{medal(i)}</span>
              <span className="font-mono text-[11px] font-bold flex-1 truncate">{p.sa}</span>
              <span className="font-mono text-sm font-bold tabular-nums">{value}</span>
            </div>
          );
        })}
        {top3.length === 1 && (
          <p className="text-[9px] text-muted-foreground text-center italic">
            Pega el JSON de tus compañeros ↓
          </p>
        )}
      </div>

      {/* Peer management */}
      <div className="mt-auto pt-2 border-t border-border/40 flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 flex-1 text-[9px]"
          onClick={sharePayload}
          title="Copy your numbers as JSON"
        >
          <ClipboardCopy className="h-2.5 w-2.5 mr-1" /> Compartir
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 flex-1 text-[9px]"
          onClick={importPeer}
          title="Paste teammate JSON"
        >
          <ClipboardPaste className="h-2.5 w-2.5 mr-1" /> Pegar
        </Button>
      </div>

      {peers.filter((p) => p.team === team).length > 0 && (
        <details className="mt-1">
          <summary className="text-[9px] text-muted-foreground cursor-pointer">
            <Users className="inline h-2.5 w-2.5 mr-1" />
            {peers.filter((p) => p.team === team).length} peer{peers.filter((p) => p.team === team).length === 1 ? "" : "s"}
          </summary>
          <div className="mt-1 space-y-0.5">
            {peers.filter((p) => p.team === team).map((p) => (
              <div key={p.sa} className="flex items-center justify-between text-[9px] font-mono">
                <span>{p.sa} · {p.daily}/{p.weekly}</span>
                <button onClick={() => removePeer(p.sa)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </Card>
  );
};
