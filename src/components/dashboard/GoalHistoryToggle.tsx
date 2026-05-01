import { useState } from "react";
import { GoalGauge } from "./GoalGauge";
import { HistoryTable } from "./HistoryTable";
import { Target, History, BarChart3 } from "lucide-react";
import { StatsView } from "./StatsView";

export const GoalHistoryToggle = ({
  count,
  goal,
  setTodayCount,
}: {
  count: number;
  goal: number;
  setTodayCount: (n: number) => void;
}) => {
  const [view, setView] = useState<"goal" | "history" | "stats">("goal");

  return (
    <div className="flex flex-col h-full gap-1.5">
      <div className="flex items-center gap-0.5 bg-secondary rounded-full p-0.5 self-center">
        {([
          { key: "goal" as const, icon: Target, label: "Goal" },
          { key: "history" as const, icon: History, label: "Log" },
          { key: "stats" as const, icon: BarChart3, label: "Stats" },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-[9px] font-medium transition-smooth ${
              view === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3 w-3" /> {label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        {view === "goal" ? (
          <GoalGauge count={count} goal={goal} />
        ) : view === "history" ? (
          <HistoryTable todayCount={count} goal={goal} setTodayCount={setTodayCount} />
        ) : (
          <StatsView />
        )}
      </div>
    </div>
  );
};
