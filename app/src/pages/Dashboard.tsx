import type { StudentPlan } from "../types/student";
import { Button, Card } from "../components/common/ui";

interface Props {
  plans: StudentPlan[];
  onNew: () => void;
  onOpenSaved: () => void;
  onOpenCalendar: () => void;
}

export function Dashboard({ plans, onNew, onOpenSaved, onOpenCalendar }: Props) {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">ROBOMOST Eğitim Takvimi ve Ödeme Planı Oluşturucu</h1>
        <p className="text-sm text-slate-500 mt-1">Öğrenci bazlı eğitim takvimi ve ödeme planı hazırlayın, A4 belge olarak yazdırın.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button onClick={onNew} className="text-left">
          <Card>
            <div className="text-robomost-600 text-2xl mb-2">＋</div>
            <div className="font-semibold text-slate-800">Yeni Plan Oluştur</div>
            <div className="text-xs text-slate-500 mt-1">Öğrenci, program ve ödeme bilgilerini girerek yeni bir plan hazırlayın.</div>
          </Card>
        </button>
        <button onClick={onOpenSaved} className="text-left">
          <Card>
            <div className="text-robomost-600 text-2xl mb-2">🗂</div>
            <div className="font-semibold text-slate-800">Kayıtlı Planlar</div>
            <div className="text-xs text-slate-500 mt-1">{plans.length} kayıtlı plan — görüntüle, düzenle, yazdır.</div>
          </Card>
        </button>
        <button onClick={onOpenCalendar} className="text-left">
          <Card>
            <div className="text-robomost-600 text-2xl mb-2">📅</div>
            <div className="font-semibold text-slate-800">Akademik Takvim Yönetimi</div>
            <div className="text-xs text-slate-500 mt-1">Eğitim haftalarını ve tatilleri düzenleyin, yeni akademik yıl ekleyin.</div>
          </Card>
        </button>
      </div>

      {plans.length > 0 && (
        <Card title="Son Planlar">
          <div className="space-y-1 text-sm">
            {plans.slice(-5).reverse().map((p) => (
              <div key={p.id} className="flex justify-between py-1 border-b border-slate-50 last:border-0">
                <span className="text-slate-700">
                  {p.student.firstName} {p.student.lastName}
                </span>
                <span className="text-slate-400">{p.program.programName}</span>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button variant="ghost" onClick={onOpenSaved}>
              Tüm planları gör →
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
