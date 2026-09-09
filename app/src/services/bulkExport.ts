import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";
import type { StudentPlan } from "../types/student";

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]+/g, "").trim();
  return cleaned.length > 0 ? cleaned : "Adsız";
}

function planExportContainerId(planId: string): string {
  return `export-doc-${planId}`;
}

export function exportContainerIdFor(plan: StudentPlan): string {
  return planExportContainerId(plan.id);
}

async function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
          setTimeout(resolve, 2500);
        })
    )
  );
}

async function renderPlanToPdfBlob(container: HTMLElement): Promise<Blob> {
  const pages = Array.from(container.querySelectorAll<HTMLElement>(".a4-page"));
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
  }

  return pdf.output("blob");
}

/**
 * Turns every plan's already-rendered off-screen document (looked up by
 * `exportContainerIdFor(plan)`) into a PDF and bundles them into one ZIP,
 * organized into one folder per program. Triggers a browser download when done.
 */
export async function exportPlansAsZip(
  plans: StudentPlan[],
  zipFilename: string,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    const container = document.getElementById(planExportContainerId(plan.id));
    if (!container) continue;

    await waitForImages(container);
    const blob = await renderPlanToPdfBlob(container);

    const program = sanitizeFilename(plan.program.programName || "Program");
    let name = sanitizeFilename(`${plan.student.firstName} ${plan.student.lastName}`.trim() || "Öğrenci");
    const key = `${program}/${name}`;
    if (usedNames.has(key)) {
      name = `${name} (${plan.id.slice(-5)})`;
    }
    usedNames.add(key);

    zip.file(`${program}/${name}.pdf`, blob);
    onProgress?.(i + 1, plans.length);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFilename.endsWith(".zip") ? zipFilename : `${zipFilename}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
