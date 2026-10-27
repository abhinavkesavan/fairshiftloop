import { Link } from "@tanstack/react-router";
import { INDUSTRY_LABEL, resetDemo, update, useAppState, type Industry } from "@/lib/store";

const worker = [
  { to: "/", label: "Worker Portal" },
  { to: "/report", label: "Report a Concern" },
  { to: "/track", label: "Track a Case" },
  { to: "/payslip", label: "My Payslip" },
  { to: "/shifts", label: "My Shifts" },
  { to: "/leave", label: "My Leave" },
] as const;
const admin = [
  { to: "/admin", label: "Employer Dashboard" },
  { to: "/admin/reports", label: "Manage Reports" },
  { to: "/admin/leave", label: "Manage Leave" },
  { to: "/admin/salary", label: "Review Salary Queries" },
] as const;

const linkCls = "whitespace-nowrap rounded-md px-3 py-2 text-[0.95rem] font-medium text-navy-foreground/80 hover:bg-navy-foreground/10 hover:text-navy-foreground";
const activeCls = "bg-teal text-teal-foreground hover:bg-teal hover:text-teal-foreground";

export function AppNav() {
  const { industry } = useAppState();
  return (
    <header className="bg-navy text-navy-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal font-display text-lg font-extrabold text-teal-foreground">F</span>
          <span className="font-display text-lg font-extrabold">FairShift <span className="font-semibold text-teal">TrustLoop</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-navy-foreground/70 sm:inline">Demo industry:</span>
          <div className="flex rounded-lg bg-navy-foreground/10 p-1" role="group" aria-label="Switch industry">
            {(["construction", "college"] as Industry[]).map((i) => (
              <button
                key={i}
                onClick={() => update((s) => ({ ...s, industry: i }))}
                aria-pressed={industry === i}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${industry === i ? "bg-card text-primary" : "text-navy-foreground/80"}`}
              >
                {INDUSTRY_LABEL[i]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <nav className="mx-auto max-w-7xl px-4 pb-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-teal">Worker</span>
            {worker.map((l) => (
              <Link key={l.to} to={l.to} className={linkCls} activeProps={{ className: activeCls }} activeOptions={{ exact: true }}>{l.label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-teal">Employer (demo)</span>
            {admin.map((l) => (
              <Link key={l.to} to={l.to} className={linkCls} activeProps={{ className: activeCls }} activeOptions={{ exact: true }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </nav>
      <div className="bg-teal-soft text-accent-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-sm">
          <span>Demo mode: data is stored only in this browser. Worker/Employer switching is for demonstration and provides no real security.</span>
          <button onClick={() => { if (confirm("Reset all demo data to the sample records?")) resetDemo(); }} className="font-semibold underline">Reset demo data</button>
        </div>
      </div>
    </header>
  );
}
