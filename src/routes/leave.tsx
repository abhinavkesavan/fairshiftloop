import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Empty, Field, PageHeader } from "@/components/fs";
import { leaveDays } from "@/lib/payroll";
import { LEAVE_ENTITLEMENT, fmtDate, uid, update, useAppState, type LeaveType } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/leave")({
  head: pageHead("My Leave", "Request paid, unpaid or medical leave and see your balances and request status."),
  component: Leave,
});

const LABEL: Record<LeaveType, string> = { paid: "Paid leave", unpaid: "Unpaid leave", medical: "Medical leave" };

function Leave() {
  const s = useAppState();
  const mine = s.leaves.filter((l) => l.industry === s.industry);
  const ent = LEAVE_ENTITLEMENT[s.industry];
  const used = (t: LeaveType) => mine.filter((l) => l.type === t && l.status === "approved").reduce((a, l) => a + leaveDays(l.start, l.end), 0);
  const [type, setType] = useState<LeaveType>("paid");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    if (!start || !end) return setErr("Please choose a start and end date.");
    if (end < start) return setErr("End date can't be before start date.");
    if (leaveDays(start, end) > 60) return setErr("Requests longer than 60 days need to go through HR directly.");
    if (reason.length > 200) return setErr("Keep the reason under 200 characters.");
    setErr("");
    update((st) => ({ ...st, leaves: [{ id: uid(), industry: st.industry, type, start, end, reason: reason.trim() || undefined, status: "pending", createdAt: new Date().toISOString() }, ...st.leaves] }));
    setStart(""); setEnd(""); setReason(""); setOk(true);
  }

  return (
    <div>
      <PageHeader eyebrow="Leave" title="My Leave">Example balances for 2026. Approved unpaid leave appears on your payslip.</PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="fs-card p-5"><p className="text-sm text-muted-foreground">Paid leave left</p><p className="font-display text-3xl font-extrabold text-primary">{ent.paid - used("paid")} <span className="text-base font-medium text-muted-foreground">/ {ent.paid} days</span></p></div>
        <div className="fs-card p-5"><p className="text-sm text-muted-foreground">Medical leave left</p><p className="font-display text-3xl font-extrabold text-primary">{ent.medical - used("medical")} <span className="text-base font-medium text-muted-foreground">/ {ent.medical} days</span></p></div>
        <div className="fs-card p-5"><p className="text-sm text-muted-foreground">Unpaid leave taken</p><p className="font-display text-3xl font-extrabold text-primary">{used("unpaid")} <span className="text-base font-medium text-muted-foreground">days</span></p></div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <form onSubmit={submit} className="fs-card space-y-4 p-6" noValidate>
          <h2 className="text-xl font-bold text-primary">Request leave</h2>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(LABEL) as LeaveType[]).map((t) => (
              <button type="button" key={t} aria-pressed={type === t} onClick={() => setType(t)} className={`fs-btn px-2 ${type === t ? "fs-btn-primary" : "fs-btn-outline"}`}>{LABEL[t].split(" ")[0]}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date"><input type="date" className="fs-input" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
            <Field label="End date"><input type="date" className="fs-input" value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></Field>
          </div>
          <Field label="Reason (optional)" hint={type === "medical" ? "Please don't include any diagnosis or medical details." : "A few words is enough."}>
            <input className="fs-input" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          {err && <p role="alert" className="font-medium text-destructive">{err}</p>}
          {ok && <p className="font-medium text-success">Request sent. It's now pending approval.</p>}
          <button className="fs-btn fs-btn-teal w-full">Send request</button>
        </form>
        <div className="fs-card p-6">
          <h2 className="text-xl font-bold">My requests</h2>
          {mine.length === 0 ? <div className="mt-3"><Empty>No leave requests yet.</Empty></div> : (
            <ul className="mt-3 divide-y">
              {mine.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-semibold">{LABEL[l.type]} · {leaveDays(l.start, l.end)} day(s)</p>
                    <p className="text-sm text-muted-foreground">{fmtDate(l.start)} – {fmtDate(l.end)}{l.reason ? ` · ${l.reason}` : ""}</p>
                    {l.adminNote && <p className="text-sm">Note: {l.adminNote}</p>}
                  </div>
                  <Badge value={l.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
