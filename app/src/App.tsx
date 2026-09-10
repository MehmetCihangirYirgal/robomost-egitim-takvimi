import { useEffect, useState } from "react";
import type { AcademicYear } from "./types/calendar";
import type { StudentPlan } from "./types/student";
import { cacheAcademicYears, cachePlans, deletePlan, genId, loadAcademicYears, loadPlans, saveAcademicYears, savePlan } from "./services/storage";
import { pushAcademicYear, pushPlan, subscribeAcademicYears, subscribePlans } from "./services/cloudSync";
import { exportContainerIdFor, exportPlansAsZip } from "./services/bulkExport";
import { Dashboard } from "./pages/Dashboard";
import { NewPlanWizard } from "./pages/NewPlanWizard";
import { SavedPlansPage } from "./pages/SavedPlansPage";
import { AcademicCalendarAdminPage } from "./pages/AcademicCalendarAdminPage";
import { PrintDocument } from "./components/document/PrintDocument";
import { Button } from "./components/common/ui";
import robomostLogo from "./assets/robomost-logo.png";

type View = "dashboard" | "new-plan" | "saved-plans" | "calendar";

export default function App() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [plans, setPlans] = useState<StudentPlan[]>([]);
  const [view, setView] = useState<View>("dashboard");
  const [editingPlan, setEditingPlan] = useState<StudentPlan | undefined>(undefined);
  const [printBatch, setPrintBatch] = useState<StudentPlan[] | undefined>(undefined);
  const [exportBatch, setExportBatch] = useState<StudentPlan[] | undefined>(undefined);
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number } | undefined>(undefined);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // GitHub Pages / the browser can keep serving a cached index.html after a
  // deploy. Periodically compare the currently-loaded JS bundle against the
  // one the live index.html now points to, and prompt for a refresh if they
  // differ — otherwise staff can be stuck on stale code without any signal.
  useEffect(() => {
    const currentScript = document.querySelector<HTMLScriptElement>('script[src*="assets/index-"]');
    const currentSrc = currentScript?.getAttribute("src") ?? "";
    if (!currentSrc) return;

    async function checkForUpdate() {
      try {
        const res = await fetch("index.html", { cache: "no-store" });
        const html = await res.text();
        const match = html.match(/assets\/index-[^"]+\.js/);
        if (match && !currentSrc.includes(match[0])) {
          setUpdateAvailable(true);
        }
      } catch {
        // Offline or blocked — nothing to report.
      }
    }

    checkForUpdate();
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Once a bulk ZIP export batch is rendered off-screen, capture each plan's
  // pages to PDF and bundle them — then clear the batch.
  useEffect(() => {
    if (!exportBatch || exportBatch.length === 0) return;
    let cancelled = false;
    (async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled) return;
      const stamp = new Date().toISOString().slice(0, 10);
      await exportPlansAsZip(exportBatch, `ROBOMOST-Planlar-${stamp}`, (done, total) => {
        if (!cancelled) setExportProgress({ done, total });
      });
      if (!cancelled) {
        setExportBatch(undefined);
        setExportProgress(undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportBatch]);

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
    printPlans([plan]);
  }

  function printPlans(list: StudentPlan[]) {
    if (list.length === 0) return;
    setPrintBatch(list);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        setPrintBatch(undefined);
      });
    });
  }

  function downloadPlansZip(list: StudentPlan[]) {
    if (list.length === 0 || exportBatch) return;
    setExportBatch(list);
  }

  function updateAcademicYears(years: AcademicYear[]) {
    setAcademicYears(years);
    saveAcademicYears(years);
  }

  function yearFor(plan: StudentPlan): AcademicYear | undefined {
    return academicYears.find((y) => y.id === plan.enrollment.academicYearId) ?? academicYears[0];
  }

  if (printBatch) {
    return (
      <div id="print-root">
        {printBatch.map((plan) => {
          const year = yearFor(plan);
          return year ? <PrintDocument key={plan.id} plan={plan} academicYear={year} /> : null;
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button className="flex items-center gap-2" onClick={() => setView("dashboard")}>
            <img src={robomostLogo} alt="ROBOMOST" className="h-5 w-auto" />
            <span className="text-slate-400 font-normal text-sm">| Eğitim Takvimi ve Ödeme Planı</span>
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

      {updateAvailable && (
        <div className="no-print bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-6 py-2 flex items-center justify-center gap-3">
          <span>Uygulamanın yeni bir sürümü yayınlandı. Değişikliklerin kaybolmaması için önce mevcut işleminizi kaydedin, sonra sayfayı yenileyin.</span>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Yenile
          </Button>
        </div>
      )}

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
            onBulkPrint={printPlans}
            onBulkDownloadZip={downloadPlansZip}
            exportProgress={exportProgress}
          />
        )}
        {view === "calendar" && <AcademicCalendarAdminPage academicYears={academicYears} onChange={updateAcademicYears} />}
      </main>

      {exportBatch && (
        <div style={{ position: "fixed", top: 0, left: "-99999px", width: "210mm" }} aria-hidden="true">
          {exportBatch.map((plan) => {
            const year = yearFor(plan);
            if (!year) return null;
            return (
              <div key={plan.id} id={exportContainerIdFor(plan)}>
                <PrintDocument plan={plan} academicYear={year} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
