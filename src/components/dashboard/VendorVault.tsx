import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Pencil,
  Trash2,
  Power,
  Upload,
  Download,
  X,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "@/hooks/use-toast";

type Vendor = {
  id: string;
  name: string;
  portal: string;
  user: string;
  password: string;
  active: boolean;
  notes?: string;
};

const empty = (): Vendor => ({
  id: crypto.randomUUID(),
  name: "",
  portal: "",
  user: "",
  password: "",
  active: true,
  notes: "",
});

export const VendorVault = () => {
  const [vendors, setVendors] = useLocalStorage<Vendor[]>("ecp.vendors", []);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [showPw, setShowPw] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return vendors;
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(s) ||
        v.user.toLowerCase().includes(s) ||
        v.portal.toLowerCase().includes(s)
    );
  }, [vendors, q]);

  const safeIdx = filtered.length === 0 ? 0 : Math.min(idx, filtered.length - 1);
  const current = filtered[safeIdx];

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado", description: label });
    } catch {
      toast({ title: "Error al copiar", variant: "destructive" });
    }
  };

  const saveEdit = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" });
      return;
    }
    const exists = vendors.some((v) => v.id === editing.id);
    setVendors(exists ? vendors.map((v) => (v.id === editing.id ? editing : v)) : [editing, ...vendors]);
    setEditing(null);
  };

  const remove = (id: string) => {
    setVendors(vendors.filter((v) => v.id !== id));
  };

  const toggleActive = (id: string) => {
    setVendors(vendors.map((v) => (v.id === id ? { ...v, active: !v.active } : v)));
  };

  const exportCsv = () => {
    const header = "name,portal,user,password,active,notes";
    const rows = vendors.map((v) =>
      [v.name, v.portal, v.user, v.password, v.active ? "1" : "0", v.notes || ""]
        .map((c) => `"${(c || "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return;
      const parsed: Vendor[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvRow(lines[i]);
        if (cols.length < 4) continue;
        parsed.push({
          id: crypto.randomUUID(),
          name: cols[0] || "",
          portal: cols[1] || "",
          user: cols[2] || "",
          password: cols[3] || "",
          active: (cols[4] ?? "1") !== "0",
          notes: cols[5] || "",
        });
      }
      if (parsed.length) {
        setVendors([...parsed, ...vendors]);
        toast({ title: "Importados", description: `${parsed.length} vendors` });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="surface-card p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground grid place-items-center">
          <Briefcase className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xs font-semibold leading-tight">Vendor Vault</h3>
          <p className="text-[9px] text-muted-foreground">{vendors.length} vendors · local only</p>
        </div>
        <label className="cursor-pointer text-muted-foreground hover:text-foreground" title="Import CSV">
          <Upload className="h-3.5 w-3.5" />
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
          />
        </label>
        <button onClick={exportCsv} className="text-muted-foreground hover:text-foreground" title="Export CSV">
          <Download className="h-3.5 w-3.5" />
        </button>
        <Button size="sm" className="h-7 rounded-full text-[11px]" onClick={() => setEditing(empty())}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setIdx(0);
          }}
          placeholder="Search vendor..."
          className="h-8 pl-7 text-xs"
        />
      </div>

      {!current ? (
        <div className="flex-1 grid place-items-center text-center text-xs text-muted-foreground">
          {vendors.length === 0 ? "No vendors yet. Add one or import a CSV." : "No matches"}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setIdx((i) => (i - 1 + filtered.length) % filtered.length)}
              aria-label="Prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {safeIdx + 1} / {filtered.length}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setIdx((i) => (i + 1) % filtered.length)}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div
            className={`flex-1 rounded-2xl border p-3 flex flex-col gap-2 transition-smooth ${
              current.active
                ? "bg-card border-border"
                : "bg-muted/40 border-border/40 opacity-60 grayscale"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-display text-base font-bold truncate">{current.name}</h4>
                <p className="text-[10px] text-muted-foreground">
                  {current.active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleActive(current.id)}
                  className={`p-1.5 rounded-lg transition-smooth ${
                    current.active ? "text-mint" : "text-muted-foreground"
                  } hover:bg-secondary`}
                  title={current.active ? "Mark inactive" : "Mark active"}
                >
                  <Power className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setEditing(current)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(current.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <Field label="Portal" value={current.portal} onCopy={() => copy(current.portal, "Portal")}>
              {current.portal && (
                <a
                  href={current.portal.startsWith("http") ? current.portal : `https://${current.portal}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  title="Open"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </Field>
            <Field label="User" value={current.user} onCopy={() => copy(current.user, "User")} />
            <Field
              label="Password"
              value={showPw ? current.password : "•".repeat(Math.min(12, current.password.length || 8))}
              onCopy={() => copy(current.password, "Password")}
            >
              <button
                onClick={() => setShowPw((s) => !s)}
                className="text-muted-foreground hover:text-foreground"
                title={showPw ? "Hide" : "Show"}
              >
                {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </Field>
            {current.notes && (
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{current.notes}</p>
            )}
          </div>
        </>
      )}

      {editing && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col gap-2 z-10 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-display text-sm font-semibold">
              {vendors.some((v) => v.id === editing.id) ? "Edit vendor" : "New vendor"}
            </h4>
            <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <EditField label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
          <EditField label="Portal URL" value={editing.portal} onChange={(v) => setEditing({ ...editing, portal: v })} />
          <EditField label="User" value={editing.user} onChange={(v) => setEditing({ ...editing, user: v })} />
          <EditField label="Password" value={editing.password} onChange={(v) => setEditing({ ...editing, password: v })} />
          <EditField label="Notes" value={editing.notes || ""} onChange={(v) => setEditing({ ...editing, notes: v })} />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={editing.active}
              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
            />
            Active
          </label>
          <div className="flex gap-2 mt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={saveEdit}>
              Save
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

const Field = ({
  label,
  value,
  onCopy,
  children,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  children?: React.ReactNode;
}) => (
  <div className="bg-secondary/60 rounded-xl px-2.5 py-1.5">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {children}
        <button
          onClick={onCopy}
          className="text-muted-foreground hover:text-foreground"
          title={`Copy ${label}`}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
    <div className="text-xs font-mono truncate">{value || "—"}</div>
  </div>
);

const EditField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="text-[10px] text-muted-foreground">{label}</label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />
  </div>
);

const parseCsvRow = (row: string): string[] => {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQ) {
      if (ch === '"' && row[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else {
      if (ch === ",") { out.push(cur); cur = ""; }
      else if (ch === '"') inQ = true;
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
};
