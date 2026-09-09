import { WEEKDAYS, type Weekday } from "../../types/calendar";
import type { ProgramInfo } from "../../types/student";
import { Card, Field, NumberInput, TextInput } from "../common/ui";

interface Props {
  program: ProgramInfo;
  onChange: (p: ProgramInfo) => void;
  errors: Record<string, string>;
}

const DURATION_OPTIONS = [40, 80, 120, 160, 200];

export function ProgramForm({ program, onChange, errors }: Props) {
  function toggleDay(day: Weekday) {
    const has = program.programDays.includes(day);
    const next = has ? program.programDays.filter((d) => d !== day) : [...program.programDays, day];
    onChange({ ...program, programDays: next });
  }

  return (
    <Card title="Program Bilgileri">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Program Adı" required error={errors.programName}>
          <TextInput
            value={program.programName}
            onChange={(e) => onChange({ ...program, programName: e.target.value })}
            placeholder="Örn. Robotik ve Kodlama"
          />
        </Field>

        <Field label="Program Günü" required error={errors.programDays}>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {WEEKDAYS.map((day) => (
              <button
                type="button"
                key={day}
                onClick={() => toggleDay(day)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                  program.programDays.includes(day)
                    ? "bg-robomost-600 border-robomost-600 text-white"
                    : "bg-white border-slate-300 text-slate-600 hover:border-robomost-400"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Ders Başlangıç Saati">
          <TextInput
            type="time"
            value={program.lessonStartTime}
            onChange={(e) => onChange({ ...program, lessonStartTime: e.target.value })}
          />
        </Field>
        <Field label="Ders Bitiş Saati">
          <TextInput
            type="time"
            value={program.lessonEndTime}
            onChange={(e) => onChange({ ...program, lessonEndTime: e.target.value })}
          />
        </Field>

        <Field label="Haftalık Eğitim Süresi (dakika)">
          <div className="flex flex-wrap gap-1.5">
            {DURATION_OPTIONS.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => onChange({ ...program, weeklyDurationMinutes: d })}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                  program.weeklyDurationMinutes === d
                    ? "bg-robomost-600 border-robomost-600 text-white"
                    : "bg-white border-slate-300 text-slate-600 hover:border-robomost-400"
                }`}
              >
                {d} dk
              </button>
            ))}
            <NumberInput
              className="w-24"
              value={program.weeklyDurationMinutes}
              onChange={(e) => onChange({ ...program, weeklyDurationMinutes: Number(e.target.value) })}
            />
          </div>
        </Field>
      </div>
    </Card>
  );
}
