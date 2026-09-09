import type { AcademicYear, EducationWeek } from "../types/calendar";
import { mondayOfISO, addDaysISO } from "../services/dateUtils";

// Each entry is anchored on the Cumartesi (Saturday) date of the "hafta sonu"
// pair given in the official ROBOMOST 2026-2027 academic calendar. The Monday
// of that calendar week is derived (not hand-typed) so the week span is always
// correct regardless of anchor choice.
interface WeekSeed {
  anchor: string; // ISO date of the Saturday in that active/holiday weekend
  isActive: boolean;
  holidayReason?: string;
}

const RAW_WEEKS: WeekSeed[] = [
  // 1. Eğitim Ayı — 12 Eylül – 4 Ekim 2026
  { anchor: "2026-09-12", isActive: true },
  { anchor: "2026-09-19", isActive: true },
  { anchor: "2026-09-26", isActive: true },
  { anchor: "2026-10-03", isActive: true },
  // 2. Eğitim Ayı — 10 Ekim – 1 Kasım 2026
  { anchor: "2026-10-10", isActive: true },
  { anchor: "2026-10-17", isActive: true },
  { anchor: "2026-10-24", isActive: true },
  { anchor: "2026-10-31", isActive: true },
  // 3. Eğitim Ayı — 7–29 Kasım 2026
  { anchor: "2026-11-07", isActive: true },
  { anchor: "2026-11-14", isActive: true },
  { anchor: "2026-11-21", isActive: true },
  { anchor: "2026-11-28", isActive: true },
  // 4. Eğitim Ayı — 5–27 Aralık 2026
  { anchor: "2026-12-05", isActive: true },
  { anchor: "2026-12-12", isActive: true },
  { anchor: "2026-12-19", isActive: true },
  { anchor: "2026-12-26", isActive: true },
  // 5. Eğitim Ayı — 2–24 Ocak 2027
  { anchor: "2027-01-02", isActive: true },
  { anchor: "2027-01-09", isActive: true },
  { anchor: "2027-01-16", isActive: true },
  { anchor: "2027-01-23", isActive: true },
  // 6. Eğitim Ayı — 30 Ocak – 21 Şubat 2027
  { anchor: "2027-01-30", isActive: true },
  { anchor: "2027-02-06", isActive: true },
  { anchor: "2027-02-13", isActive: true },
  { anchor: "2027-02-20", isActive: true },
  // 7. Eğitim Ayı — 27 Şubat – 21 Mart 2027
  { anchor: "2027-02-27", isActive: true },
  { anchor: "2027-03-06", isActive: true },
  { anchor: "2027-03-13", isActive: true },
  { anchor: "2027-03-20", isActive: true },
  // 8. Eğitim Ayı — 27 Mart – 18 Nisan 2027
  { anchor: "2027-03-27", isActive: true },
  { anchor: "2027-04-03", isActive: true },
  { anchor: "2027-04-10", isActive: true },
  { anchor: "2027-04-17", isActive: true },
  // 9. Eğitim Ayı — 24 Nisan – 30 Mayıs 2027 (2 tatil haftası içerir)
  { anchor: "2027-04-24", isActive: true },
  { anchor: "2027-05-01", isActive: false, holidayReason: "Resmî Tatil" },
  { anchor: "2027-05-08", isActive: true },
  { anchor: "2027-05-15", isActive: false, holidayReason: "Kurban Bayramı" },
  { anchor: "2027-05-22", isActive: true },
  { anchor: "2027-05-29", isActive: true },
  // 10. Eğitim Ayı — 5–27 Haziran 2027 (Dönem Sonu: 27 Haziran 2027)
  { anchor: "2027-06-05", isActive: true },
  { anchor: "2027-06-12", isActive: true },
  { anchor: "2027-06-19", isActive: true },
  { anchor: "2027-06-26", isActive: true }
];

function buildWeeks(): EducationWeek[] {
  return RAW_WEEKS.map((seed, i) => {
    const weekStart = mondayOfISO(seed.anchor);
    const weekEnd = addDaysISO(weekStart, 6);
    return {
      id: `w-2026-2027-${i + 1}`,
      sequence: i + 1,
      weekStart,
      weekEnd,
      isActive: seed.isActive,
      holidayReason: seed.holidayReason
    };
  });
}

export const ACADEMIC_YEAR_2026_2027: AcademicYear = {
  id: "ay-2026-2027",
  label: "2026–2027",
  note: "Dönem Sonu: 27 Haziran 2027 · 40 aktif eğitim haftası · 10 eğitim ayı",
  weeks: buildWeeks()
};

export const SEED_ACADEMIC_YEARS: AcademicYear[] = [ACADEMIC_YEAR_2026_2027];
