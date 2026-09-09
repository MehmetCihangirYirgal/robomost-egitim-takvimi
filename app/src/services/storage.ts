import type { AcademicYear } from "../types/calendar";
import type { StudentPlan } from "../types/student";
import { SEED_ACADEMIC_YEARS } from "../data/seedAcademicYear2026_2027";

const PLANS_KEY = "robomost.plans.v1";
const YEARS_KEY = "robomost.academicYears.v1";

export function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota, etc.) — silently no-op;
    // the in-memory app state remains usable for the current session.
  }
}

// ---- Academic years ----

export function loadAcademicYears(): AcademicYear[] {
  const stored = readJSON<AcademicYear[] | null>(YEARS_KEY, null);
  if (stored && stored.length > 0) return stored;
  writeJSON(YEARS_KEY, SEED_ACADEMIC_YEARS);
  return SEED_ACADEMIC_YEARS;
}

export function saveAcademicYears(years: AcademicYear[]): void {
  writeJSON(YEARS_KEY, years);
}

export function saveAcademicYear(year: AcademicYear): void {
  const years = loadAcademicYears();
  const idx = years.findIndex((y) => y.id === year.id);
  if (idx >= 0) {
    years[idx] = year;
  } else {
    years.push(year);
  }
  saveAcademicYears(years);
}

// ---- Student plans ----

export function loadPlans(): StudentPlan[] {
  return readJSON<StudentPlan[]>(PLANS_KEY, []);
}

export function savePlan(plan: StudentPlan): void {
  const plans = loadPlans();
  const idx = plans.findIndex((p) => p.id === plan.id);
  if (idx >= 0) {
    plans[idx] = plan;
  } else {
    plans.push(plan);
  }
  writeJSON(PLANS_KEY, plans);
}

export function deletePlan(id: string): void {
  const plans = loadPlans().filter((p) => p.id !== id);
  writeJSON(PLANS_KEY, plans);
}

export function getPlan(id: string): StudentPlan | undefined {
  return loadPlans().find((p) => p.id === id);
}
