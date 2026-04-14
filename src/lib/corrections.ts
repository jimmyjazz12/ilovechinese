export interface ErrorReport {
  id: string;
  userId: string;
  word: string;
  type: "wrong_translation" | "wrong_pinyin" | "wrong_tone" | "other";
  field: string; // "french", "pinyin", etc.
  currentValue: string;
  suggestedValue: string;
  comment: string;
  date: string;
  status: "pending" | "approved" | "rejected";
}

const REPORTS_KEY = "error_reports";
const OVERRIDES_KEY = "correction_overrides";

/** Save an error report to localStorage (global, not user-prefixed) */
export function reportError(
  report: Omit<ErrorReport, "id" | "date" | "status">
): void {
  const reports = getErrorReports();
  const newReport: ErrorReport = {
    ...report,
    id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    status: "pending",
  };
  reports.push(newReport);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

/** Get all error reports */
export function getErrorReports(): ErrorReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

/** Update report status (admin) */
export function updateReportStatus(
  id: string,
  status: "approved" | "rejected"
): void {
  const reports = getErrorReports();
  const idx = reports.findIndex((r) => r.id === id);
  if (idx !== -1) {
    reports[idx].status = status;
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  }
}

/** Correction overrides — applied at runtime over static JSON data */
export function getOverrides(): Record<string, Record<string, string>> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

/** Apply an approved correction as an override */
export function applyCorrection(
  word: string,
  field: string,
  value: string
): void {
  const overrides = getOverrides();
  if (!overrides[word]) overrides[word] = {};
  overrides[word][field] = value;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

/** Get the display value for a word field, checking overrides first */
export function getCorrectedValue(
  word: string,
  field: string,
  originalValue: string
): string {
  const overrides = getOverrides();
  return overrides[word]?.[field] ?? originalValue;
}
