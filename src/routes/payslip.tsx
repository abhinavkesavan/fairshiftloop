import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, DemoNote, Field, PageHeader } from "@/components/fs";
import { computePayslip, inr, leaveDaysInMonth } from "@/lib/payroll";
import { PAY_MONTH, QUERY_TYPES, WORKERS, fmtDate, uid, update, useAppState } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/payslip")({
  head: pageHead("My Payslip", "A transparent, line-by-line breakdown of your earnings, deductions and estimated net pay."),
  component: Payslip,
});

function Row({ label, calc, amount, neg, strong }: { label: string; calc?: string; amount: number; neg?: boolean; strong?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-3 ${strong ? "font-bold" : ""}`}>
      <div><p>{label}</p>{calc && <p className="text-sm text-muted-foreground">{calc}</p>}</div>
      <p className={`whitespace-nowrap font-mono ${neg ? "text-destructive" : ""}`}>{neg ? "− " : ""}{inr(amount)}</p>
    </div>
  );
}

function Payslip() {
  const s = useAppState();
  const p = s.policies[s.industry];
  const w = WORKERS[s.industry];
  const unpaid = s.leaves.filter((l) => l.industry === s.industry && l.type === "unpaid" && l.status === "approved")
    .reduce((a, l) => a + leaveDaysInMonth(l.start, l.end, PAY_MONTH), 0);
  const r = computePayslip(s.shifts[s.industry], unpaid, p);
  const myQueries = s.queries.filter((q) => q.industry === s.industry);

  const [type, setType] = useState<(typeof QUERY_TYPES)[number]>("Incorrect hours");
  const [details, setDetails] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const d = details.trim();
    if (d.length < 10) return setErr("Please explain the problem in at least 10 characters.");
    if (d.length > 1000) return setErr("Please keep it under 1000 characters.");
    setErr("");
    update((st) => ({ ...st, queries: [{ id: uid(), industry: st.industry, type, details: d, status: "open", createdAt: new Date().toISOString() }, ...st.queries] }));
    setDetails(""); setSent(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <PageHeader eyebrow="FairPay" title="My Payslip · October 2026">{w.name} · {w.id} · {w.org}</PageHeader>
        <DemoNote>Example payroll data with a configurable demo policy — not legally verified payroll rules. All amounts are calculated by fixed formulas, never by AI.</DemoNote>
        <div className="fs-card mt-4 divide-y p-6">
          <h2 className="pb-2 text-lg font-bold text-primary">Earnings</h2>
          <Row label="Regular hours" calc={`${r.hours.regular} h × ${inr(p.hourlyRate)}/h`} amount={r.regularPay} />
          <Row label="Additional shifts" calc={`${r.hours.extra} h × ${inr(r.extraRate)}/h (${p.extraShiftMultiplier}× rate, up to ${p.standardDailyHours} h per shift)`} amount={r.extraPay} />
          <Row label="Overtime" calc={`${r.hours.overtime} h × ${inr(r.otRate)}/h (${p.overtimeMultiplier}× rate, hours beyond ${p.standardDailyHours} h/day)`} amount={r.overtimePay} />
          {p.allowances.map((a) => <Row key={a.label} label={a.label} calc="Fixed monthly allowance" amount={a.amount} />)}
          <Row label="Gross earnings" amount={r.gross} strong />
          <h2 className="pb-2 pt-5 text-lg font-bold text-primary">Deductions</h2>
          <Row label="Unpaid leave" calc={`${r.unpaidLeaveDays} approved unpaid day(s) × ${inr(r.perUnpaidDay)} (${p.standardDailyHours} h × rate × ${p.unpaidLeaveFactor})`} amount={r.unpaidLeave} neg />
          {p.deductions.map((d) => <Row key={d.label} label={d.label} calc="Configured fixed deduction" amount={d.amount} neg />)}
          <Row label="Total deductions" amount={r.totalDeductions} neg strong />
          <div className="mt-2 flex items-center justify-between rounded-lg bg-navy p-4 text-navy-foreground">
            <span className="font-display text-lg font-bold">Estimated net pay</span>
            <span className="font-mono text-2xl font-bold">{inr(r.net)}</span>
          </div>
          <p className="pt-3 text-sm text-muted-foreground">No double counting: each hour is classed once — regular, additional shift, or overtime. Hours come from <Link to="/shifts" className="underline">My Shifts</Link>.</p>
        </div>
      </div>

      <div className="space-y-6">
        <form onSubmit={submit} className="fs-card space-y-4 p-6" noValidate>
          <h2 className="text-xl font-bold text-primary">Something looks wrong?</h2>
          <Field label="Type of problem">
            <select className="fs-input" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              {QUERY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Details" error={err} hint="Which date or line item? What did you expect?">
            <textarea className="fs-input min-h-24" maxLength={1000} value={details} onChange={(e) => { setDetails(e.target.value); setSent(false); }} />
          </Field>
          <button className="fs-btn fs-btn-teal w-full">Flag salary discrepancy</button>
          {sent && <p className="font-medium text-success">Sent. Payroll will review it — see status below.</p>}
        </form>
        <div className="fs-card p-6">
          <h2 className="text-lg font-bold">My salary queries</h2>
          {myQueries.length === 0 ? <p className="mt-2 text-muted-foreground">No queries yet.</p> : (
            <ul className="mt-3 space-y-3">
              {myQueries.map((q) => (
                <li key={q.id} className="rounded-lg bg-muted p-3">
                  <div className="flex items-center justify-between gap-2"><strong>{q.type}</strong><Badge value={q.status} /></div>
                  <p className="mt-1 text-sm">{q.details}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{fmtDate(q.createdAt)}</p>
                  {q.response && <p className="mt-2 rounded bg-card p-2 text-sm"><strong>Payroll reply:</strong> {q.response}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
