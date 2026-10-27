import type { ReactNode } from "react";
import type { CaseStatus, LeaveStatus, QueryStatus } from "@/lib/store";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-teal">{eyebrow}</p>}
      <h1 className="mt-1 text-3xl font-extrabold text-primary md:text-4xl">{title}</h1>
      {children && <div className="mt-2 max-w-2xl text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-sm text-muted-foreground">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-sm font-medium text-destructive">{error}</span>}
    </label>
  );
}

const tone: Record<string, string> = {
  Submitted: "bg-info-soft text-primary",
  "Under Review": "bg-warning-soft text-warning",
  "In Progress": "bg-teal-soft text-accent-foreground",
  Resolved: "bg-success-soft text-success",
  pending: "bg-warning-soft text-warning",
  approved: "bg-success-soft text-success",
  rejected: "bg-destructive-soft text-destructive",
  open: "bg-info-soft text-primary",
  reviewing: "bg-warning-soft text-warning",
  resolved: "bg-success-soft text-success",
  Critical: "bg-destructive-soft text-destructive",
  High: "bg-warning-soft text-warning",
  Medium: "bg-info-soft text-primary",
  Low: "bg-muted text-muted-foreground",
};

export function Badge({ value }: { value: CaseStatus | LeaveStatus | QueryStatus | string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold capitalize ${tone[value] ?? "bg-muted text-muted-foreground"}`}>
      {value}
    </span>
  );
}

export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-teal bg-teal-soft px-4 py-3 text-sm text-accent-foreground">
      {children}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{children}</div>;
}

export function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`fs-card p-5 ${accent ? "border-teal" : ""}`}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-3xl font-extrabold ${accent ? "text-teal" : "text-primary"}`}>{value}</p>
    </div>
  );
}
