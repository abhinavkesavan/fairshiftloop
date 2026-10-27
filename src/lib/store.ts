// Demo data store: persisted in this browser's localStorage only.
import { useSyncExternalStore } from "react";
import type { PayPolicy, Shift } from "./payroll";
import { triage, type Triage } from "./triage";

export type Industry = "construction" | "college";
export const CATEGORIES = ["Safety", "Salary", "Workload", "Harassment/Conduct", "Facilities", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];
export const URGENCIES = ["Low", "Medium", "High", "Critical"] as const;
export type Urgency = (typeof URGENCIES)[number];
export const CASE_STATUSES = ["Submitted", "Under Review", "In Progress", "Resolved"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];
export type LeaveType = "paid" | "unpaid" | "medical";
export type LeaveStatus = "pending" | "approved" | "rejected";
export const QUERY_TYPES = ["Incorrect hours", "Missing overtime", "Unexpected deduction", "Other"] as const;
export type QueryStatus = "open" | "reviewing" | "resolved";

export type CaseNote = { at: string; text: string; status: CaseStatus };
export type Case = {
  ref: string; industry: Industry; category: Category; urgency: Urgency; description: string;
  location?: string | undefined; anonymous: boolean; reporterName?: string | undefined; status: CaseStatus;
  createdAt: string; updatedAt: string; notes: CaseNote[]; triage: Triage;
};
export type Leave = {
  id: string; industry: Industry; type: LeaveType; start: string; end: string; reason?: string | undefined;
  status: LeaveStatus; adminNote?: string | undefined; createdAt: string;
};
export type SalaryQuery = {
  id: string; industry: Industry; type: (typeof QUERY_TYPES)[number]; details: string;
  status: QueryStatus; response?: string | undefined; createdAt: string;
};

export type State = {
  industry: Industry; cases: Case[]; leaves: Leave[]; queries: SalaryQuery[];
  shifts: Record<Industry, Shift[]>; policies: Record<Industry, PayPolicy>; lastRef?: string;
};

export const PAY_MONTH = "2026-10";
export const WORKERS: Record<Industry, { name: string; role: string; org: string; id: string }> = {
  construction: { name: "Ravi Kumar", role: "Site worker – masonry", org: "Skyline Builders, Site 14", id: "CW-2031" },
  college: { name: "Meena Selvam", role: "Housekeeping & security staff", org: "Riverside College Campus", id: "CS-0877" },
};
export const LEAVE_ENTITLEMENT: Record<Industry, { paid: number; medical: number }> = {
  construction: { paid: 12, medical: 7 },
  college: { paid: 15, medical: 10 },
};
export const INDUSTRY_LABEL: Record<Industry, string> = { construction: "Construction", college: "College" };

const mk = (ref: string, industry: Industry, category: Category, urgency: Urgency, status: CaseStatus, description: string, createdAt: string, location: string, notes: CaseNote[] = []): Case => ({
  ref, industry, category, urgency, status, description, createdAt, updatedAt: notes.at(-1)?.at ?? createdAt,
  location, anonymous: true, notes, triage: triage(description, category),
});

const s = (id: string, date: string, hours: number, isExtraShift = false, note?: string): Shift => ({ id, date, hours, isExtraShift, note });

export const SEED: State = {
  industry: "construction",
  cases: [
    mk("FS-C7K2MQ", "construction", "Safety", "Critical", "In Progress", "Scaffolding on tower B east side is loose and wobbles when two people stand on it. Some boards are cracked.", "2026-10-18T08:10:00Z", "Tower B, level 6", [
      { at: "2026-10-18T11:00:00Z", status: "Under Review", text: "Site safety officer notified." },
      { at: "2026-10-19T09:30:00Z", status: "In Progress", text: "Area closed off. Replacement boards ordered." },
    ]),
    mk("FS-C4P9RA", "construction", "Safety", "High", "Under Review", "Several new workers on the night crew have no helmets or safety harness. The PPE store says stock is finished.", "2026-10-21T19:40:00Z", "Main gate PPE store", [
      { at: "2026-10-22T07:15:00Z", status: "Under Review", text: "Checking stock records with procurement." },
    ]),
    mk("FS-C2H8TN", "construction", "Salary", "Medium", "Submitted", "My overtime for the extra shift on Sunday is not shown on my payslip.", "2026-10-24T13:05:00Z", "Site 14"),
    mk("FS-C9W3LB", "construction", "Facilities", "Low", "Resolved", "No drinking water near the north block in the afternoon.", "2026-10-02T10:00:00Z", "North block", [
      { at: "2026-10-03T09:00:00Z", status: "Resolved", text: "Water dispenser installed at north block." },
    ]),
    mk("FS-K5M7DE", "college", "Safety", "High", "In Progress", "Exposed electric wire near the library staircase. The floor gets slippery when it rains.", "2026-10-20T06:50:00Z", "Library, ground floor", [
      { at: "2026-10-20T10:00:00Z", status: "In Progress", text: "Electrician scheduled; area taped off." },
    ]),
    mk("FS-K3T6VJ", "college", "Workload", "Medium", "Under Review", "Housekeeping team is understaffed during exam week. We are asked to do double shift without proper rest.", "2026-10-22T15:20:00Z", "Main academic block", [
      { at: "2026-10-23T08:00:00Z", status: "Under Review", text: "Reviewing exam-week rosters." },
    ]),
    mk("FS-K8Q4ZS", "college", "Workload", "Medium", "Submitted", "Security night staff are covering two gates alone after the guard resigned.", "2026-10-25T22:10:00Z", "Gates 2 and 3"),
    mk("FS-K6B2NF", "college", "Facilities", "Low", "Resolved", "Staff washroom near hostel block has no lights.", "2026-10-05T12:00:00Z", "Hostel block C", [
      { at: "2026-10-06T16:00:00Z", status: "Resolved", text: "Lights replaced." },
    ]),
  ],
  leaves: [
    { id: "L1", industry: "construction", type: "paid", start: "2026-10-08", end: "2026-10-09", reason: "Family function", status: "approved", createdAt: "2026-10-01T09:00:00Z" },
    { id: "L2", industry: "construction", type: "unpaid", start: "2026-10-15", end: "2026-10-15", reason: "Travel to village", status: "approved", createdAt: "2026-10-10T09:00:00Z" },
    { id: "L3", industry: "construction", type: "medical", start: "2026-11-03", end: "2026-11-04", status: "pending", createdAt: "2026-10-25T09:00:00Z" },
    { id: "L4", industry: "college", type: "paid", start: "2026-10-12", end: "2026-10-12", reason: "Personal work", status: "approved", createdAt: "2026-10-05T09:00:00Z" },
    { id: "L5", industry: "college", type: "unpaid", start: "2026-11-10", end: "2026-11-12", reason: "Child's school event", status: "pending", createdAt: "2026-10-24T09:00:00Z" },
  ],
  queries: [
    { id: "Q1", industry: "construction", type: "Missing overtime", details: "Sunday 4 Oct extra shift went to 10 hours; 2 hours overtime missing in last month's slip.", status: "reviewing", createdAt: "2026-10-06T09:00:00Z" },
    { id: "Q2", industry: "college", type: "Unexpected deduction", details: "₹300 'uniform' deduction I did not agree to.", status: "open", createdAt: "2026-10-20T09:00:00Z" },
  ],
  shifts: {
    construction: [
      s("c1", "2026-10-01", 8), s("c2", "2026-10-02", 10, false, "Concrete pour ran late"), s("c3", "2026-10-03", 8),
      s("c4", "2026-10-04", 10, true, "Sunday extra shift"), s("c5", "2026-10-05", 9), s("c6", "2026-10-06", 8),
      s("c7", "2026-10-07", 8), s("c8", "2026-10-10", 11), s("c9", "2026-10-11", 8, true, "Sunday extra shift"), s("c10", "2026-10-12", 8),
    ],
    college: [
      s("k1", "2026-10-01", 8), s("k2", "2026-10-02", 8), s("k3", "2026-10-05", 10, false, "Exam hall setup"),
      s("k4", "2026-10-06", 8), s("k5", "2026-10-07", 8), s("k6", "2026-10-10", 6, true, "Saturday convocation duty"),
      s("k7", "2026-10-13", 9), s("k8", "2026-10-14", 8),
    ],
  },
  policies: {
    construction: {
      hourlyRate: 120, standardDailyHours: 8, overtimeMultiplier: 1.5, extraShiftMultiplier: 1.25, unpaidLeaveFactor: 1,
      allowances: [{ label: "Site travel allowance", amount: 1200 }, { label: "PPE washing allowance", amount: 400 }],
      deductions: [{ label: "Provident fund (example)", amount: 1500 }, { label: "Site canteen", amount: 600 }],
    },
    college: {
      hourlyRate: 100, standardDailyHours: 8, overtimeMultiplier: 1.5, extraShiftMultiplier: 1.25, unpaidLeaveFactor: 1,
      allowances: [{ label: "Night duty allowance", amount: 800 }],
      deductions: [{ label: "Provident fund (example)", amount: 1200 }],
    },
  },
};

const KEY = "fairshift-demo-v1";
let state: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...SEED, ...JSON.parse(raw) } as State;
  } catch { /* ignore corrupt data */ }
  return SEED;
}
const get = () => (state ??= load());
const notify = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { state = null; notify(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

export function update(fn: (s: State) => State) {
  state = fn(get());
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full */ }
  notify();
}
export function resetDemo() {
  state = SEED;
  try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
  notify();
}

export function useAppState(): State {
  return useSyncExternalStore(subscribe, get, () => SEED);
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newRef(industry: Industry, existing: string[]): string {
  let ref = "";
  do {
    ref = `FS-${industry === "construction" ? "C" : "K"}` + Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
  } while (existing.includes(ref));
  return ref;
}
export const uid = () => Math.random().toString(36).slice(2, 10);
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
