import type { EducationPeriod } from "../../types/calendar";
import type { Weekday } from "../../types/calendar";
import { getLessonDatesForWeek } from "../../services/calendarEngine";
import { formatRange, formatShort } from "../../services/dateUtils";

interface Props {
  periods: EducationPeriod[];
  programDays: Weekday[];
  studentLessonDates: Set<string>;
}

export function GraphicCalendar({ periods, programDays, studentLessonDates }: Props) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-2 text-[11px] text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-robomost-500" /> Öğrencinin Eğitim Günü
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full border border-rose-400" /> Eğitim Yok / Tatil
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" /> Grup Dersi – Kayıt Öncesi
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {periods.map((period) => (
          <div key={period.id} className="border border-slate-200 rounded-lg p-2.5 avoid-break">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-semibold text-robomost-800">{period.label}</span>
              <span className="text-[10px] text-slate-500">{formatRange(period.startDate, period.endDate)}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {period.weeks.map((week) => {
                if (!week.isActive) {
                  return (
                    <span
                      key={week.id}
                      title={week.holidayReason}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-rose-300 text-rose-500 line-through bg-rose-50"
                    >
                      {formatShort(week.weekStart)}
                    </span>
                  );
                }
                const candidateDates = getLessonDatesForWeek(week, programDays);
                const isStudentWeek = candidateDates.some((d) => studentLessonDates.has(d));
                return (
                  <span
                    key={week.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isStudentWeek ? "bg-robomost-500 text-white font-medium" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {candidateDates.map(formatShort).join(" / ")}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
