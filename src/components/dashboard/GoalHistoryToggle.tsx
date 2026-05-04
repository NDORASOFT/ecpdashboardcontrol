import { useState } from "react";
import { GoalGauge } from "./GoalGauge";
import { HistoryTable } from "./HistoryTable";
import { Target, History } from "lucide-react";

export const GoalHistoryToggle = ({
  count,
  goal,
  setTodayCount,
}: {
  count: number;
  goal: number;
  setTodayCount: (n: number) => void;
}) => {
  const [view, setView] = useState<"goal" | "history">("goal");

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center gap-1 bg-secondary rounded-full p-0.5 self-center">
        <button
          onClick={() => setView("goal")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-smooth ${
            view === "goal" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Target className="h-3 w-3" /> Goal
        </button>
        <button
          onClick={() => setView("history")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-smooth ${
            view === "history" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-3 w-3" /> History
        </button>
      </div>
      <div className="flex-1 min-h-0">
        {view === "goal" ? (
          <GoalGauge count={count} goal={goal} />
        ) : (
          <HistoryTable todayCount={count} goal={goal} setTodayCount={setTodayCount} />
        )}
      </div>
    </div>
  );
};
