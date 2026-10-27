import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DemoNote, Field, PageHeader } from "@/components/fs";
import { CATEGORIES, INDUSTRY_LABEL, URGENCIES, newRef, update, useAppState, type Category, type Industry, type Urgency } from "@/lib/store";
import { triage } from "@/lib/triage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/report")({
  head: pageHead("Report a Concern", "Report a safety hazard, pay problem or workplace grievance — anonymously if you prefer."),
  component: Report,
});

function Report() {
  const s = useAppState();
  const [industry, setIndustry] = useState<Industry | null>(null);
  const ind = industry ?? s.industry;
  const [category, setCategory] = useState<Category | "">("");
  const [urgency, setUrgency] = useState<Urgency>("Medium");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);

  const preview = description.trim().length >= 15 ? triage(description, (category || "Other") as Category) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!category) err.category = "Please choose what the concern is about.";
    const d = description.trim();
    if (d.length < 15) err.description = "Please describe the problem in at least 15 characters.";
    if (d.length > 2000) err.description = "Please keep it under 2000 characters.";
    if (location.length > 120) err.location = "Keep the location under 120 characters.";
    if (!anonymous && !name.trim()) err.name = "Enter a name, or choose to report anonymously.";
    setErrors(err);
    if (Object.keys(err).length) return;
    const cat = category as Category;
    const now = new Date().toISOString();
    const ref = newRef(ind, s.cases.map((c) => c.ref));
    update((st) => ({
      ...st,
      lastRef: ref,
      cases: [{
        ref, industry: ind, category: cat, urgency, description: d, location: location.trim() || undefined,
        anonymous, reporterName: anonymous ? undefined : name.trim().slice(0, 80), status: "Submitted",
        createdAt: now, updatedAt: now, notes: [], triage: triage(d, cat),
      }, ...st.cases],
    }));
    setDone(ref);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl fs-card p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal">Report received</p>
        <h1 className="mt-2 text-2xl font-extrabold text-primary">Thank you for speaking up</h1>
        <p className="mt-4 text-muted-foreground">Your case reference is</p>
        <p className="mt-1 select-all font-display text-4xl font-extrabold tracking-wider text-primary">{done}</p>
        <button onClick={() => navigator.clipboard?.writeText(done)} className="fs-btn fs-btn-outline mt-3">Copy reference</button>
        <p className="mt-6 text-left text-muted-foreground">
          Write this reference down or save a screenshot. To check progress, open <strong>Track a Case</strong> and enter it. Status moves from Submitted → Under Review → In Progress → Resolved.
          {anonymous && " Because you reported anonymously, this reference is the only way to follow your case."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/track" className="fs-btn fs-btn-primary">Track this case</Link>
          <button onClick={() => { setDone(null); setDescription(""); setCategory(""); setLocation(""); }} className="fs-btn fs-btn-outline">Report another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="SpeakUp" title="Report a Concern">Tell us what's wrong. You don't need to give your name.</PageHeader>
      <form onSubmit={submit} className="fs-card space-y-5 p-6" noValidate>
        <Field label="Where do you work?">
          <div className="grid grid-cols-2 gap-3">
            {(["construction", "college"] as Industry[]).map((i) => (
              <button type="button" key={i} onClick={() => setIndustry(i)} aria-pressed={ind === i}
                className={`fs-btn ${ind === i ? "fs-btn-primary" : "fs-btn-outline"}`}>{INDUSTRY_LABEL[i]}</button>
            ))}
          </div>
        </Field>
        <Field label="What is it about?" error={errors.category}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <button type="button" key={c} onClick={() => setCategory(c)} aria-pressed={category === c}
                className={`fs-btn ${category === c ? "fs-btn-teal" : "fs-btn-outline"}`}>{c}</button>
            ))}
          </div>
        </Field>
        <Field label="Describe the problem" error={errors.description} hint="What happened, and when? Avoid naming individuals if you're unsure.">
          <textarea className="fs-input min-h-32" value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Location (optional)" error={errors.location}>
          <input className="fs-input" value={location} maxLength={120} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Tower B, level 6" />
        </Field>
        <Field label="How urgent is it?">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {URGENCIES.map((u) => (
              <button type="button" key={u} onClick={() => setUrgency(u)} aria-pressed={urgency === u}
                className={`fs-btn ${urgency === u ? "fs-btn-primary" : "fs-btn-outline"}`}>{u}</button>
            ))}
          </div>
        </Field>
        <label className="flex items-start gap-3 rounded-lg bg-muted p-4">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-teal" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          <span><strong>Report anonymously</strong><br /><span className="text-sm text-muted-foreground">Your employer will not see who you are.</span></span>
        </label>
        {!anonymous && (
          <Field label="Your name" error={errors.name}>
            <input className="fs-input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        {preview && (
          <DemoNote>
            <strong>Demo triage — not live AI.</strong> Keyword rules suggest: <strong>{preview.suggestedCategory}</strong>, urgency <strong>{preview.suggestedUrgency}</strong>
            {preview.matched.length > 0 && <> (matched: {preview.matched.join(", ")})</>}. Your own choices are what get submitted.
          </DemoNote>
        )}
        <button type="submit" className="fs-btn fs-btn-teal w-full py-4 text-lg">Submit report</button>
      </form>
    </div>
  );
}
