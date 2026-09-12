import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const links = [
  { to: "/", label: "Home" },
  { to: "/problem-finder", label: "Problem Finder" },
  { to: "/workers", label: "Workers" },
  { to: "/bookings", label: "Bookings" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

export function SiteNav() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">
            K
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Kaigaar<span className="text-primary">.</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-40 truncate text-sm font-bold text-muted-foreground sm:block">
                {(user.user_metadata?.["full_name"] as string) || user.email}
              </span>
              <button onClick={signOut} className="btn-outline !px-3 !py-1.5 text-sm">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary !px-4 !py-2 text-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-1.5 md:hidden">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-bold text-muted-foreground"
            activeProps={{ className: "bg-secondary text-foreground" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
