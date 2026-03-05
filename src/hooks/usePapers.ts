import { useState, useCallback } from "react";
import { Paper, Field } from "@/types/paper";
import { fetchPapers, fetchAllPapers } from "@/lib/api";

export type ViewMode = "microbiome" | "diabetes" | "both";

export function usePapers() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("both");

  const fetchData = useCallback(async (mode: ViewMode) => {
    setLoading(true);
    try {
      let results: Paper[];
      if (mode === "both") {
        results = await fetchAllPapers();
      } else {
        results = await fetchPapers(mode as Field);
        results.sort((a, b) => b.citationCount - a.citationCount);
      }
      setPapers(results);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch papers:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchData(viewMode);
  }, [fetchData, viewMode]);

  const changeView = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      fetchData(mode);
    },
    [fetchData]
  );

  return { papers, loading, lastUpdated, viewMode, changeView, refresh, fetchData };
}
