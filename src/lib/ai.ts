export interface ResearchSnapshot {
  model: string;
  sampleSize: string;
  method: string;
  keyFinding: string;
  mainLimitation: string;
  stage: string;
}

const CACHE_KEY = "research-snapshots-v1";
const snapshotCache = new Map<string, ResearchSnapshot>();

function loadCache() {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const entries = JSON.parse(stored) as [string, ResearchSnapshot][];
      entries.forEach(([k, v]) => snapshotCache.set(k, v));
    }
  } catch {
    // ignore
  }
}

function saveCache() {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(Array.from(snapshotCache.entries()))
    );
  } catch {
    // ignore
  }
}

loadCache();

const PROMPT = `You are a biomedical research analyst. Extract structured information from the following research paper abstract and return ONLY a valid JSON object with exactly these 6 fields:

{
  "model": "<human | mouse | in vitro | meta-analysis | other>",
  "sampleSize": "<e.g. n=120 patients — or N/A if not mentioned>",
  "method": "<e.g. RCT, observational study, 16S rRNA sequencing, GWAS>",
  "keyFinding": "<one concise sentence with specific numbers or statistics if available>",
  "mainLimitation": "<one sentence describing the primary limitation>",
  "stage": "<Basic | Pre-clinical | Clinical | Review>"
}

Stage definitions:
- Basic: bench/lab research, in vitro, cell lines
- Pre-clinical: animal models with translational intent
- Clinical: human trials, human observational studies, epidemiology
- Review: systematic review, meta-analysis, narrative review

Return only the JSON object — no markdown, no explanation.

Abstract:
`;

export async function extractResearchSnapshot(
  paperId: string,
  abstract: string
): Promise<ResearchSnapshot> {
  if (snapshotCache.has(paperId)) {
    return snapshotCache.get(paperId)!;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT + abstract }] }],
        generationConfig: { maxOutputTokens: 400, temperature: 0 },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "(unreadable)");
    throw new Error(`Gemini API error: ${response.status} — ${body}`);
  }

  const data = await response.json();
  const text: string =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Gemini response");

  const snapshot = JSON.parse(jsonMatch[0]) as ResearchSnapshot;

  snapshotCache.set(paperId, snapshot);
  saveCache();

  return snapshot;
}
