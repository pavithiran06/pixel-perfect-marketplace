import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export function WorkerCard({ worker }: { worker: Tables<"worker_profiles"> }) {
  return (
    <Link
      to="/workers/$workerId"
      params={{ workerId: worker.id }}
      className="paper-card group flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {worker.avatar_url ? (
          <img
            src={worker.avatar_url}
            alt={`${worker.display_name}, ${worker.trade}`}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        {worker.verified ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-leaf px-2.5 py-1 text-xs font-bold text-leaf-foreground">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-tight">{worker.display_name}</h3>
          <span className="inline-flex items-center gap-1 text-sm font-bold">
            <Star className="h-4 w-4 fill-primary text-primary" />
            {Number(worker.rating).toFixed(1)}
          </span>
        </div>
        <p className="text-sm font-bold text-primary">{worker.trade}</p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{worker.bio}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {worker.city}
          </span>
          <span className="font-bold text-foreground">₹{worker.hourly_rate}/hr</span>
        </div>
      </div>
    </Link>
  );
}
