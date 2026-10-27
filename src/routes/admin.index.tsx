import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, PageHeader, Stat } from "@/components/fs";
import { CATEGORIES, INDUSTRY_LABEL, fmtDate, useAppState } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/")({
  head: pageHead("Employer Dashboard", "Overview of reported cases, safety issues, leave requests and salary queries."),
  component: Dashboard,
});

function Dashboard() {
  const s = useAppState();
  const cases = s.cases.filter((c) => c.industry === s.industry);
  const open = cases.filter((c) => c.status !== "Resolved");
  const counts = CATEGORIES.map((cat) => ({ cat, n: cases.filter((c) => c.category === cat).length }));
  const max = Math.max(1, ...counts.map((c) => c.n));
  const pendingLeave = s.leaves.filter((l) => l.industry === s.industry && l.status === "pending").length;
  const queries = s.queries.filter((q) => q.industry === s.industry && q.status !== "resolved").length;
  const urgent = open.filter((c) => c.urgency === "Critical" || c.urgency === "High").slice(0, 4);

  return (
    <div>
      <PageHeader eyebrow={`Employer · ${INDUSTRY_LABEL[s.industry]} (demo access)`} title="Employer Dashboard">
        Reporter identities stay hidden for anonymous reports. Switch industry at the top to compare.
      </PageHeader>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Total reported cases" value={cases.length} />
        <Stat label="Open safety issues" value={open.filter((c) => c.category === "Safety").length} accent />
        <Stat label="Resolved cases" value={cases.length - open.length} />
        <Stat label="Pending leave requests" value={pendingLeave} />
        <Stat label="Open salary queries" value={queries} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="fs-card p-6">
          <h2 className="text-lg font-bold text-primary">Recurring issue categories</h2>
          <ul className="mt-4 space-y-3">
            {counts.map(({ cat, n }) => (
              <li key={cat}>
                <div className="flex justify-between text-sm"><span>{cat}</span><span className="font-semibold">{n}</span></div>
                <div className="mt-1 h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-teal" style={{ width: `${(n / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="fs-card p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-primary">Urgent open cases</h2><Link to="/admin/reports" className="text-sm font-semibold text-teal underline">Manage reports</Link></div>
          {urgent.length === 0 ? <p className="mt-3 text-muted-foreground">No urgent open cases.</p> : (
            <ul className="mt-3 divide-y">
              {urgent.map((c) => (
                <li key={c.ref} className="py-3">
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-sm">{c.ref}</span><div className="flex gap-1"><Badge value={c.urgency} /><Badge value={c.status} /></div></div>
                  <p className="mt-1">{c.triage.summary}</p>
                  <p className="text-xs text-muted-foreground">{c.category} · {fmtDate(c.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link to="/admin/leave" className="fs-btn fs-btn-outline">Manage Leave ({pendingLeave} pending)</Link>
        <Link to="/admin/salary" className="fs-btn fs-btn-outline">Review Salary Queries ({queries})</Link>
        <Link to="/admin/salary" className="fs-btn fs-btn-outline">Configure pay policy</Link>
      </div>
    </div>
  );
}
