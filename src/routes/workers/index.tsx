import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { fetchWorkers } from "@/lib/queries";
import { WorkerCard } from "@/components/WorkerCard";

export const Route = createFileRoute("/workers/")({
  head: () => ({
    meta: [
      { title: "Browse Workers — Kaigaar" },
      {
        name: "description",
        content:
          "Search verified local plumbers, electricians, carpenters, painters, AC technicians and masons with ratings and proof of work.",
      },
      { property: "og:title", content: "Browse Workers — Kaigaar" },
      {
        property: "og:description",
        content: "Search verified local tradespeople with ratings, badges and proof of work.",
      },
    ],
  }),
  component: Workers,
});

const trades = ["All", "Plumber", "Electrician", "Carpenter", "Painter", "AC Technician", "Mason"];

function Workers() {
  const [search, setSearch] = useState("");
  const [trade, setTrade] = useState("All");
  const { data: workers, isLoading } = useQuery({
    queryKey: ["workers", search],
    queryFn: () => fetchWorkers(search),
  });

  const filtered = (workers ?? []).filter((w) => trade === "All" || w.trade === trade);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Find your tradesperson</h1>
      <p className="mt-2 text-muted-foreground">
        Every pro carries proof of work — real job photos and reviews from real customers.
      </p>

      <div className="paper-card mt-6 flex items-center gap-2 p-2">
        <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, trade or city…"
          className="w-full bg-transparent py-2 text-sm outline-none"
          aria-label="Search workers"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {trades.map((t) => (
          <button
            key={t}
            onClick={() => setTrade(t)}
            className={`chip transition-colors ${trade === t ? "!bg-primary !text-primary-foreground" : "hover:bg-accent"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Loading workers…</p>
      ) : filtered.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-muted-foreground">No workers match that search.</p>
      )}
    </div>
  );
}
