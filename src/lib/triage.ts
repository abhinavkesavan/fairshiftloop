// Transparent keyword-based demo triage. Not live AI. Makes no accusations.
import type { Category, Urgency } from "./store";

export type Triage = {
  suggestedCategory: Category;
  suggestedUrgency: Urgency;
  summary: string;
  actions: string[];
  matched: string[];
};

const RULES: { cat: Category; words: string[] }[] = [
  { cat: "Safety", words: ["scaffold", "helmet", "harness", "ppe", "fall", "wire", "electric", "fire", "unsafe", "injur", "hazard", "slippery", "leak", "gas", "glove", "boot"] },
  { cat: "Salary", words: ["salary", "pay", "wage", "overtime", "deduct", "payslip", "paid", "bonus", "allowance"] },
  { cat: "Workload", words: ["workload", "extra shift", "double shift", "hours", "rest", "tired", "understaff", "no break"] },
  { cat: "Harassment/Conduct", words: ["harass", "abuse", "shout", "threat", "bully", "discriminat", "insult"] },
  { cat: "Facilities", words: ["toilet", "water", "canteen", "drinking", "washroom", "shade", "light", "locker"] },
];

const ACTIONS: Record<Category, string[]> = {
  Safety: ["Inspect the reported location within 24 hours", "Restrict access to the area until checked", "Confirm protective equipment is available and recorded"],
  Salary: ["Compare the payslip against shift records", "Confirm which policy rule applied", "Reply to the worker with the reviewed breakdown"],
  Workload: ["Review rosters for the affected team", "Check rest periods between shifts", "Discuss staffing levels with the supervisor"],
  "Harassment/Conduct": ["Route to a trained, independent reviewer", "Protect the reporter's confidentiality", "Gather facts before reaching any conclusion"],
  Facilities: ["Schedule a facilities check", "Provide a temporary alternative if needed", "Confirm the fix with workers on site"],
  Other: ["Acknowledge receipt", "Clarify details via the case reference", "Assign to the relevant manager"],
};

const URGENT = ["fall", "injur", "electric", "fire", "gas", "collapse", "threat", "danger", "immediately", "bleeding"];

export function triage(text: string, chosen: Category): Triage {
  const t = text.toLowerCase();
  const matched: string[] = [];
  let best: Category = chosen;
  let bestScore = 0;
  for (const r of RULES) {
    const hits = r.words.filter((w) => t.includes(w));
    matched.push(...hits);
    if (hits.length > bestScore) { best = r.cat; bestScore = hits.length; }
  }
  const urgentHits = URGENT.filter((w) => t.includes(w));
  const suggestedUrgency: Urgency = urgentHits.length >= 2 ? "Critical" : urgentHits.length === 1 ? "High" : best === "Safety" ? "Medium" : "Low";
  const first = text.trim().split(/(?<=[.!?])\s/)[0] ?? "";
  const summary = (first.length > 140 ? first.slice(0, 137) + "…" : first) || "No description provided.";
  return { suggestedCategory: best, suggestedUrgency, summary, actions: ACTIONS[best], matched: [...new Set([...matched, ...urgentHits])] };
}
