import { useEffect, useState, useMemo } from "react";
import { usePapers } from "@/hooks/usePapers";
import DashboardHeader from "@/components/DashboardHeader";
import PaperCard from "@/components/PaperCard";
import FilterBar from "@/components/FilterBar";
import LoadingSkeleton from "@/components/LoadingSkeleton";

const Index = () => {
  const { papers, loading, lastUpdated, viewMode, changeView, refresh, fetchData } =
    usePapers();
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [journalFilter, setJournalFilter] = useState("");
  const [sortBy, setSortBy] = useState<"citations" | "date">("citations");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    fetchData("both");
  }, [fetchData]);

  const filteredPapers = useMemo(() => {
    let result = [...papers];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.abstract.toLowerCase().includes(q) ||
          p.authors.some((a) => a.toLowerCase().includes(q))
      );
    }

    if (journalFilter) {
      result = result.filter((p) => p.journal === journalFilter);
    }

    if (sortBy === "citations") {
      result.sort((a, b) => b.citationCount - a.citationCount);
    } else {
      result.sort(
        (a, b) =>
          new Date(b.publicationDate).getTime() -
          new Date(a.publicationDate).getTime()
      );
    }

    return result;
  }, [papers, searchQuery, journalFilter, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        viewMode={viewMode}
        onViewChange={changeView}
        onRefresh={refresh}
        loading={loading}
        lastUpdated={lastUpdated}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
      />

      <main className="container mx-auto px-4 py-6">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          journalFilter={journalFilter}
          onJournalChange={setJournalFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalCount={filteredPapers.length}
        />

        <div className="mt-6 space-y-4">
          {loading ? (
            <LoadingSkeleton />
          ) : filteredPapers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No papers found
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or refreshing
              </p>
            </div>
          ) : (
            filteredPapers.map((paper, i) => (
              <PaperCard key={paper.id} paper={paper} index={i} />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
