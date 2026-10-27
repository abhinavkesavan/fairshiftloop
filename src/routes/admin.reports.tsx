import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, DemoNote, Empty, Field, PageHeader } from "@/components/fs";
import { CASE_STATUSES, CATEGORIES, INDUSTRY_LABEL, URGENCIES, fmtDate, update, useAppState, type Case, type CaseStatus } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/reports")({
  head: pageHead("Manage Reports", "Filter worker reports, update case status and add resolution notes."),
  component: Reports,
});

function Reports() {
  const s = useAppState();
  const [ind, setInd] = useState<string>("current");
  const [cat, setCat] = useState("all");
  const [urg, setUrg] = useState("all");
  const [st, setSt] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const industry = ind === "current" ? s.industry : ind;
  const list = s.cases.filter((c) => (industry === "all" || c.industry === industry) && (cat === "all" || c.category === cat) && (urg === "all" || c.urgency === urg) && (st === "all" || c.status === st));

  return (
    <div>
      <PageHeader eyebrow="Employer (demo access)" title="Manage Reports">Anonymous reporters are never identified.</PageHeader>
      <div className="fs-card grid gap-3 p-4 sm:grid-cols-4">
        <Field label="Industry"><select className="fs-input" value={ind} onChange={(e) => setInd(e.target.value)}>
          <option value="current">Current ({INDUSTRY_LABEL[s.industry]})</option><option value="all">All industries</option><option value="construction">Construction</option><option value="college">College</option></select></Field>
        <Field label="Category"><select className="fs-input" value={cat} onChange={(e) => setCat(e.target.value)}><option value="all">All</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Urgency"><select className="fs-input" value={urg} onChange={(e) => setUrg(e.target.value)}><option value="all">All</option>{URGENCIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Status"><select className="fs-input" value={st} onChange={(e) => setSt(e.target.value)}><option value="all">All</option>{CASE_STATUSES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{list.length} report(s)</p>
      <div className="mt-2 space-y-3">
        {list.length === 0 && <Empty>No reports match these filters.</Empty>}
        {list.map((c) => <CaseRow key={c.ref} c={c} expanded={open === c.ref} toggle={() => setOpen(open === c.ref ? null : c.ref)} />)}
      </div>
    </div>
  );
}

function CaseRow({ c, expanded, toggle }: { c: Case; expanded: boolean; toggle: () => void }) {
  const [status, setStatus] = useState<CaseStatus>(c.status);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  function save() {
    if (note.length > 500) return;
    const at = new Date().toISOString();
    update((s) => ({ ...s, cases: s.cases.map((x) => (x.ref === c.ref ? { ...x, status, updatedAt: at, notes: [...x.notes, { at, status, text: note.trim() }] } : x)) }));
    setNote(""); setSaved(true);
  }

  return (
    <div className="fs-card">
      <button onClick={toggle} aria-expanded={expanded} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground"><span className="font-mono">{c.ref}</span> · {INDUSTRY_LABEL[c.industry]} · {c.category} · {fmtDate(c.createdAt)}</p>
          <p className="mt-0.5 font-semibold">{c.triage.summary}</p>
        </div>
        <div className="flex gap-1"><Badge value={c.urgency} /><Badge value={c.status} /></div>
      </button>
      {expanded && (
        <div className="grid gap-5 border-t p-4 md:grid-cols-2">
          <div className="space-y-3">
            <p>{c.description}</p>
            <p className="text-sm text-muted-foreground">Location: {c.location ?? "Not given"} · Reporter: {c.anonymous ? "Anonymous (identity hidden)" : c.reporterName}</p>
            <DemoNote>
              <strong>Demo triage — not live AI.</strong> Suggested category: {c.triage.suggestedCategory}; suggested urgency: {c.triage.suggestedUrgency}.
              <ul className="mt-2 list-disc pl-5">{c.triage.actions.map((a) => <li key={a}>{a}</li>)}</ul>
              <span className="mt-1 block text-xs">Suggestions only. Verify facts before drawing any conclusion.</span>
            </DemoNote>
            {c.notes.length > 0 && (
              <ul className="space-y-1 text-sm">{c.notes.map((n, i) => <li key={i}><strong>{fmtDate(n.at)} · {n.status}:</strong> {n.text || "—"}</li>)}</ul>
            )}
          </div>
          <div className="space-y-3">
            <Field label="Update status"><select className="fs-input" value={status} onChange={(e) => { setStatus(e.target.value as CaseStatus); setSaved(false); }}>{CASE_STATUSES.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Resolution / progress note (visible to worker)" error={note.length > 500 ? "Keep notes under 500 characters." : undefined}>
              <textarea className="fs-input min-h-24" value={note} onChange={(e) => { setNote(e.target.value); setSaved(false); }} />
            </Field>
            <button onClick={save} disabled={status === c.status && !note.trim()} className="fs-btn fs-btn-primary w-full">Save update</button>
            {saved && <p className="font-medium text-success">Saved. The worker sees this when tracking {c.ref}.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
