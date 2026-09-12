import { supabase } from "@/integrations/supabase/client";

export async function fetchWorkers(search?: string) {
  let q = supabase
    .from("worker_profiles")
    .select("*")
    .order("rating", { ascending: false });
  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    q = q.or(`display_name.ilike.${s},trade.ilike.${s},city.ilike.${s},bio.ilike.${s}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchWorker(id: string) {
  const { data, error } = await supabase
    .from("worker_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchPortfolio(workerId: string) {
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReviews(workerId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCourses() {
  const { data, error } = await supabase.from("courses").select("*").order("title");
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyBookings(userId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, worker_profiles(display_name, trade, avatar_url, city)")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyWorkerProfile(userId: string) {
  const { data, error } = await supabase
    .from("worker_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchWorkerBookings(workerId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyRoles(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.role as string);
}
