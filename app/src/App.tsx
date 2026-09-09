import { useEffect, useState } from "react";
import type { AcademicYear } from "./types/calendar";
import type { StudentPlan } from "./types/student";
import { cacheAcademicYears, cachePlans, deletePlan, genId, loadAcademicYears, loadPlans, saveAcademicYears, savePlan } from "./services/storage";
import { pushAcademicYear, pushPlan, subscribeAcademicYears, subscribePlans } from "./services/cloudSync";
import { Dashboard } from "./pages/Dashboard";
import { NewPlanWizard } from "./pages/NewPlanWizard";
import { SavedPlansPage } from "./pages/SavedPlansPage";
import { AcademicCalendarAdminPage } from "./pages/AcademicCalendarAdminPage";
import { PrintDocument } from "./components/document/PrintDocument";
import { Button } from "./components/common/ui";

type View = "dashboard" | "new-plan" | "saved-plans" | "calendar";

export default function App() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [plans, setPlans] = useState<StudentPlan[]>([]);
  const [view, setView] = useState<View>("dashboard");
  const [editingPlan, setEditingPlan] = useState<StudentPlan | undefined>(undefined);
  const [printOnlyPlan, setPrintOnlyPlan] = useState<StudentPlan | undefined>(undefined);

  useEffect(() => {
    // Instant paint from whatever this device already has locally, then
    // switch over to the live shared copy the moment it arrives — so every
    // device (and every tab) converges on the same data automatically.
    const localYears = loadAcademicYears();
    const localPlans = loadPlans();
    setAcademicYears(localYears);
    setPlans(localPlans);

    let yearsBootstrapped = false;
    const unsubYears = subscribeAcademicYears((years) => {
      if (years.length === 0 && !yearsBootstrapped) {
        yearsBootstrapped = true;
        localYears.forEach((y) => void pushAcademicYear(y));
        return;
      }
      cacheAcademicYears(years);
      setAcademicYears(years);
    });

    let plansBootstrapped = false;
    const unsubPlans = subscribePlans((cloudPlans) => {
      if (cloudPlans.length === 0 && !plansBootstrapped) {
        plansBootstrapped = true;
        if (localPlans.length > 0) {
          localPlans.forEach((p) => void pushPlan(p));
          return;
        }
      }
      cachePlans(cloudPlans);
      setPlans(cloudPlans);
    });

    return () => {
      unsubYears();
      unsubPlans();
    };
  }, []);

  function refreshPlans() {
    setPlans(loadPlans());
  }

  function goNewPlan() {
    setEditingPlan(undefined);
    setView("new-plan");
  }

  function openPlan(plan: StudentPlan) {
    setEditingPlan(plan);
    setView("new-plan");
  }

  function duplicatePlan(plan: StudentPlan) {
    const copy: StudentPlan = {
      ...plan,
      id: genId("plan"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      student: { ...plan.student, firstName: `${plan.student.firstName} (Kopya)` }
    };
    savePlan(copy);
    refreshPlans();
  }

  function removePlan(plan: StudentPlan) {
    if (!confirm(`${plan.student.firstName} ${plan.student.lastName} için kayıtlı planı silmek istediğinize emin misiniz?`)) return;
    deletePlan(plan.id);
    refreshPlans();
  }

  function printPlan(plan: StudentPlan) {
    setPrintOnlyPlan(plan);
    requestAnimationFrame(() => {
      window.print();
      setPrintOnlyPlan(undefined);
    });
  }

  function updateAcademicYears(years: AcademicYear[]) {
    setAcademicYears(years);
    saveAcademicYears(years);
  }

  if (printOnlyPlan) {
    const year = academicYears.find((y) => y.id === printOnlyPlan.enrollment.academicYearId) ?? academicYears[0];
    if (!year) return null;
    return <PrintDocument plan={printOnlyPlan} academicYear={year} />;
  }

  return (
    <div className="min-h-screen">
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button className="font-bold text-robomost-700 tracking-tight" onClick={() => setView("dashboard")}>
            ROBOMOST <span className="text-slate-400 font-normal text-sm">| Eğitim Takvimi ve Ödeme Planı</span>
          </button>
          <nav className="flex gap-1 text-sm">
            <Button variant={view === "new-plan" ? "primary" : "ghost"} onClick={goNewPlan}>
              Yeni Plan
            </Button>
            <Button variant={view === "saved-plans" ? "primary" : "ghost"} onClick={() => setView("saved-plans")}>
              Kayıtlı Planlar
            </Button>
            <Button variant={view === "calendar" ? "primary" : "ghost"} onClick={() => setView("calendar")}>
              Akademik Takvim
            </Button>
          </nav>
        </div>
      </header>

      <main className="px-6 py-8">
        {view === "dashboard" && (
          <Dashboard plans={plans} onNew={goNewPlan} onOpenSaved={() => setView("saved-plans")} onOpenCalendar={() => setView("calendar")} />
        )}
        {view === "new-plan" && (
          <NewPlanWizard
            academicYears={academicYears}
            initialPlan={editingPlan}
            onSaved={() => refreshPlans()}
            onCancel={() => setView("saved-plans")}
          />
        )}
        {view === "saved-plans" && (
          <SavedPlansPage
            plans={plans}
            academicYears={academicYears}
            onOpen={openPlan}
            onPrint={printPlan}
            onDuplicate={duplicatePlan}
            onDelete={removePlan}
            onNew={goNewPlan}
          />
        )}
        {view === "calendar" && <AcademicCalendarAdminPage academicYears={academicYears} onChange={updateAcademicYears} />}
      </main>
    </div>
  );
}
