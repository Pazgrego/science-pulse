import { useState } from "react";
import { Paper } from "@/types/paper";
import { motion } from "framer-motion";
import { ExternalLink, ChevronDown, ChevronUp, Quote } from "lucide-react";

interface PaperCardProps {
  paper: Paper;
  index: number;
}

export default function PaperCard({ paper, index }: PaperCardProps) {
  const [expanded, setExpanded] = useState(false);

  const firstAuthor = paper.authors[0] || "Unknown";
  const authorDisplay =
    paper.authors.length > 1 ? `${firstAuthor} et al.` : firstAuthor;

  const abstractSnippet = paper.abstract.split(". ").slice(0, 2).join(". ") + ".";
  const isMicrobiome = paper.field === "microbiome";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isMicrobiome
                  ? "bg-microbiome-muted text-microbiome"
                  : "bg-diabetes-muted text-diabetes"
              }`}
            >
              {isMicrobiome ? "🦠 Microbiome" : "💉 Diabetes"}
            </span>
            <span className="text-xs text-muted-foreground">{paper.journal}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {paper.publicationDate}
            </span>
          </div>

          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-start gap-1.5"
          >
            <h3 className="font-display text-base font-semibold leading-snug text-foreground transition-colors group-hover/link:text-primary">
              {paper.title}
            </h3>
            <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/link:opacity-100" />
          </a>

          <p className="mt-1 text-sm text-muted-foreground">{authorDisplay}</p>

          <div className="mt-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {expanded ? paper.abstract : abstractSnippet}
            </p>
            {paper.abstract.split(". ").length > 2 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {expanded ? (
                  <>
                    Show less <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Read more <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-center gap-1 rounded-lg bg-muted px-3 py-2">
          <Quote className="h-3.5 w-3.5 text-popularity" />
          <span className="font-display text-lg font-bold text-foreground">
            {paper.citationCount}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            cited
          </span>
        </div>
      </div>
    </motion.article>
  );
}
