import type { AcademicYear, EducationWeek } from "../../types/calendar";
import { addDaysISO, mondayOfISO } from "../dateUtils";

export interface AnchorSeed {
  anchor: string;
  isActive: boolean;
  holidayReason?: string;
}

export function buildTestAcademicYear(id: string, anchors: AnchorSeed[]): AcademicYear {
  const weeks: EducationWeek[] = anchors.map((seed, i) => {
    const weekStart = mondayOfISO(seed.anchor);
    const weekEnd = addDaysISO(weekStart, 6);
    return {
      id: `${id}-w${i + 1}`,
      sequence: i + 1,
      weekStart,
      weekEnd,
      isActive: seed.isActive,
      holidayReason: seed.holidayReason
    };
  });
  return { id, label: id, weeks };
}

// The exact 3-period academic calendar used in the spec's worked example
// (section 32): 12 active Saturdays across 3 education months, no holidays.
export const SCENARIO_ACADEMIC_YEAR = buildTestAcademicYear("ay-scenario", [
  { anchor: "2026-09-12", isActive: true },
  { anchor: "2026-09-19", isActive: true },
  { anchor: "2026-09-26", isActive: true },
  { anchor: "2026-10-03", isActive: true },
  { anchor: "2026-10-10", isActive: true },
  { anchor: "2026-10-17", isActive: true },
  { anchor: "2026-10-24", isActive: true },
  { anchor: "2026-10-31", isActive: true },
  { anchor: "2026-11-07", isActive: true },
  { anchor: "2026-11-14", isActive: true },
  { anchor: "2026-11-21", isActive: true },
  { anchor: "2026-11-28", isActive: true }
]);
