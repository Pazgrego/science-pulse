export type Field = "microbiome" | "diabetes";

export interface Paper {
  id: string;
  pmid?: string;
  doi?: string;
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  abstract: string;
  citationCount: number;
  altmetricScore?: number;
  field: Field;
  url: string;
}

export const MICROBIOME_JOURNALS = [
  "Nature", "Nature Medicine", "Nature Metabolism",
  "Science", "Science Translational Medicine",
  "The Lancet", "Cell", "Cell Metabolism", "Cell Host & Microbe",
  "Gut", "Microbiome", "mSystems", "ISME Journal",
  "New England Journal of Medicine",
];

export const DIABETES_JOURNALS = [
  "Nature", "Nature Medicine", "Nature Metabolism",
  "Science", "Science Translational Medicine",
  "The Lancet", "Lancet Diabetes & Endocrinology",
  "Cell", "Cell Metabolism",
  "New England Journal of Medicine",
  "Diabetes Care", "Diabetologia", "Diabetes",
  "Journal of Clinical Endocrinology & Metabolism",
];

export const ALL_JOURNALS = [...new Set([...MICROBIOME_JOURNALS, ...DIABETES_JOURNALS])];
