import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, DemoNote, Empty, Field, PageHeader } from "@/components/fs";
import type { PayPolicy } from "@/lib/payroll";
import { INDUSTRY_LABEL, fmtDate, update, useAppState, type QueryStatus, type SalaryQuery } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/salary")({
  head: pageHead("Review Salary Queries", "Respond to worker payslip queries and configure demo pay policies."),
  component: Salary,
});

function Salary() {
  const s = useAppState();
  const p = s.policies[s.industry];
  const qs = s.queries.filter((q) => q.industry === s.industry);
  const setP = (patch: Partial<PayPolicy>) => update((st) => ({ ...st, policies: { ...st.policies, [st.industry]: { ...st.policies[st.industry], ...patch } } }));
  const num = (v: string, min: number, max: number) => Math.min(max, Math.max(min, Number(v) || 0));

  return (
    <div>
      <PageHeader eyebrow={`Employer · ${INDUSTRY_LABEL[s.industry]} (demo access)`} title="Review Salary Queries" />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          {qs.length === 0 && <Empty>No salary queries.</Empty>}
          {qs.map((q) => <QueryRow key={q.id} q={q} />)}
        </div>
        <div className="fs-card space-y-4 p-6">
          <h2 className="text-xl font-bold text-primary">Pay policy (demo)</h2>
          <DemoNote>Example values only — not legally verified. Changes update the worker payslip instantly.</DemoNote>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hourly rate (₹)"><input type="number" min="0" className="fs-input" value={p.hourlyRate} onChange={(e) => setP({ hourlyRate: num(e.target.value, 0, 10000) })} /></Field>
            <Field label="Standard hours/day"><input type="number" min="1" max="12" className="fs-input" value={p.standardDailyHours} onChange={(e) => setP({ standardDailyHours: num(e.target.value, 1, 12) })} /></Field>
            <Field label="Overtime multiplier"><input type="number" step="0.05" min="1" max="3" className="fs-input" value={p.overtimeMultiplier} onChange={(e) => setP({ overtimeMultiplier: num(e.target.value, 1, 3) })} /></Field>
            <Field label="Extra-shift multiplier"><input type="number" step="0.05" min="1" max="3" className="fs-input" value={p.extraShiftMultiplier} onChange={(e) => setP({ extraShiftMultiplier: num(e.target.value, 1, 3) })} /></Field>
            <Field label="Unpaid leave factor" hint="1 = one full day's pay per day"><input type="number" step="0.1" min="0" max="1" className="fs-input" value={p.unpaidLeaveFactor} onChange={(e) => setP({ unpaidLeaveFactor: num(e.target.value, 0, 1) })} /></Field>
          </div>
          <h3 className="font-bold">Allowances (₹/month)</h3>
          {p.allowances.map((a, i) => (
            <Field key={a.label} label={a.label}><input type="number" min="0" className="fs-input" value={a.amount} onChange={(e) => setP({ allowances: p.allowances.map((x, j) => (j === i ? { ...x, amount: num(e.target.value, 0, 100000) } : x)) })} /></Field>
          ))}
          <h3 className="font-bold">Deductions (₹/month)</h3>
          {p.deductions.map((a, i) => (
            <Field key={a.label} label={a.label}><input type="number" min="0" className="fs-input" value={a.amount} onChange={(e) => setP({ deductions: p.deductions.map((x, j) => (j === i ? { ...x, amount: num(e.target.value, 0, 100000) } : x)) })} /></Field>
          ))}
        </div>
      </div>
    </div>
  );
}

function QueryRow({ q }: { q: SalaryQuery }) {
  const [status, setStatus] = useState<QueryStatus>(q.status);
  const [resp, setResp] = useState(q.response ?? "");
  const [saved, setSaved] = useState(false);
  return (
    <div className="fs-card space-y-3 p-4">
      <div className="flex items-center justify-between gap-2"><strong>{q.type}</strong><Badge value={q.status} /></div>
      <p>{q.details}</p>
      <p className="text-xs text-muted-foreground">{fmtDate(q.createdAt)}</p>
      <div className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <Field label="Status"><select className="fs-input" value={status} onChange={(e) => { setStatus(e.target.value as QueryStatus); setSaved(false); }}><option value="open">open</option><option value="reviewing">reviewing</option><option value="resolved">resolved</option></select></Field>
        <Field label="Reply to worker"><input className="fs-input" maxLength={300} value={resp} onChange={(e) => { setResp(e.target.value); setSaved(false); }} /></Field>
        <button className="fs-btn fs-btn-primary" onClick={() => { update((s) => ({ ...s, queries: s.queries.map((x) => (x.id === q.id ? { ...x, status, response: resp.trim() || undefined } : x)) })); setSaved(true); }}>Save</button>
      </div>
      {saved && <p className="text-sm font-medium text-success">Saved — visible on the worker's payslip page.</p>}
    </div>
  );
}
