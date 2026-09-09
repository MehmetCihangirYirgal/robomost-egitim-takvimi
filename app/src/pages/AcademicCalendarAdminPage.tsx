import { useState } from "react";
import type { AcademicYear } from "../types/calendar";
import { AcademicYearEditor } from "../components/calendar/AcademicYearEditor";
import { Button, Card, Field, TextInput } from "../components/common/ui";
import { genId } from "../services/storage";

interface Props {
  academicYears: AcademicYear[];
  onChange: (years: AcademicYear[]) => void;
}

export function AcademicCalendarAdminPage({ academicYears, onChange }: Props) {
  const [selectedId, setSelectedId] = useState(academicYears[0]?.id);
  const [newLabel, setNewLabel] = useState("");
  const selected = academicYears.find((y) => y.id === selectedId) ?? academicYears[0];

  function updateYear(updated: AcademicYear) {
    onChange(academicYears.map((y) => (y.id === updated.id ? updated : y)));
  }

  function addYear() {
    if (!newLabel.trim()) return;
    const year: AcademicYear = { id: genId("ay"), label: newLabel.trim(), weeks: [] };
    onChange([...academicYears, year]);
    setSelectedId(year.id);
    setNewLabel("");
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Akademik Takvim Yönetimi</h2>

      <Card>
        <div className="flex items-end gap-2">
          <Field label="Akademik Yıl Seç">
            <select
              className="w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={selected?.id}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Yeni Akademik Yıl Ekle">
            <TextInput value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Örn. 2027-2028" />
          </Field>
          <Button variant="secondary" onClick={addYear}>
            + Ekle
          </Button>
        </div>
      </Card>

      {selected && <AcademicYearEditor year={selected} onChange={updateYear} />}
    </div>
  );
}
