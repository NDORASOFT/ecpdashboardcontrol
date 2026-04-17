import { Truck, Plane, Ship, Package } from "lucide-react";

const VEHICLES = [
  { icon: Package, label: "Pickup", color: "hsl(var(--coral))" },
  { icon: Truck, label: "UPS Truck", color: "hsl(var(--sun))" },
  { icon: Plane, label: "Air Freight", color: "hsl(var(--accent))" },
  { icon: Ship, label: "Sea Cargo", color: "hsl(var(--mint))" },
] as const;

export const vehicleFor = (pct: number) => {
  if (pct >= 0.75) return VEHICLES[3];
  if (pct >= 0.5) return VEHICLES[2];
  if (pct >= 0.25) return VEHICLES[1];
  return VEHICLES[0];
};

export const ShippingProgress = ({ pct, compact = false }: { pct: number; compact?: boolean }) => {
  const v = vehicleFor(pct);
  const Icon = v.icon;
  const clamped = Math.min(Math.max(pct, 0), 1);
  // Position vehicle along the track. Reserve room for icon width.
  const left = `calc(${clamped * 100}% - ${compact ? 10 : 14}px)`;

  return (
    <div className={`w-full ${compact ? "space-y-1" : "space-y-1.5"}`}>
      <div
        className={`relative w-full rounded-full bg-secondary overflow-visible ${compact ? "h-2" : "h-2.5"}`}
      >
        {/* dashed road */}
        <div
          className="absolute inset-y-0 left-0 right-0 rounded-full opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, hsl(var(--muted-foreground)) 0 6px, transparent 6px 12px)",
          }}
        />
        {/* progress fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${clamped * 100}%`, background: v.color }}
        />
        {/* moving vehicle */}
        <div
          className="absolute -top-1 transition-all duration-700 ease-out animate-float"
          style={{ left }}
        >
          <div
            className={`grid place-items-center rounded-full shadow-soft ${compact ? "h-5 w-5" : "h-6 w-6"}`}
            style={{ background: v.color, color: "hsl(var(--primary-foreground))" }}
          >
            <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </div>
        </div>
      </div>
      {!compact && (
        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
          <span className="font-medium" style={{ color: v.color }}>
            {v.label}
          </span>
          <span>{Math.round(clamped * 100)}%</span>
        </div>
      )}
    </div>
  );
};
