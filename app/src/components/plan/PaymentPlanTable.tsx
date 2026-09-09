import type { PaymentInstallment, PaymentPlan } from "../../types/student";
import { Badge, Button, Card, NumberInput, TextInput } from "../common/ui";
import { formatCurrency, formatShort } from "../../services/dateUtils";
import { genId } from "../../services/storage";

interface Props {
  plan: PaymentPlan;
  currency: string;
  onChange: (plan: PaymentPlan) => void;
  onRegenerate: () => void;
}

function recomputeTotals(plan: PaymentPlan): PaymentPlan {
  const extraFeesTotal = plan.installments.reduce((s, i) => s + i.appliedExtraFees.reduce((s2, f) => s2 + f.amount, 0), 0);
  const grandTotal = plan.installments.reduce((s, i) => s + i.finalAmount, 0);
  return {
    ...plan,
    totals: {
      ...plan.totals,
      extraFeesTotal,
      educationTotal: grandTotal - extraFeesTotal,
      grandTotal
    }
  };
}

export function PaymentPlanTable({ plan, currency, onChange, onRegenerate }: Props) {
  function updateInstallment(id: string, patch: Partial<PaymentInstallment>) {
    const installments = plan.installments.map((i) => (i.id === id ? { ...i, ...patch } : i));
    onChange(recomputeTotals({ ...plan, installments }));
  }

  function removeInstallment(id: string) {
    const installments = plan.installments
      .filter((i) => i.id !== id)
      .map((i, idx) => ({ ...i, installmentNumber: idx + 1 }));
    onChange(recomputeTotals({ ...plan, installments }));
  }

  function addInstallment() {
    const n = plan.installments.length + 1;
    const newRow: PaymentInstallment = {
      id: genId("inst-manual"),
      installmentNumber: n,
      periodLabel: "",
      lessonDates: [],
      activeWeekCount: 4,
      isPartialPeriod: false,
      calculatedDueDate: "",
      finalDueDate: "",
      isDueDateOverridden: true,
      calculatedAmount: 0,
      finalAmount: 0,
      isAmountOverridden: true,
      appliedExtraFees: [],
      isManuallyAdded: true,
      description: "Manuel eklendi"
    };
    onChange(recomputeTotals({ ...plan, installments: [...plan.installments, newRow] }));
  }

  return (
    <Card
      title="Ödeme Planı"
      actions={
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onRegenerate}>
            ↻ Yeniden Hesapla
          </Button>
          <Button type="button" variant="secondary" onClick={addInstallment}>
            + Satır Ekle
          </Button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm plan-table">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-2 w-10">#</th>
              <th className="py-2 pr-2">Eğitim Dönemi</th>
              <th className="py-2 pr-2">Ders Sayısı</th>
              <th className="py-2 pr-2">Ders Tarihleri</th>
              <th className="py-2 pr-2 w-36">Ödeme Son Tarihi</th>
              <th className="py-2 pr-2 w-32">Tutar</th>
              <th className="py-2 pr-2">Açıklama</th>
              <th className="py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {plan.installments.map((inst) => (
              <tr key={inst.id} className="border-b border-slate-100 align-top">
                <td className="py-2 pr-2 text-slate-500">{inst.installmentNumber}</td>
                <td className="py-2 pr-2">
                  <TextInput
                    value={inst.periodLabel}
                    onChange={(e) => updateInstallment(inst.id, { periodLabel: e.target.value })}
                  />
                  {inst.isPartialPeriod && (
                    <div className="mt-1">
                      <Badge tone="warn">Kısmi Eğitim Dönemi</Badge>
                    </div>
                  )}
                </td>
                <td className="py-2 pr-2">
                  <NumberInput
                    className="w-20"
                    min={0}
                    value={inst.activeWeekCount}
                    onChange={(e) => updateInstallment(inst.id, { activeWeekCount: Number(e.target.value) })}
                  />
                </td>
                <td className="py-2 pr-2 text-xs text-slate-500 max-w-[220px]">
                  {inst.lessonDates.map(formatShort).join(", ") || "—"}
                </td>
                <td className="py-2 pr-2">
                  <TextInput
                    type="date"
                    value={inst.finalDueDate}
                    onChange={(e) =>
                      updateInstallment(inst.id, {
                        finalDueDate: e.target.value,
                        isDueDateOverridden: e.target.value !== inst.calculatedDueDate
                      })
                    }
                  />
                  {inst.isDueDateOverridden && (
                    <div className="mt-1">
                      <Badge tone="muted">Manuel düzenlendi</Badge>
                    </div>
                  )}
                </td>
                <td className="py-2 pr-2">
                  <NumberInput
                    className="w-28"
                    min={0}
                    value={inst.finalAmount}
                    onChange={(e) =>
                      updateInstallment(inst.id, {
                        finalAmount: Number(e.target.value),
                        isAmountOverridden: Number(e.target.value) !== inst.calculatedAmount
                      })
                    }
                  />
                  {inst.isAmountOverridden && (
                    <div className="mt-1">
                      <Badge tone="muted">Manuel düzenlendi</Badge>
                    </div>
                  )}
                  {inst.appliedExtraFees.length > 0 && (
                    <div className="mt-1 text-[11px] text-slate-400">
                      + {inst.appliedExtraFees.map((f) => f.label).join(", ")}
                    </div>
                  )}
                </td>
                <td className="py-2 pr-2">
                  <TextInput
                    value={inst.description ?? ""}
                    onChange={(e) => updateInstallment(inst.id, { description: e.target.value })}
                  />
                </td>
                <td className="py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeInstallment(inst.id)}
                    className="text-rose-400 hover:text-rose-600"
                    title="Satırı sil"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-64 text-sm space-y-1">
          <div className="flex justify-between text-slate-500">
            <span>Eğitim Bedeli</span>
            <span>{formatCurrency(plan.totals.educationTotal, currency)}</span>
          </div>
          {plan.totals.extraFeesTotal > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Ek Ücretler</span>
              <span>{formatCurrency(plan.totals.extraFeesTotal, currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-1">
            <span>Genel Toplam</span>
            <span>{formatCurrency(plan.totals.grandTotal, currency)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
