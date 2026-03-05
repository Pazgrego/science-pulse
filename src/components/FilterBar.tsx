import { Search } from "lucide-react";
import { ALL_JOURNALS } from "@/types/paper";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  journalFilter: string;
  onJournalChange: (j: string) => void;
  sortBy: "citations" | "date";
  onSortChange: (s: "citations" | "date") => void;
  totalCount: number;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  journalFilter,
  onJournalChange,
  sortBy,
  onSortChange,
  totalCount,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search papers..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={journalFilter}
          onChange={(e) => onJournalChange(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Journals</option>
          {ALL_JOURNALS.sort().map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as "citations" | "date")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="citations">Most Cited</option>
          <option value="date">Newest</option>
        </select>

        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {totalCount} papers
        </span>
      </div>
    </div>
  );
}
