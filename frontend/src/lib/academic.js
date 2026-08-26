export const DEFAULT_DEPARTMENTS = [
  "Computer Engineering",
  "Information Technology",
  "Electronics & Telecommunication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Chemical Engineering",
  "Artificial Intelligence & Data Science",
  "Biotechnology",
  "Administration",
];

export const DEFAULT_CLASSES = [
  "FE-A",
  "FE-B",
  "SE-A",
  "SE-B",
  "TE-A",
  "TE-B",
  "BE-A",
  "BE-B",
];

export const DEFAULT_YEARS = [
  { value: "1", label: "1st Year (FE)" },
  { value: "2", label: "2nd Year (SE)" },
  { value: "3", label: "3rd Year (TE)" },
  { value: "4", label: "4th Year (BE)" },
];

export const YEAR_LABEL_MAP = {
  "1": "1st Year (FE)",
  "2": "2nd Year (SE)",
  "3": "3rd Year (TE)",
  "4": "4th Year (BE)",
};

export function getYearFromClass(className) {
  if (!className) return "1";
  const s = String(className).toUpperCase().trim();
  if (s.startsWith("FE") || s.startsWith("FY") || s.startsWith("1") || s.includes("FIRST")) return "1";
  if (s.startsWith("SE") || s.startsWith("SY") || s.startsWith("2") || s.includes("SECOND")) return "2";
  if (s.startsWith("TE") || s.startsWith("TY") || s.startsWith("3") || s.includes("THIRD")) return "3";
  if (s.startsWith("BE") || s.startsWith("FINAL") || s.startsWith("4") || s.includes("FOURTH")) return "4";
  return "1";
}

export function getYearLabel(year) {
  if (!year) return "";
  return YEAR_LABEL_MAP[String(year)] || `${year} Year`;
}
