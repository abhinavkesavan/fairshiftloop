import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, PageHeader } from "@/components/fs";
import { computePayslip, inr, leaveDaysInMonth } from "@/lib/payroll";
import { INDUSTRY_LABEL, PAY_MONTH, WORKERS, useAppState } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: pageHead("Worker Portal", "Report concerns safely, understand your pay and manage leave — for construction and college workers."),
  component: Index,
});

function Index() {
  const s = useAppState();
  const w = WORKERS[s.industry];
  const unpaid = s.leaves.filter((l) => l.industry === s.industry && l.type === "unpaid" && l.status === "approved")
    .reduce((a, l) => a + leaveDaysInMonth(l.start, l.end, PAY_MONTH), 0);
  const pay = computePayslip(s.shifts[s.industry], unpaid, s.policies[s.industry]);
  const myLeaves = s.leaves.filter((l) => l.industry === s.industry);
  const latest = s.lastRef ? s.cases.find((c) => c.ref === s.lastRef) : undefined;

  const tiles = [
    { to: "/track", title: "Track a Case", body: "Enter your case reference to see the latest status." },
    { to: "/payslip", title: "My Payslip", body: `Estimated net pay this month: ${inr(pay.net)}` },
    { to: "/shifts", title: "My Shifts", body: `${s.shifts[s.industry].length} shifts logged in October 2026` },
    { to: "/leave", title: "My Leave", body: `${myLeaves.filter((l) => l.status === "pending").length} request(s) pending` },
  ] as const;

  return (
    <div className="space-y-8">
      <section className="fs-card overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-10">
          <div>
            <PageHeader eyebrow={`${INDUSTRY_LABEL[s.industry]} · Worker Portal`} title={`Namaste, ${w.name.split(" ")[0]}`}>
              {w.role} at {w.org}. Your voice matters — report problems safely, check your pay and plan your leave.
            </PageHeader>
            <Link to="/report" className="fs-btn fs-btn-teal px-7 py-4 text-lg">Report a Concern</Link>
            <p className="mt-3 text-sm text-muted-foreground">You can report anonymously. No name or email needed.</p>
          </div>
          <div className="rounded-xl bg-navy p-6 text-navy-foreground">
            <p className="text-sm text-navy-foreground/70">Estimated net pay · Oct 2026</p>
            <p className="mt-1 font-display text-4xl font-extrabold">{inr(pay.net)}</p>
            <p className="mt-3 text-sm text-navy-foreground/80">Gross {inr(pay.gross)} − deductions {inr(pay.totalDeductions)}</p>
            <Link to="/payslip" className="mt-5 inline-block font-semibold text-teal underline">See how it's calculated →</Link>
          </div>
        </div>
      </section>

      {latest && (
        <div className="fs-card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm text-muted-foreground">Your latest report</p>
            <p className="font-display text-lg font-bold">{latest.ref} · {latest.category}</p>
          </div>
          <Badge value={latest.status} />
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="fs-card block p-5 transition hover:border-teal">
            <h2 className="text-lg font-bold text-primary">{t.title}</h2>
            <p className="mt-1 text-muted-foreground">{t.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
