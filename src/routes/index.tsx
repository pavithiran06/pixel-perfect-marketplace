import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, ClipboardList, Search, Wrench } from "lucide-react";
import { fetchWorkers } from "@/lib/queries";
import { WorkerCard } from "@/components/WorkerCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kaigaar — Find verified local tradespeople" },
      {
        name: "description",
        content:
          "Describe your home problem and Kaigaar matches you with verified local plumbers, electricians, carpenters, painters, AC technicians and masons.",
      },
      { property: "og:title", content: "Kaigaar — Find verified local tradespeople" },
      {
        property: "og:description",
        content:
          "Describe your home problem and get matched with verified local tradespeople. Real proof of work, honest quotes.",
      },
    ],
  }),
  component: Home,
});

const steps = [
  {
    icon: ClipboardList,
    title: "Describe the problem",
    text: "Tell us what's wrong in plain words — a leaking tap, a dead switch, a cracked wall.",
  },
  {
    icon: Search,
    title: "Get matched",
    text: "We identify the right trade, urgency and a fair rough cost, then show matching pros.",
  },
  {
    icon: Wrench,
    title: "Book with confidence",
    text: "Check proof-of-work photos and real reviews, then book your tradesperson directly.",
  },
];

function Home() {
  const navigate = useNavigate();
  const [problem, setProblem] = useState("");
  const { data: workers } = useQuery({
    queryKey: ["workers", "top"],
    queryFn: () => fetchWorkers(),
  });

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="chip">Verified local tradespeople</span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-6xl">
              Skilled hands for <span className="ink-underline text-primary">every home problem</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Plumbers, electricians, carpenters, painters and more — with real proof of work and
              honest reviews.
            </p>
            <form
              className="paper-card mt-8 flex flex-col gap-3 p-4 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                navigate({
                  to: "/problem-finder",
                  search: { q: problem.trim() || undefined },
                });
              }}
            >
              <input
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="What's wrong? e.g. “Water is leaking under my kitchen sink”"
                className="field-input flex-1"
                aria-label="Describe your problem"
              />
              <button type="submit" className="btn-primary">
                Find a pro <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-3xl font-bold">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="paper-card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Step {i + 1}
              </p>
              <h3 className="mt-1 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top rated */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold">Top-rated pros near you</h2>
          <Link to="/workers" className="btn-outline hidden sm:inline-flex">
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(workers ?? []).slice(0, 6).map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link to="/workers" className="btn-outline">
            Browse all workers
          </Link>
        </div>
      </section>
    </div>
  );
}
