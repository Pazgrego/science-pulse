import { Paper, Field, MICROBIOME_JOURNALS, DIABETES_JOURNALS } from "@/types/paper";

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1";

function getDateRange(): { minDate: string; maxDate: string } {
  const now = new Date();
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  return { minDate: fmt(yearAgo), maxDate: fmt(now) };
}

function buildJournalQuery(journals: string[]): string {
  return journals.map((j) => `"${j}"[Journal]`).join(" OR ");
}

async function searchPubMed(field: Field): Promise<string[]> {
  const { minDate, maxDate } = getDateRange();
  const journals = field === "microbiome" ? MICROBIOME_JOURNALS : DIABETES_JOURNALS;
  const topicTerm = field === "microbiome" ? "microbiome[Title/Abstract]" : "diabetes[Title/Abstract]";
  const journalQuery = buildJournalQuery(journals);
  const query = `(${topicTerm}) AND (${journalQuery})`;

  const params = new URLSearchParams({
    db: "pubmed",
    term: query,
    retmax: "40",
    sort: "relevance",
    mindate: minDate,
    maxdate: maxDate,
    datetype: "pdat",
    retmode: "json",
  });

  try {
    const res = await fetch(`${PUBMED_BASE}/esearch.fcgi?${params}`);
    const data = await res.json();
    return data.esearchresult?.idlist || [];
  } catch (e) {
    console.error("PubMed search error:", e);
    return [];
  }
}

interface PubMedArticle {
  uid: string;
  title: string;
  authors: { name: string }[];
  source: string;
  pubdate: string;
  elocationid?: string;
  sortpubdate?: string;
}

async function fetchPubMedDetails(ids: string[]): Promise<PubMedArticle[]> {
  if (ids.length === 0) return [];
  const params = new URLSearchParams({
    db: "pubmed",
    id: ids.join(","),
    retmode: "json",
  });

  try {
    const res = await fetch(`${PUBMED_BASE}/esummary.fcgi?${params}`);
    const data = await res.json();
    const result = data.result || {};
    return ids.map((id) => result[id]).filter(Boolean);
  } catch (e) {
    console.error("PubMed details error:", e);
    return [];
  }
}

async function fetchAbstracts(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const params = new URLSearchParams({
    db: "pubmed",
    id: ids.join(","),
    retmode: "xml",
    rettype: "abstract",
  });

  try {
    const res = await fetch(`${PUBMED_BASE}/efetch.fcgi?${params}`);
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const articles = xml.querySelectorAll("PubmedArticle");
    const abstracts: Record<string, string> = {};
    articles.forEach((article) => {
      const pmid = article.querySelector("PMID")?.textContent || "";
      const abstractTexts = article.querySelectorAll("AbstractText");
      const abs = Array.from(abstractTexts)
        .map((el) => el.textContent)
        .join(" ");
      if (pmid && abs) abstracts[pmid] = abs;
    });
    return abstracts;
  } catch (e) {
    console.error("PubMed abstracts error:", e);
    return {};
  }
}

function extractDoi(article: PubMedArticle): string | undefined {
  if (article.elocationid?.startsWith("doi:")) {
    return article.elocationid.replace("doi: ", "").replace("doi:", "");
  }
  return undefined;
}

async function fetchCitationCounts(dois: string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const validDois = dois.filter(Boolean);
  
  // Batch in groups of 5 to avoid rate limiting
  for (let i = 0; i < validDois.length; i += 5) {
    const batch = validDois.slice(i, i + 5);
    const promises = batch.map(async (doi) => {
      try {
        const res = await fetch(
          `${SEMANTIC_SCHOLAR_BASE}/paper/DOI:${doi}?fields=citationCount`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
          const data = await res.json();
          counts[doi] = data.citationCount || 0;
        }
      } catch {
        // silently fail for individual papers
      }
    });
    await Promise.all(promises);
    // Small delay between batches
    if (i + 5 < validDois.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return counts;
}

export async function fetchPapers(field: Field): Promise<Paper[]> {
  const ids = await searchPubMed(field);
  if (ids.length === 0) return [];

  const [articles, abstracts] = await Promise.all([
    fetchPubMedDetails(ids),
    fetchAbstracts(ids),
  ]);

  const dois = articles.map(extractDoi).filter(Boolean) as string[];
  const citations = await fetchCitationCounts(dois);

  return articles.map((article): Paper => {
    const doi = extractDoi(article);
    return {
      id: article.uid,
      pmid: article.uid,
      doi,
      title: article.title || "Untitled",
      authors: (article.authors || []).map((a) => a.name),
      journal: article.source || "Unknown",
      publicationDate: article.pubdate || article.sortpubdate || "",
      abstract: abstracts[article.uid] || "Abstract not available.",
      citationCount: doi ? citations[doi] || 0 : 0,
      field,
      url: doi
        ? `https://doi.org/${doi}`
        : `https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`,
    };
  });
}

export async function fetchAllPapers(): Promise<Paper[]> {
  const [microbiome, diabetes] = await Promise.all([
    fetchPapers("microbiome"),
    fetchPapers("diabetes"),
  ]);

  // Deduplicate by PMID
  const seen = new Set<string>();
  const all: Paper[] = [];
  for (const p of [...microbiome, ...diabetes]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      all.push(p);
    }
  }
  return all.sort((a, b) => b.citationCount - a.citationCount);
}
