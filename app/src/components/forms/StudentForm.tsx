import type { ParentInfo, StudentInfo } from "../../types/student";
import { Card, Field, TextInput } from "../common/ui";

interface Props {
  parent: ParentInfo;
  student: StudentInfo;
  onParentChange: (p: ParentInfo) => void;
  onStudentChange: (s: StudentInfo) => void;
  errors: Record<string, string>;
}

export function StudentForm({ parent, student, onParentChange, onStudentChange, errors }: Props) {
  return (
    <Card title="Veli ve Öğrenci Bilgileri">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Veli Adı" required error={errors.parent}>
          <TextInput
            value={parent.firstName}
            onChange={(e) => onParentChange({ ...parent, firstName: e.target.value })}
            placeholder="Örn. Ayşe"
          />
        </Field>
        <Field label="Veli Soyadı" required>
          <TextInput
            value={parent.lastName}
            onChange={(e) => onParentChange({ ...parent, lastName: e.target.value })}
            placeholder="Örn. Yılmaz"
          />
        </Field>
        <Field label="Öğrenci Adı" required error={errors.student}>
          <TextInput
            value={student.firstName}
            onChange={(e) => onStudentChange({ ...student, firstName: e.target.value })}
            placeholder="Örn. Deniz"
          />
        </Field>
        <Field label="Öğrenci Soyadı" required>
          <TextInput
            value={student.lastName}
            onChange={(e) => onStudentChange({ ...student, lastName: e.target.value })}
            placeholder="Örn. Yılmaz"
          />
        </Field>
      </div>
    </Card>
  );
}
