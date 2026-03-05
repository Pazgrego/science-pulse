import { useState, useCallback, useRef } from "react";

export interface ResearchSnapshot {
  model: string;
  sampleSize: string;
  method: string;
  keyFinding: string;
  mainLimitation: string;
  stage: string;
}

// In-memory cache persists across renders
const snapshotCache = new Map<string, ResearchSnapshot>();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function useResearchSnapshot(paperId: string, abstract: string) {
  const [snapshot, setSnapshot] = useState<ResearchSnapshot | null>(
    snapshotCache.get(paperId) || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);

  const fetchSnapshot = useCallback(async () => {
    if (fetchedRef.current || snapshotCache.has(paperId)) {
      if (snapshotCache.has(paperId)) setSnapshot(snapshotCache.get(paperId)!);
      return;
    }
    if (!abstract || abstract === "Abstract not available.") return;

    fetchedRef.current = true;
    setLoading(true);
    setError(false);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/parse-abstract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ abstract, paperId }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.snapshot) {
        snapshotCache.set(paperId, data.snapshot);
        setSnapshot(data.snapshot);
      } else {
        throw new Error("No snapshot in response");
      }
    } catch (e) {
      console.error("Snapshot fetch error:", e);
      setError(true);
      fetchedRef.current = false; // allow retry
    } finally {
      setLoading(false);
    }
  }, [paperId, abstract]);

  return { snapshot, loading, error, fetchSnapshot };
}
