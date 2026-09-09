import { useMemo, useState } from "react";
import type { AcademicYear } from "../types/calendar";
import type { StudentPlan } from "../types/student";
import { formatLong } from "../services/dateUtils";
import { Button, Card, Select, TextInput } from "../components/common/ui";

interface Props {
  plans: StudentPlan[];
  academicYears: AcademicYear[];
  onOpen: (plan: StudentPlan) => void;
  onPrint: (plan: StudentPlan) => void;
  onDuplicate: (plan: StudentPlan) => void;
  onDelete: (plan: StudentPlan) => void;
  onNew: () => void;
  onBulkPrint: (plans: StudentPlan[]) => void;
  onBulkDownloadZip: (plans: StudentPlan[]) => void;
  exportProgress?: { done: number; total: number };
}

function nextPaymentDate(plan: StudentPlan): string {
  if (!plan.generatedPlan) return "—";
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = plan.generatedPlan.installments.find((i) => i.finalDueDate >= today);
  const target = upcoming ?? plan.generatedPlan.installments[plan.generatedPlan.installments.length - 1];
  return target ? formatLong(target.finalDueDate) : "—";
}

const ALL_PROGRAMS = "__all__";

export function SavedPlansPage({
  plans,
  onOpen,
  onPrint,
  onDuplicate,
  onDelete,
  onNew,
  onBulkPrint,
  onBulkDownloadZip,
  exportProgress
}: Props) {
  const [programFilter, setProgramFilter] = useState(ALL_PROGRAMS);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const programOptions = useMemo(() => {
    const names = new Set(plans.map((p) => p.program.programName).filter(Boolean));
    return Array.from(names).sort((a, b) => a.localeCompare(b, "tr"));
  }, [plans]);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (programFilter !== ALL_PROGRAMS && p.program.programName !== programFilter) return false;
      const start = p.generatedPlan?.programStartDate;
      if (dateFrom && (!start || start < dateFrom)) return false;
      if (dateTo && (!start || start > dateTo)) return false;
      return true;
    });
  }, [plans, programFilter, dateFrom, dateTo]);

  const isFiltering = programFilter !== ALL_PROGRAMS || dateFrom !== "" || dateTo !== "";
  const isExporting = !!exportProgress;

  function resetFilters() {
    setProgramFilter(ALL_PROGRAMS);
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Kayıtlı Planlar</h2>
        <Button onClick={onNew}>+ Yeni Plan Oluştur</Button>
      </div>

      {plans.length > 0 && (
        <Card title="Toplu İşlemler">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Program</span>
              <Select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="w-48">
                <option value={ALL_PROGRAMS}>Tüm Programlar</option>
                {programOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Başlangıç Tarihi (İtibaren)</span>
              <TextInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Başlangıç Tarihi (Kadar)</span>
              <TextInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
            {isFiltering && (
              <Button variant="ghost" onClick={resetFilters}>
                Filtreyi Temizle
              </Button>
            )}

            <div className="flex-1" />

            <div className="text-xs text-slate-500 pb-2">
              {isExporting
                ? `ZIP hazırlanıyor… (${exportProgress!.done}/${exportProgress!.total})`
                : `${filteredPlans.length} plan seçili${isFiltering ? "" : " (tümü)"}`}
            </div>
            <Button variant="secondary" disabled={filteredPlans.length === 0 || isExporting} onClick={() => onBulkPrint(filteredPlans)}>
              🖨 Seçilenleri Yazdır
            </Button>
            <Button disabled={filteredPlans.length === 0 || isExporting} onClick={() => onBulkDownloadZip(filteredPlans)}>
              ⬇ ZIP Olarak İndir
            </Button>
          </div>
        </Card>
      )}

      <Card>
        {plans.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Henüz kayıtlı bir plan yok.</p>
        ) : filteredPlans.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Filtreye uyan plan bulunamadı.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-2">Öğrenci</th>
                <th className="py-2 pr-2">Veli</th>
                <th className="py-2 pr-2">Program</th>
                <th className="py-2 pr-2">Başlangıç</th>
                <th className="py-2 pr-2">Bitiş</th>
                <th className="py-2 pr-2">Sonraki Ödeme</th>
                <th className="py-2 pr-2 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => (
                <tr key={plan.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2 font-medium text-slate-800">
                    {plan.student.firstName} {plan.student.lastName}
                  </td>
                  <td className="py-2 pr-2 text-slate-600">
                    {plan.parent.firstName} {plan.parent.lastName}
                  </td>
                  <td className="py-2 pr-2 text-slate-600">{plan.program.programName || "—"}</td>
                  <td className="py-2 pr-2 text-slate-600">
                    {plan.generatedPlan ? formatLong(plan.generatedPlan.programStartDate) : "—"}
                  </td>
                  <td className="py-2 pr-2 text-slate-600">
                    {plan.generatedPlan ? formatLong(plan.generatedPlan.programEndDate) : "—"}
                  </td>
                  <td className="py-2 pr-2 text-slate-600">{nextPaymentDate(plan)}</td>
                  <td className="py-2 pr-2">
                    <div className="flex justify-end gap-1 text-xs">
                      <button className="text-robomost-700 hover:underline" onClick={() => onOpen(plan)}>
                        Görüntüle/Düzenle
                      </button>
                      <span className="text-slate-300">|</span>
                      <button className="text-robomost-700 hover:underline" onClick={() => onPrint(plan)}>
                        Yazdır
                      </button>
                      <span className="text-slate-300">|</span>
                      <button className="text-robomost-700 hover:underline" onClick={() => onDuplicate(plan)}>
                        Kopyala
                      </button>
                      <span className="text-slate-300">|</span>
                      <button className="text-rose-500 hover:underline" onClick={() => onDelete(plan)}>
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
