import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge, Field, PageHeader } from "@/components/fs";
import { CASE_STATUSES, INDUSTRY_LABEL, fmtDate, useAppState } from "@/lib/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/track")({
  head: pageHead("Track a Case", "Enter your case reference to see the latest status of your report."),
  component: Track,
});

function Track() {
  const s = useAppState();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  useEffect(() => { if (s.lastRef && !input) setInput(s.lastRef); }, [s.lastRef]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = query ? s.cases.find((x) => x.ref === query) : undefined;
  const step = c ? CASE_STATUSES.indexOf(c.status) : -1;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="SpeakUp" title="Track a Case">Enter the reference you received when you reported, e.g. FS-C7K2MQ.</PageHeader>
      <form className="fs-card flex flex-col gap-3 p-6 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); setQuery(input.trim().toUpperCase()); }}>
        <div className="flex-1"><Field label="Case reference"><input className="fs-input font-mono uppercase" value={input} onChange={(e) => setInput(e.target.value)} maxLength={12} /></Field></div>
        <button className="fs-btn fs-btn-primary" type="submit" disabled={!input.trim()}>Check status</button>
      </form>

      {query && !c && <p role="alert" className="mt-4 rounded-lg bg-destructive-soft p-4 font-medium text-destructive">No case found for “{query}”. Check the reference and try again.</p>}

      {c && (
        <div className="fs-card mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-sm text-muted-foreground">{c.ref}</p>
              <h2 className="text-xl font-bold">{c.category} · {INDUSTRY_LABEL[c.industry]}</h2>
            </div>
            <Badge value={c.status} />
          </div>
          <ol className="mt-6 grid grid-cols-4 gap-2">
            {CASE_STATUSES.map((st, i) => (
              <li key={st} className="text-center">
                <div className={`h-2 rounded-full ${i <= step ? "bg-teal" : "bg-muted"}`} />
                <p className={`mt-2 text-sm ${i <= step ? "font-semibold" : "text-muted-foreground"}`}>{st}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-muted-foreground">Reported {fmtDate(c.createdAt)} · last updated {fmtDate(c.updatedAt)}</p>
          <h3 className="mt-6 font-bold">Updates from your employer</h3>
          {c.notes.length === 0 ? <p className="mt-2 text-muted-foreground">No updates yet. Your report is waiting to be reviewed.</p> : (
            <ul className="mt-2 space-y-3">
              {[...c.notes].reverse().map((n, i) => (
                <li key={i} className="rounded-lg bg-muted p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Badge value={n.status} /> {fmtDate(n.at)}</div>
                  {n.text && <p className="mt-1">{n.text}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
