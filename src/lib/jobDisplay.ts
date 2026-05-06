import { JobData } from "./jobs";

export function formatJobPostedDate(value: unknown) {
  if (!value) return "";

  const rawDate =
    typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function"
      ? value.toDate()
      : new Date(value as string);

  if (!(rawDate instanceof Date) || Number.isNaN(rawDate.getTime())) return "";

  return rawDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function externalSourceLabel(source?: string | null) {
  if (!source) return "";
  const normalized = source.toLowerCase();
  if (normalized.includes("careerjet") || normalized.includes("jooble")) {
    return "Curated external listing";
  }
  return source;
}

export function jobSourceLabel(job: JobData) {
  return externalSourceLabel(job.source);
}
