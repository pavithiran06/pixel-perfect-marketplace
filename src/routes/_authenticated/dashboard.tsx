import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Briefcase, CalendarDays, IndianRupee, Star } from "lucide-react";
import {
  fetchMyWorkerProfile,
  fetchPortfolio,
  fetchWorkerBookings,
} from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Worker Dashboard — Kaigaar" },
      {
        name: "description",
        content: "Manage your jobs, earnings, quotes and proof-of-work portfolio.",
      },
    ],
  }),
  component: Dashboard,
});

const statusStyle: Record<string, string> = {
  pending: "bg-accent text-accent-foreground",
  accepted: "bg-leaf text-leaf-foreground",
  completed: "bg-primary text-primary-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

function Dashboard() {
  const { user } = Route.useRouteContext() as { user: { id: string } };
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-worker-profile", user.id],
    queryFn: () => fetchMyWorkerProfile(user.id),
  });

  if (isLoading) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Loading dashboard…</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {profile ? (
        <WorkerView
          userId={user.id}
          profile={profile}
          onChanged={() =>
            queryClient.invalidateQueries({ queryKey: ["my-worker-profile", user.id] })
          }
        />
      ) : (
        <BecomeWorker
          userId={user.id}
          onCreated={() =>
            queryClient.invalidateQueries({ queryKey: ["my-worker-profile", user.id] })
          }
        />
      )}
    </div>
  );
}

function BecomeWorker({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("Plumber");
  const [city, setCity] = useState("");
  const [rate, setRate] = useState("400");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("worker_profiles").insert({
      user_id: userId,
      display_name: name,
      trade,
      city,
      hourly_rate: Number(rate) || null,
      bio,
    });
    setSaving(false);
    if (!error) onCreated();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-4xl font-bold">Set up your worker profile</h1>
      <p className="mt-2 text-muted-foreground">
        Create your profile to receive bookings and build your proof-of-work portfolio.
      </p>
      <form onSubmit={submit} className="paper-card mt-6 space-y-3 p-6">
        <label className="block text-sm font-bold">
          Display name
          <input required value={name} onChange={(e) => setName(e.target.value)} className="field-input mt-1 font-normal" />
        </label>
        <label className="block text-sm font-bold">
          Trade
          <select value={trade} onChange={(e) => setTrade(e.target.value)} className="field-input mt-1 font-normal">
            {["Plumber", "Electrician", "Carpenter", "Painter", "AC Technician", "Mason"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold">
            City
            <input required value={city} onChange={(e) => setCity(e.target.value)} className="field-input mt-1 font-normal" />
          </label>
          <label className="block text-sm font-bold">
            Rate (₹/hr)
            <input value={rate} onChange={(e) => setRate(e.target.value)} type="number" min="0" className="field-input mt-1 font-normal" />
          </label>
        </div>
        <label className="block text-sm font-bold">
          About your work
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="field-input mt-1 resize-none font-normal" />
        </label>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Creating…" : "Create worker profile"}
        </button>
      </form>
    </div>
  );
}

function WorkerView({
  profile,
  onChanged,
}: {
  userId: string;
  profile: NonNullable<Awaited<ReturnType<typeof fetchMyWorkerProfile>>>;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: bookings } = useQuery({
    queryKey: ["worker-bookings", profile.id],
    queryFn: () => fetchWorkerBookings(profile.id),
  });
  const { data: portfolio } = useQuery({
    queryKey: ["portfolio", profile.id],
    queryFn: () => fetchPortfolio(profile.id),
  });

  const [quoteFor, setQuoteFor] = useState<string | null>(null);
  const [quote, setQuote] = useState("");

  const upcoming = (bookings ?? []).filter((b) => b.status === "pending" || b.status === "accepted");
  const earnings = (bookings ?? [])
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (Number(b.quoted_price) || 0), 0);

  async function setStatus(id: string, status: string, quoted?: number) {
    await supabase
      .from("bookings")
      .update(quoted != null ? { status, quoted_price: quoted } : { status })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["worker-bookings", profile.id] });
    setQuoteFor(null);
    setQuote("");
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-bold">Vanakkam, {profile.display_name.split(" ")[0]}</h1>
      <p className="mt-2 text-muted-foreground">{profile.trade} · {profile.city}</p>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          { icon: IndianRupee, label: "Earnings", value: `₹${earnings.toLocaleString("en-IN")}` },
          { icon: CalendarDays, label: "Upcoming jobs", value: String(upcoming.length) },
          { icon: Star, label: "Rating", value: Number(profile.rating).toFixed(1) },
          { icon: Briefcase, label: "Jobs done", value: String(profile.jobs_done ?? 0) },
        ].map((s) => (
          <div key={s.label} className="paper-card p-5">
            <s.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Jobs */}
      <h2 className="mt-10 font-display text-2xl font-bold">Job requests</h2>
      <div className="mt-4 space-y-4">
        {(bookings ?? []).map((b) => (
          <div key={b.id} className="paper-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold">{b.customer_name ?? "Customer"}</p>
                <p className="text-sm text-muted-foreground">{b.description}</p>
                {b.scheduled_date ? (
                  <p className="mt-1 text-sm text-muted-foreground">Preferred: {b.scheduled_date}</p>
                ) : null}
                {b.quoted_price != null ? (
                  <p className="mt-1 text-sm font-bold">Quote: ₹{b.quoted_price}</p>
                ) : null}
              </div>
              <span className={`chip capitalize ${statusStyle[b.status] ?? ""}`}>{b.status}</span>
            </div>
            {b.status === "pending" ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {quoteFor === b.id ? (
                  <>
                    <input
                      type="number"
                      min="0"
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      placeholder="Quote ₹"
                      className="field-input !w-32"
                    />
                    <button
                      onClick={() => setStatus(b.id, "accepted", Number(quote) || undefined)}
                      className="btn-primary !py-2 text-sm"
                    >
                      Accept with quote
                    </button>
                    <button onClick={() => setQuoteFor(null)} className="btn-outline !py-2 text-sm">
                      Back
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setQuoteFor(b.id)} className="btn-primary !py-2 text-sm">
                      Accept &amp; quote
                    </button>
                    <button
                      onClick={() => setStatus(b.id, "cancelled")}
                      className="btn-outline !py-2 text-sm !border-destructive !text-destructive hover:!bg-destructive/10"
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
            ) : null}
            {b.status === "accepted" ? (
              <button
                onClick={() => setStatus(b.id, "completed")}
                className="btn-primary mt-3 !py-2 text-sm"
              >
                Mark completed
              </button>
            ) : null}
          </div>
        ))}
        {!bookings?.length ? (
          <p className="text-muted-foreground">No job requests yet. They'll appear here.</p>
        ) : null}
      </div>

      {/* Portfolio progress */}
      <h2 className="mt-10 font-display text-2xl font-bold">Proof-of-work portfolio</h2>
      <div className="paper-card mt-4 p-5">
        <div className="flex items-center justify-between text-sm font-bold">
          <span>{portfolio?.length ?? 0} portfolio {portfolio?.length === 1 ? "item" : "items"}</span>
          <span className="text-muted-foreground">
            {(portfolio?.length ?? 0) >= 5 ? "Strong portfolio!" : "Add 5 items to build trust"}
          </span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, ((portfolio?.length ?? 0) / 5) * 100)}%` }}
          />
        </div>
        {portfolio?.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {portfolio.map((p) => (
              <div key={p.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-bold">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
            ))}
          </div>
        ) : null}
        <AddPortfolioItem workerId={profile.id} onAdded={onChanged} />
      </div>
    </div>
  );
}

function AddPortfolioItem({ workerId, onAdded }: { workerId: string; onAdded: () => void }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("portfolio_items")
      .insert({ worker_id: workerId, title, description });
    setSaving(false);
    if (!error) {
      setTitle("");
      setDescription("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["portfolio", workerId] });
      onAdded();
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-outline mt-4 !py-2 text-sm">
        + Add portfolio item
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-border p-4">
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Job title, e.g. “Bathroom refit, Velachery”"
        className="field-input"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What did you do?"
        rows={2}
        className="field-input resize-none"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary !py-2 text-sm">
          {saving ? "Saving…" : "Save item"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-outline !py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
