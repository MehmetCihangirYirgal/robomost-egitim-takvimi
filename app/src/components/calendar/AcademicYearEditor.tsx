import { useState } from "react";
import type { AcademicYear, EducationWeek } from "../../types/calendar";
import { calculateEducationPeriods } from "../../services/calendarEngine";
import { formatRange, formatShort, mondayOfISO, addDaysISO } from "../../services/dateUtils";
import { genId } from "../../services/storage";
import { Badge, Button, Card, Field, TextInput, Toggle } from "../common/ui";

interface Props {
  year: AcademicYear;
  onChange: (year: AcademicYear) => void;
}

export function AcademicYearEditor({ year, onChange }: Props) {
  const [newAnchor, setNewAnchor] = useState("");
  const [newHolidayReason, setNewHolidayReason] = useState("");
  const periods = calculateEducationPeriods(year);

  function updateWeek(id: string, patch: Partial<EducationWeek>) {
    onChange({ ...year, weeks: year.weeks.map((w) => (w.id === id ? { ...w, ...patch } : w)) });
  }

  function removeWeek(id: string) {
    const remaining = year.weeks.filter((w) => w.id !== id).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    onChange({ ...year, weeks: remaining.map((w, i) => ({ ...w, sequence: i + 1 })) });
  }

  function addWeek(isActive: boolean) {
    if (!newAnchor) return;
    const weekStart = mondayOfISO(newAnchor);
    const weekEnd = addDaysISO(weekStart, 6);
    const week: EducationWeek = {
      id: genId("w"),
      sequence: 0,
      weekStart,
      weekEnd,
      isActive,
      holidayReason: isActive ? undefined : newHolidayReason || "Tatil"
    };
    const all = [...year.weeks, week].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    onChange({ ...year, weeks: all.map((w, i) => ({ ...w, sequence: i + 1 })) });
    setNewAnchor("");
    setNewHolidayReason("");
  }

  return (
    <div className="space-y-4">
      <Card title={`${year.label} — Hafta Listesi`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-2 w-10">#</th>
                <th className="py-2 pr-2">Hafta Aralığı</th>
                <th className="py-2 pr-2 w-28">Durum</th>
                <th className="py-2 pr-2">Tatil Sebebi</th>
                <th className="py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {[...year.weeks]
                .sort((a, b) => a.sequence - b.sequence)
                .map((w) => (
                  <tr key={w.id} className="border-b border-slate-100">
                    <td className="py-1.5 pr-2 text-slate-400">{w.sequence}</td>
                    <td className="py-1.5 pr-2">{formatRange(w.weekStart, w.weekEnd)}</td>
                    <td className="py-1.5 pr-2">
                      <Toggle checked={w.isActive} onChange={(v) => updateWeek(w.id, { isActive: v, holidayReason: v ? undefined : w.holidayReason ?? "Tatil" })} label={w.isActive ? "Eğitim" : "Tatil"} />
                    </td>
                    <td className="py-1.5 pr-2">
                      {!w.isActive && (
                        <TextInput
                          value={w.holidayReason ?? ""}
                          onChange={(e) => updateWeek(w.id, { holidayReason: e.target.value })}
                        />
                      )}
                    </td>
                    <td className="py-1.5 text-center">
                      <button className="text-rose-400 hover:text-rose-600" onClick={() => removeWeek(w.id)} title="Haftayı kaldır">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 flex items-end gap-2">
          <Field label="Yeni hafta (o haftaya ait herhangi bir tarih)">
            <TextInput type="date" value={newAnchor} onChange={(e) => setNewAnchor(e.target.value)} />
          </Field>
          <Field label="Tatil sebebi (tatil olarak eklenecekse)">
            <TextInput value={newHolidayReason} onChange={(e) => setNewHolidayReason(e.target.value)} placeholder="Örn. Kurban Bayramı" />
          </Field>
          <Button type="button" variant="secondary" onClick={() => addWeek(true)}>
            + Eğitim Haftası Ekle
          </Button>
          <Button type="button" variant="danger" onClick={() => addWeek(false)}>
            + Tatil Haftası Ekle
          </Button>
        </div>
      </Card>

      <Card title="Hesaplanan Eğitim Ayları (önizleme)">
        <div className="grid grid-cols-2 gap-3">
          {periods.map((p) => (
            <div key={p.id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-slate-700">{p.label}</span>
                {p.activeWeeks.length !== 4 && <Badge tone="warn">{p.activeWeeks.length}/4 hafta</Badge>}
              </div>
              <div className="text-xs text-slate-500">{formatRange(p.startDate, p.endDate)}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {p.weeks.map((w) => (
                  <span
                    key={w.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      w.isActive ? "bg-robomost-100 text-robomost-700" : "bg-rose-50 text-rose-500 line-through"
                    }`}
                    title={w.holidayReason}
                  >
                    {formatShort(w.weekStart)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
