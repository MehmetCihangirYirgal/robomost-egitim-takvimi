import type { ExtraFee, ExtraFeeAppliesTo, PaymentSettings } from "../../types/student";
import { Button, Card, Field, NumberInput, Select, TextInput, Toggle } from "../common/ui";
import { genId } from "../../services/storage";

interface Props {
  payment: PaymentSettings;
  onChange: (p: PaymentSettings) => void;
  errors: Record<string, string>;
}

const APPLIES_TO_LABEL: Record<ExtraFeeAppliesTo, string> = {
  "first-installment": "İlk taksit",
  "last-installment": "Son taksit",
  "all-installments": "Tüm taksitler",
  specific: "Belirli taksit(ler)"
};

export function PaymentSettingsForm({ payment, onChange, errors }: Props) {
  function addFee() {
    const fee: ExtraFee = { id: genId("fee"), label: "", amount: 0, appliesTo: "first-installment" };
    onChange({ ...payment, extraFees: [...payment.extraFees, fee] });
  }
  function updateFee(id: string, patch: Partial<ExtraFee>) {
    onChange({ ...payment, extraFees: payment.extraFees.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  }
  function removeFee(id: string) {
    onChange({ ...payment, extraFees: payment.extraFees.filter((f) => f.id !== id) });
  }

  return (
    <Card title="Ücret ve Ödeme Ayarları">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="4 Haftalık Eğitim Ayı Ücreti" required error={errors.fullEducationMonthPrice}>
            <NumberInput
              min={0}
              value={payment.fullEducationMonthPrice}
              onChange={(e) => onChange({ ...payment, fullEducationMonthPrice: Number(e.target.value) })}
            />
          </Field>
          <Field label="Para Birimi">
            <Select value={payment.currency} onChange={(e) => onChange({ ...payment, currency: e.target.value })}>
              <option value="TRY">TRY / ₺</option>
              <option value="USD">USD / $</option>
              <option value="EUR">EUR / €</option>
            </Select>
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">Opsiyonel Ek Ücretler</span>
            <Button type="button" variant="ghost" onClick={addFee}>
              + Ek Ücret Ekle
            </Button>
          </div>
          {payment.extraFees.length === 0 && <p className="text-xs text-slate-400">Ek ücret tanımlanmadı.</p>}
          <div className="space-y-2">
            {payment.extraFees.map((fee) => (
              <div key={fee.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-md p-2">
                <TextInput
                  className="col-span-4"
                  placeholder="Örn. Eğitim seti ücreti"
                  value={fee.label}
                  onChange={(e) => updateFee(fee.id, { label: e.target.value })}
                />
                <NumberInput
                  className="col-span-3"
                  min={0}
                  value={fee.amount}
                  onChange={(e) => updateFee(fee.id, { amount: Number(e.target.value) })}
                />
                <Select
                  className="col-span-4"
                  value={fee.appliesTo}
                  onChange={(e) => updateFee(fee.id, { appliesTo: e.target.value as ExtraFeeAppliesTo })}
                >
                  {(Object.keys(APPLIES_TO_LABEL) as ExtraFeeAppliesTo[]).map((k) => (
                    <option key={k} value={k}>
                      {APPLIES_TO_LABEL[k]}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  onClick={() => removeFee(fee.id)}
                  className="col-span-1 text-rose-500 hover:text-rose-700 text-sm"
                  title="Kaldır"
                >
                  ✕
                </button>
                {fee.appliesTo === "specific" && (
                  <TextInput
                    className="col-span-12"
                    placeholder="Taksit numaraları (virgülle, örn. 1,3)"
                    value={fee.specificInstallments?.join(",") ?? ""}
                    onChange={(e) =>
                      updateFee(fee.id, {
                        specificInstallments: e.target.value
                          .split(",")
                          .map((s) => Number(s.trim()))
                          .filter((n) => !Number.isNaN(n) && n > 0)
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <Toggle
            checked={payment.useCustomPaymentPlan}
            onChange={(v) => onChange({ ...payment, useCustomPaymentPlan: v, customMode: v ? payment.customMode ?? "fixed-day-of-month" : undefined })}
            label="Özel Ödeme Planı Kullan"
          />
          {payment.useCustomPaymentPlan && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Field label="Yöntem">
                <Select
                  value={payment.customMode}
                  onChange={(e) => onChange({ ...payment, customMode: e.target.value as PaymentSettings["customMode"] })}
                >
                  <option value="fixed-day-of-month">Sabit Ödeme Günü (ayın X'i)</option>
                  <option value="manual">Manuel Ödeme Tarihi (plan oluşunca satır satır düzenlenir)</option>
                </Select>
              </Field>
              {payment.customMode === "fixed-day-of-month" && (
                <Field label="Ayın Günü" error={errors.fixedDayOfMonth}>
                  <NumberInput
                    min={1}
                    max={28}
                    value={payment.fixedDayOfMonth ?? 15}
                    onChange={(e) => onChange({ ...payment, fixedDayOfMonth: Number(e.target.value) })}
                  />
                </Field>
              )}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-2">
            Özel ödeme planı kapalıyken varsayılan kural uygulanır: ilgili eğitim ayına ait ödeme, o eğitim ayı
            başlamadan önce tamamlanmalıdır.
          </p>
        </div>
      </div>
    </Card>
  );
}
