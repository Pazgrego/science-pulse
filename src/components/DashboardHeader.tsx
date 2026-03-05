import { Activity, Moon, Sun, RefreshCw } from "lucide-react";
import { ViewMode } from "@/hooks/usePapers";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: Date | null;
  darkMode: boolean;
  onToggleDark: () => void;
}

const tabs: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: "microbiome", label: "Microbiome", icon: "🦠" },
  { mode: "diabetes", label: "Diabetes", icon: "💉" },
  { mode: "both", label: "Both", icon: "🔬" },
];

export default function DashboardHeader({
  viewMode,
  onViewChange,
  onRefresh,
  loading,
  lastUpdated,
  darkMode,
  onToggleDark,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <Activity className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">
              Research Pulse
            </h1>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.mode}
              onClick={() => onViewChange(tab.mode)}
              className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === tab.mode
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {viewMode === tab.mode && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-md bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">
                {tab.icon} {tab.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={onToggleDark}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
