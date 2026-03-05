import { useEffect } from "react";
import { useResearchSnapshot } from "@/hooks/useResearchSnapshot";
import { Loader2 } from "lucide-react";

interface ResearchSnapshotProps {
  paperId: string;
  abstract: string;
}

const FIELDS = [
  { key: "model", icon: "🧪", label: "Model" },
  { key: "sampleSize", icon: "👥", label: "Sample Size" },
  { key: "method", icon: "⚙️", label: "Method" },
  { key: "keyFinding", icon: "🎯", label: "Key Finding" },
  { key: "mainLimitation", icon: "⚠️", label: "Limitation" },
  { key: "stage", icon: "🔗", label: "Stage" },
] as const;

const stageBadgeClass: Record<string, string> = {
  Basic: "bg-muted text-muted-foreground",
  "Pre-clinical": "bg-accent text-accent-foreground",
  Clinical: "bg-primary/10 text-primary",
  Review: "bg-secondary text-secondary-foreground",
};

export default function ResearchSnapshot({ paperId, abstract }: ResearchSnapshotProps) {
  const { snapshot, loading, error, fetchSnapshot } = useResearchSnapshot(paperId, abstract);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Extracting research snapshot…</span>
      </div>
    );
  }

  if (error || !snapshot) {
    if (error) {
      return (
        <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <button
            onClick={fetchSnapshot}
            className="text-xs text-primary hover:underline"
          >
            Failed to extract snapshot — click to retry
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Research Snapshot
      </p>
      <div className="grid gap-1.5">
        {FIELDS.map(({ key, icon, label }) => {
          const value = snapshot[key as keyof typeof snapshot];
          if (key === "stage") {
            return (
              <div key={key} className="flex items-start gap-2 text-xs">
                <span className="flex-shrink-0">{icon}</span>
                <span className="font-medium text-muted-foreground">{label}:</span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    stageBadgeClass[value] || "bg-muted text-muted-foreground"
                  }`}
                >
                  {value}
                </span>
              </div>
            );
          }
          return (
            <div key={key} className="flex items-start gap-2 text-xs">
              <span className="flex-shrink-0">{icon}</span>
              <span className="flex-shrink-0 font-medium text-muted-foreground">{label}:</span>
              <span className="text-foreground">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
