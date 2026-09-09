import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase";
import type { AcademicYear } from "../types/calendar";
import type { StudentPlan } from "../types/student";

const PLANS_COLLECTION = "plans";
const YEARS_COLLECTION = "academicYears";

/**
 * Live-subscribes to the shared "plans" collection so every open device sees
 * the same data and picks up other devices' changes automatically. Errors
 * (offline, rules misconfigured, etc.) are swallowed — the caller keeps
 * whatever it already has from localStorage.
 */
export function subscribePlans(onChange: (plans: StudentPlan[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, PLANS_COLLECTION),
    (snapshot) => {
      const plans = snapshot.docs.map((d) => d.data() as StudentPlan);
      onChange(plans);
    },
    () => {
      // Offline / unavailable — the app keeps working off localStorage.
    }
  );
}

export function subscribeAcademicYears(onChange: (years: AcademicYear[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, YEARS_COLLECTION),
    (snapshot) => {
      const years = snapshot.docs.map((d) => d.data() as AcademicYear);
      onChange(years);
    },
    () => {
      // Offline / unavailable — the app keeps working off localStorage.
    }
  );
}

export async function pushPlan(plan: StudentPlan): Promise<void> {
  try {
    await setDoc(doc(db, PLANS_COLLECTION, plan.id), plan);
  } catch {
    // Offline — the local copy still saved; it will sync next time
    // subscribePlans reconnects and this write is retried by the caller.
  }
}

export async function deletePlanRemote(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PLANS_COLLECTION, id));
  } catch {
    // Offline — local delete already applied.
  }
}

export async function pushAcademicYear(year: AcademicYear): Promise<void> {
  try {
    await setDoc(doc(db, YEARS_COLLECTION, year.id), year);
  } catch {
    // Offline — local copy already saved.
  }
}
