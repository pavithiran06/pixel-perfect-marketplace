import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Clock, Sparkles, Wallet } from "lucide-react";
import { diagnoseProblem, type ProblemDiagnosis } from "@/lib/problem-finder.functions";
import { fetchWorkers } from "@/lib/queries";
import { WorkerCard } from "@/components/WorkerCard";

export const Route = createFileRoute("/problem-finder")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Problem Finder — Kaigaar" },
      {
        name: "description",
        content:
          "Describe your home repair problem and get the right trade, urgency, a rough cost estimate and matching verified workers.",
      },
      { property: "og:title", content: "Problem Finder — Kaigaar" },
      {
        property: "og:description",
        content: "Tell us what's wrong at home — we identify the trade, urgency and matching pros.",
      },
    ],
  }),
  component: ProblemFinder,
});

const urgencyStyle: Record<string, string> = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-accent text-accent-foreground",
  low: "bg-leaf text-leaf-foreground",
};

function ProblemFinder() {
  const { q } = Route.useSearch();
  const [description, setDescription] = useState(q ?? "");
  const [diagnosis, setDiagnosis] = useState<ProblemDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const diagnose = useServerFn(diagnoseProblem);

  const { data: allWorkers } = useQuery({ queryKey: ["workers"], queryFn: () => fetchWorkers() });

  async function run(text: string) {
    if (text.trim().length < 5) return;
    setLoading(true);
    try {
      setDiagnosis(await diagnose({ data: { description: text.trim() } }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (q && q.trim().length >= 5) void run(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matches = diagnosis
    ? (allWorkers ?? []).filter((w) => w.trade === diagnosis.trade)
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <span className="chip">
        <Sparkles className="h-3.5 w-3.5" /> AI problem finder
      </span>
      <h1 className="mt-3 font-display text-4xl font-bold">What's wrong at home?</h1>
      <p className="mt-2 text-muted-foreground">
        Describe the problem in your own words. We'll work out the trade, how urgent it is, a rough
        cost, and who can fix it.
      </p>

      <form
        className="paper-card mt-8 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run(description);
        }}
      >
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="field-input resize-none"
          placeholder="e.g. “The pipe under my kitchen sink drips constantly and the cabinet wood is swelling.”"
          aria-label="Describe your problem"
        />
        <button type="submit" disabled={loading} className="btn-primary mt-3">
          {loading ? "Thinking…" : "Diagnose my problem"} <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {diagnosis ? (
        <div className="mt-8 space-y-8">
          <div className="paper-card grid gap-4 p-6 sm:grid-cols-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" /> You need a
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-primary">{diagnosis.trade}</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Urgency
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-bold capitalize ${urgencyStyle[diagnosis.urgency]}`}
              >
                {diagnosis.urgency}
              </span>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" /> Rough cost
              </p>
              <p className="mt-1 font-display text-2xl font-bold">{diagnosis.estimatedCost}</p>
            </div>
            <p className="text-sm text-muted-foreground sm:col-span-3">{diagnosis.advice}</p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold">
              {diagnosis.trade}s who can help
            </h2>
            {matches.length ? (
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {matches.map((w) => (
                  <WorkerCard key={w.id} worker={w} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">
                No {diagnosis.trade.toLowerCase()}s listed yet —{" "}
                <Link to="/workers" className="font-bold text-primary underline">
                  browse all workers
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
