import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, IndianRupee } from "lucide-react";
import { fetchMyBookings } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — Kaigaar" },
      { name: "description", content: "Track your booked jobs, statuses and quotes." },
    ],
  }),
  component: Bookings,
});

const statusStyle: Record<string, string> = {
  pending: "bg-accent text-accent-foreground",
  accepted: "bg-leaf text-leaf-foreground",
  completed: "bg-primary text-primary-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

function Bookings() {
  const { user } = Route.useRouteContext() as { user: { id: string } };
  const queryClient = useQueryClient();
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", user.id],
    queryFn: () => fetchMyBookings(user.id),
  });

  async function cancel(id: string) {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">My bookings</h1>
      <p className="mt-2 text-muted-foreground">Track your jobs from request to completion.</p>

      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Loading bookings…</p>
      ) : bookings?.length ? (
        <div className="mt-8 space-y-4">
          {bookings.map((b) => {
            const worker = b.worker_profiles as {
              display_name: string;
              trade: string;
              city: string | null;
            } | null;
            return (
              <div key={b.id} className="paper-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-bold">{worker?.display_name ?? "Worker"}</p>
                    <span className={`chip capitalize ${statusStyle[b.status] ?? ""}`}>{b.status}</span>
                  </div>
                  <p className="text-sm font-bold text-primary">{worker?.trade}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {b.scheduled_date ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" /> {b.scheduled_date}
                      </span>
                    ) : null}
                    {b.quoted_price != null ? (
                      <span className="inline-flex items-center gap-1 font-bold text-foreground">
                        <IndianRupee className="h-4 w-4" /> {b.quoted_price}
                      </span>
                    ) : (
                      <span>Quote pending</span>
                    )}
                  </div>
                </div>
                {b.status === "pending" ? (
                  <button
                    onClick={() => cancel(b.id)}
                    className="btn-outline self-start !border-destructive !text-destructive hover:!bg-destructive/10"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="paper-card mt-8 p-8 text-center">
          <p className="text-muted-foreground">No bookings yet.</p>
          <Link to="/workers" className="btn-primary mt-4">
            Find a worker
          </Link>
        </div>
      )}
    </div>
  );
}
