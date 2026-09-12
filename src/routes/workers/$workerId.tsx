import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BadgeCheck, Briefcase, MapPin, Star } from "lucide-react";
import { fetchPortfolio, fetchReviews, fetchWorker } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/workers/$workerId")({
  head: () => ({
    meta: [
      { title: "Worker Profile — Kaigaar" },
      {
        name: "description",
        content: "Proof-of-work portfolio, reviews and booking for a verified local tradesperson.",
      },
      { property: "og:title", content: "Worker Profile — Kaigaar" },
      {
        property: "og:description",
        content: "See real job photos, reviews and book this tradesperson.",
      },
    ],
  }),
  component: WorkerProfile,
});

function WorkerProfile() {
  const { workerId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [date, setDate] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");

  const { data: worker, isLoading } = useQuery({
    queryKey: ["worker", workerId],
    queryFn: async () => {
      const w = await fetchWorker(workerId);
      if (!w) throw notFound();
      return w;
    },
  });
  const { data: portfolio } = useQuery({
    queryKey: ["portfolio", workerId],
    queryFn: () => fetchPortfolio(workerId),
  });
  const { data: reviews } = useQuery({
    queryKey: ["reviews", workerId],
    queryFn: () => fetchReviews(workerId),
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !worker) return;
    setState("saving");
    const { error } = await supabase.from("bookings").insert({
      customer_id: user.id,
      worker_id: worker.id,
      customer_name: (user.user_metadata?.["full_name"] as string) || user.email || null,
      description: jobDesc,
      scheduled_date: date || null,
    });
    if (error) {
      setState("error");
    } else {
      setState("done");
      setJobDesc("");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    }
  }

  if (isLoading) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Loading profile…</p>;
  }
  if (!worker) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="paper-card flex flex-col gap-6 p-6 sm:flex-row">
        <img
          src={worker.avatar_url ?? ""}
          alt={`${worker.display_name}, ${worker.trade}`}
          className="h-40 w-40 rounded-xl border border-border object-cover object-top"
          width={160}
          height={160}
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-bold">{worker.display_name}</h1>
            {worker.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-leaf px-2.5 py-1 text-xs font-bold text-leaf-foreground">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified pro
              </span>
            ) : null}
          </div>
          <p className="mt-1 font-bold text-primary">{worker.trade}</p>
          <p className="mt-3 max-w-2xl text-muted-foreground">{worker.bio}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" /> {Number(worker.rating).toFixed(1)} rating
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Briefcase className="h-4 w-4" /> {worker.jobs_done} jobs done
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {worker.city}
            </span>
            <span>₹{worker.hourly_rate}/hr</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {/* Proof of work */}
          <section>
            <h2 className="font-display text-2xl font-bold">Proof of work</h2>
            {portfolio?.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {portfolio.map((p) => (
                  <figure key={p.id} className="paper-card overflow-hidden">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.title}
                        loading="lazy"
                        className="aspect-[3/2] w-full object-cover"
                      />
                    ) : null}
                    <figcaption className="p-4">
                      <p className="font-bold">{p.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">No portfolio photos yet.</p>
            )}
          </section>

          {/* Reviews */}
          <section>
            <h2 className="font-display text-2xl font-bold">Reviews</h2>
            <div className="mt-4 space-y-4">
              {(reviews ?? []).map((r) => (
                <div key={r.id} className="paper-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{r.reviewer_name}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-bold">
                      <Star className="h-4 w-4 fill-primary text-primary" /> {r.rating}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                </div>
              ))}
              {!reviews?.length ? (
                <p className="text-muted-foreground">No reviews yet.</p>
              ) : null}
            </div>
          </section>
        </div>

        {/* Booking */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <form onSubmit={book} className="paper-card p-6">
            <h2 className="font-display text-xl font-bold">Book {worker.display_name.split(" ")[0]}</h2>
            {state === "done" ? (
              <div className="mt-4 rounded-lg bg-leaf/15 p-4 text-sm font-bold text-foreground">
                Booking sent! Track it on your{" "}
                <Link to="/bookings" className="text-primary underline">
                  bookings page
                </Link>
                .
              </div>
            ) : user ? (
              <>
                <label className="mt-4 block text-sm font-bold">
                  Describe the job
                  <textarea
                    required
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    rows={4}
                    className="field-input mt-1 resize-none font-normal"
                    placeholder="What needs fixing or building?"
                  />
                </label>
                <label className="mt-3 block text-sm font-bold">
                  Preferred date
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="field-input mt-1 font-normal"
                  />
                </label>
                {state === "error" ? (
                  <p className="mt-2 text-sm font-bold text-destructive">
                    Couldn't send the booking. Please try again.
                  </p>
                ) : null}
                <button type="submit" disabled={state === "saving"} className="btn-primary mt-4 w-full">
                  {state === "saving" ? "Sending…" : "Request booking"}
                </button>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Sign in to request a booking with {worker.display_name.split(" ")[0]}.
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/auth" })}
                  className="btn-primary mt-3 w-full"
                >
                  Sign in to book
                </button>
              </div>
            )}
          </form>
        </aside>
      </div>
    </div>
  );
}
