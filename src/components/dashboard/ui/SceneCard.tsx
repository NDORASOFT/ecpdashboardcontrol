import { MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode, MouseEventHandler } from "react";

type Tone = "sky" | "cream" | "mint" | "coral" | "sun" | "charcoal";

const toneBg: Record<Tone, string> = {
  sky: "bg-[hsl(var(--tile-sky))]",
  cream: "bg-card",
  mint: "bg-[hsl(var(--tile-mint))]",
  coral: "bg-[hsl(var(--tile-coral))]",
  sun: "bg-[hsl(var(--tile-sun))]",
  charcoal: "bg-gradient-charcoal text-primary-foreground",
};

const toneIconBg: Record<Tone, string> = {
  sky: "bg-white/70 text-foreground",
  cream: "bg-secondary text-foreground",
  mint: "bg-white/70 text-foreground",
  coral: "bg-white/70 text-foreground",
  sun: "bg-white/70 text-foreground",
  charcoal: "bg-white/15 text-primary-foreground",
};

export const SceneCard = ({
  tone = "cream",
  icon,
  title,
  meta,
  children,
  className,
  onMore,
}: {
  tone?: Tone;
  icon?: ReactNode;
  title?: string;
  meta?: string;
  children?: ReactNode;
  className?: string;
  onMore?: () => void;
}) => (
  <div
    className={cn(
      "rounded-3xl shadow-soft p-4 flex flex-col h-full overflow-hidden relative",
      toneBg[tone],
      className,
    )}
  >
    {(icon || title || meta) && (
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div className={cn("h-9 w-9 rounded-2xl grid place-items-center shrink-0", toneIconBg[tone])}>
            {icon}
          </div>
        )}
        <button
          onClick={onMore}
          className="h-7 w-7 grid place-items-center rounded-full text-current/60 hover:bg-black/5 transition-smooth"
          aria-label="More"
        >
          <MoreHorizontal className="h-4 w-4 opacity-60" />
        </button>
      </div>
    )}
    {children}
    {(title || meta) && (
      <div className="mt-auto pt-3">
        {title && <div className="font-display text-lg font-bold leading-tight">{title}</div>}
        {meta && <div className="text-[10px] opacity-70 mt-0.5">{meta}</div>}
      </div>
    )}
  </div>
);

export const SummaryPill = ({
  label,
  meta,
  actionLabel = "See All",
  onAction,
}: {
  label: string;
  meta?: string;
  actionLabel?: string;
  onAction?: MouseEventHandler<HTMLButtonElement>;
}) => (
  <div className="rounded-3xl bg-card shadow-soft px-4 py-3 flex items-center gap-3 w-full">
    <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center shrink-0">
      <Plus className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="font-display text-sm font-semibold truncate">{label}</div>
      {meta && <div className="text-[10px] text-muted-foreground truncate">{meta}</div>}
    </div>
    <button
      onClick={onAction}
      className="shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-medium px-4 h-9 hover:brightness-110 transition-smooth"
    >
      {actionLabel}
    </button>
  </div>
);
