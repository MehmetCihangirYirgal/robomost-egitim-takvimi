import { JS_DAY_TO_WEEKDAY, type Weekday } from "../types/calendar";

/** Offset (days) from the Monday of a week for each Turkish weekday name. */
export const WEEKDAY_OFFSET_FROM_MONDAY: Record<Weekday, number> = {
  Pazartesi: 0,
  Salı: 1,
  Çarşamba: 2,
  Perşembe: 3,
  Cuma: 4,
  Cumartesi: 5,
  Pazar: 6
};

/** Parses an ISO date string (YYYY-MM-DD) as a local-time midnight Date. */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addDaysISO(iso: string, days: number): string {
  return toISO(addDays(parseISO(iso), days));
}

/** Returns the Monday (start of week) for the given date. */
export function mondayOf(date: Date): Date {
  const jsDay = date.getDay(); // 0=Sun..6=Sat
  const offsetFromMonday = (jsDay + 6) % 7;
  return addDays(date, -offsetFromMonday);
}

export function mondayOfISO(iso: string): string {
  return toISO(mondayOf(parseISO(iso)));
}

export function sundayOf(date: Date): Date {
  return addDays(mondayOf(date), 6);
}

export function weekdayOf(iso: string): Weekday {
  return JS_DAY_TO_WEEKDAY[parseISO(iso).getDay()];
}

export function compareISO(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const TR_MONTHS_SHORT = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara"
];

const TR_MONTHS_LONG = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık"
];

/** "12 Eyl" */
export function formatShort(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${TR_MONTHS_SHORT[d.getMonth()]}`;
}

/** "12 Eylül 2026" */
export function formatLong(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${TR_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/** "12 Eylül – 4 Ekim 2026" (year shown once, at the end, unless years differ) */
export function formatRange(startIso: string, endIso: string): string {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  const startPart = `${start.getDate()} ${TR_MONTHS_LONG[start.getMonth()]}`;
  if (start.getFullYear() !== end.getFullYear()) {
    return `${startPart} ${start.getFullYear()} – ${end.getDate()} ${TR_MONTHS_LONG[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${startPart} – ${end.getDate()} ${TR_MONTHS_LONG[end.getMonth()]} ${end.getFullYear()}`;
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = currency === "TRY" ? "₺" : currency;
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Math.round(amount * 100) / 100);
  return `${formatted} ${symbol}`;
}

export function todayISO(): string {
  return toISO(new Date());
}
