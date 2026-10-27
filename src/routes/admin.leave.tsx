import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Empty, PageHeader } from "@/components/fs";
import { leaveDays } from "@/lib/payroll";
import { INDUSTRY_LABEL, WORKERS, fmtDate, update, useAppState, type Leave, type LeaveStatus } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/leave")({
  head: pageHead("Manage Leave", "Approve or reject worker leave requests."),
  component: ManageLeave,
});

function ManageLeave() {
  const s = useAppState();
  const list = s.leaves.filter((l) => l.industry === s.industry).sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0));
  return (
    <div>
      <PageHeader eyebrow={`Employer · ${INDUSTRY_LABEL[s.industry]} (demo access)`} title="Manage Leave">Decisions appear immediately in the worker's My Leave page.</PageHeader>
      <div className="space-y-3">
        {list.length === 0 && <Empty>No leave requests.</Empty>}
        {list.map((l) => <LeaveRow key={l.id} l={l} />)}
      </div>
    </div>
  );
}

function LeaveRow({ l }: { l: Leave }) {
  const s = useAppState();
  const [note, setNote] = useState("");
  const decide = (status: LeaveStatus) =>
    update((st) => ({ ...st, leaves: st.leaves.map((x) => (x.id === l.id ? { ...x, status, adminNote: note.trim().slice(0, 200) || x.adminNote } : x)) }));
  return (
    <div className="fs-card flex flex-wrap items-center justify-between gap-4 p-4">
      <div>
        <p className="font-semibold capitalize">{l.type} leave · {leaveDays(l.start, l.end)} day(s) · {WORKERS[s.industry].name}</p>
        <p className="text-sm text-muted-foreground">{fmtDate(l.start)} – {fmtDate(l.end)}{l.reason ? ` · ${l.reason}` : ""}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge value={l.status} />
        {l.status === "pending" ? (
          <>
            <input aria-label="Optional note" placeholder="Optional note" maxLength={200} className="fs-input w-44 py-2" value={note} onChange={(e) => setNote(e.target.value)} />
            <button onClick={() => decide("approved")} className="fs-btn fs-btn-teal">Approve</button>
            <button onClick={() => decide("rejected")} className="fs-btn fs-btn-outline">Reject</button>
          </>
        ) : (
          <button onClick={() => decide("pending")} className="text-sm font-semibold underline">Undo</button>
        )}
      </div>
    </div>
  );
}
