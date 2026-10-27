import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DemoNote, Empty, Field, PageHeader } from "@/components/fs";
import { classifyShift } from "@/lib/payroll";
import { uid, update, useAppState } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/shifts")({
  head: pageHead("My Shifts", "Your logged shifts with regular, additional-shift and overtime hours explained."),
  component: Shifts,
});

function Shifts() {
  const s = useAppState();
  const p = s.policies[s.industry];
  const shifts = [...s.shifts[s.industry]].sort((a, b) => a.date.localeCompare(b.date));
  const [date, setDate] = useState("2026-10-15");
  const [hours, setHours] = useState("8");
  const [extra, setExtra] = useState(false);
  const [err, setErr] = useState("");

  const setShifts = (fn: (x: typeof shifts) => typeof shifts) =>
    update((st) => ({ ...st, shifts: { ...st.shifts, [st.industry]: fn(st.shifts[st.industry]) } }));

  function add(e: React.FormEvent) {
    e.preventDefault();
    const h = Number(hours);
    if (!/^2026-10-\d{2}$/.test(date)) return setErr("Demo payslip covers October 2026 — pick a date in that month.");
    if (!Number.isFinite(h) || h <= 0 || h > 16) return setErr("Hours must be between 0.5 and 16.");
    if (shifts.some((x) => x.date === date)) return setErr("A shift is already logged for that date. Edit it in the table instead.");
    setErr("");
    setShifts((x) => [...x, { id: uid(), date, hours: h, isExtraShift: extra }]);
  }

  return (
    <div>
      <PageHeader eyebrow="FairPay" title="My Shifts · October 2026">Change hours here and your payslip updates instantly.</PageHeader>
      <DemoNote>Demo shift log. Up to {p.standardDailyHours} h per day is regular (or additional-shift on a day off); anything beyond is overtime.</DemoNote>
      <form onSubmit={add} className="fs-card mt-4 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <Field label="Date"><input type="date" className="fs-input" min="2026-10-01" max="2026-10-31" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Hours worked"><input type="number" step="0.5" min="0.5" max="16" className="fs-input" value={hours} onChange={(e) => setHours(e.target.value)} /></Field>
        <label className="flex items-center gap-2 pb-3"><input type="checkbox" className="h-5 w-5 accent-teal" checked={extra} onChange={(e) => setExtra(e.target.checked)} /> Additional shift (day off)</label>
        <button className="fs-btn fs-btn-primary">Add shift</button>
        {err && <p role="alert" className="text-sm font-medium text-destructive sm:col-span-4">{err}</p>}
      </form>
      <div className="fs-card mt-4 overflow-x-auto">
        {shifts.length === 0 ? <div className="p-6"><Empty>No shifts logged.</Empty></div> : (
          <table className="w-full text-left">
            <thead className="bg-muted text-sm text-muted-foreground">
              <tr><th className="p-3">Date</th><th className="p-3">Hours</th><th className="p-3">Type</th><th className="p-3">Regular</th><th className="p-3">Add. shift</th><th className="p-3">Overtime</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {shifts.map((x) => {
                const c = classifyShift(x, p);
                return (
                  <tr key={x.id} className="border-t">
                    <td className="p-3">{x.date}{x.note && <span className="block text-xs text-muted-foreground">{x.note}</span>}</td>
                    <td className="p-3"><input aria-label={`Hours on ${x.date}`} type="number" step="0.5" min="0" max="16" className="fs-input w-20 py-1" value={x.hours}
                      onChange={(e) => { const h = Math.min(16, Math.max(0, Number(e.target.value) || 0)); setShifts((all) => all.map((y) => (y.id === x.id ? { ...y, hours: h } : y))); }} /></td>
                    <td className="p-3">{x.isExtraShift ? "Additional" : "Regular day"}</td>
                    <td className="p-3">{c.regular}</td><td className="p-3">{c.extra}</td>
                    <td className="p-3 font-semibold text-teal">{c.overtime}</td>
                    <td className="p-3"><button onClick={() => setShifts((all) => all.filter((y) => y.id !== x.id))} className="text-sm font-semibold text-destructive underline">Remove</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
