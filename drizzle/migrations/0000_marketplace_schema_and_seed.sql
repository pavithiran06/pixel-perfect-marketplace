
create type public.app_role as enum ('customer', 'worker', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  city text,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.worker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  trade text not null,
  bio text,
  city text,
  hourly_rate numeric,
  rating numeric default 0,
  jobs_done integer default 0,
  verified boolean default false,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select on public.worker_profiles to anon;
grant select, insert, update on public.worker_profiles to authenticated;
grant all on public.worker_profiles to service_role;
alter table public.worker_profiles enable row level security;
create policy "Anyone can browse workers" on public.worker_profiles for select to anon, authenticated using (true);
create policy "Workers manage own profile" on public.worker_profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "Workers update own profile" on public.worker_profiles for update to authenticated using (auth.uid() = user_id);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references public.worker_profiles(id) on delete cascade not null,
  title text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);
grant select on public.portfolio_items to anon;
grant select, insert, update, delete on public.portfolio_items to authenticated;
grant all on public.portfolio_items to service_role;
alter table public.portfolio_items enable row level security;
create policy "Anyone can view portfolios" on public.portfolio_items for select to anon, authenticated using (true);
create policy "Workers manage own portfolio" on public.portfolio_items for insert to authenticated
  with check (exists (select 1 from public.worker_profiles w where w.id = worker_id and w.user_id = auth.uid()));
create policy "Workers update own portfolio" on public.portfolio_items for update to authenticated
  using (exists (select 1 from public.worker_profiles w where w.id = worker_id and w.user_id = auth.uid()));
create policy "Workers delete own portfolio" on public.portfolio_items for delete to authenticated
  using (exists (select 1 from public.worker_profiles w where w.id = worker_id and w.user_id = auth.uid()));

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references public.worker_profiles(id) on delete cascade not null,
  reviewer_name text not null,
  rating integer not null default 5,
  comment text,
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon;
grant select, insert on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Anyone can read reviews" on public.reviews for select to anon, authenticated using (true);
create policy "Signed-in users can review" on public.reviews for insert to authenticated with check (true);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  worker_id uuid references public.worker_profiles(id) on delete cascade not null,
  customer_name text,
  description text not null,
  status text not null default 'pending',
  quoted_price numeric,
  scheduled_date date,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "Customers read own bookings" on public.bookings for select to authenticated using (auth.uid() = customer_id);
create policy "Workers read their bookings" on public.bookings for select to authenticated
  using (exists (select 1 from public.worker_profiles w where w.id = worker_id and w.user_id = auth.uid()));
create policy "Customers create bookings" on public.bookings for insert to authenticated with check (auth.uid() = customer_id);
create policy "Customers update own bookings" on public.bookings for update to authenticated using (auth.uid() = customer_id);
create policy "Workers update their bookings" on public.bookings for update to authenticated
  using (exists (select 1 from public.worker_profiles w where w.id = worker_id and w.user_id = auth.uid()));

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  trade text not null,
  description text,
  duration text,
  level text default 'Beginner'
);
grant select on public.courses to anon;
grant select on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;
create policy "Anyone can browse courses" on public.courses for select to anon, authenticated using (true);

-- Seed data: six tradespeople
insert into public.worker_profiles (id, display_name, trade, bio, city, hourly_rate, rating, jobs_done, verified, avatar_url) values
  ('11111111-1111-1111-1111-111111111111', 'Arun Kumar', 'Plumber', 'Fifteen years fixing leaks, fittings and full bathroom installations. Clean work, fair quotes.', 'Chennai', 450, 4.9, 212, true, '/images/workers/arun.jpg'),
  ('22222222-2222-2222-2222-222222222222', 'Meena Ravi', 'Electrician', 'Certified electrician for homes and small shops. Wiring, panels, fans, inverters and safety checks.', 'Chennai', 500, 4.8, 178, true, '/images/workers/meena.jpg'),
  ('33333333-3333-3333-3333-333333333333', 'Joseph D''Souza', 'Carpenter', 'Custom furniture, repairs and modular fittings. Teak and plywood specialist.', 'Coimbatore', 550, 4.7, 145, true, '/images/workers/joseph.jpg'),
  ('44444444-4444-4444-4444-444444444444', 'Priya Sharma', 'Painter', 'Interior and exterior painting, texture finishes and waterproofing. Neat edges, no mess left behind.', 'Chennai', 400, 4.8, 190, true, '/images/workers/priya.jpg'),
  ('55555555-5555-5555-5555-555555555555', 'Ravi Teja', 'AC Technician', 'AC install, service and gas refill for split and window units. Same-day visits across the city.', 'Madurai', 600, 4.6, 132, false, '/images/workers/ravi.jpg'),
  ('66666666-6666-6666-6666-666666666666', 'Lakshmi Narayanan', 'Mason', 'Brickwork, tiling, plastering and small renovations. Strong foundations, straight lines.', 'Chennai', 500, 4.9, 240, true, '/images/workers/lakshmi.jpg');

insert into public.portfolio_items (worker_id, title, description, image_url) values
  ('11111111-1111-1111-1111-111111111111', 'Full bathroom refit, Anna Nagar', 'Replaced all piping and fittings in a 3-bathroom flat in two days.', '/images/work/bathroom.jpg'),
  ('11111111-1111-1111-1111-111111111111', 'Kitchen sink and mixer install', 'New sink, mixer tap and under-sink filtration line.', '/images/work/kitchen.jpg'),
  ('22222222-2222-2222-2222-222222222222', 'Full house rewiring, Mylapore', 'Complete rewiring of a 40-year-old home with new MCB panel.', '/images/work/wiring.jpg'),
  ('33333333-3333-3333-3333-333333333333', 'Teak wardrobe, built to measure', 'Floor-to-ceiling wardrobe with soft-close fittings.', '/images/work/wardrobe.jpg'),
  ('44444444-4444-4444-4444-444444444444', 'Living room texture finish', 'Terracotta feature wall with washable emulsion throughout.', '/images/work/painting.jpg'),
  ('66666666-6666-6666-6666-666666666666', 'Courtyard tiling', 'Non-slip terracotta tiles for a 400 sq ft courtyard.', '/images/work/tiling.jpg');

insert into public.reviews (worker_id, reviewer_name, rating, comment) values
  ('11111111-1111-1111-1111-111111111111', 'Divya S.', 5, 'Fixed our geyser leak the same evening. Explained everything clearly.'),
  ('11111111-1111-1111-1111-111111111111', 'Karthik M.', 5, 'Very professional. Quote matched the final bill exactly.'),
  ('22222222-2222-2222-2222-222222222222', 'Anita R.', 5, 'Meena found a wiring fault two other electricians missed.'),
  ('33333333-3333-3333-3333-333333333333', 'Farhan A.', 4, 'Beautiful wardrobe work. Took a day longer than planned but worth it.'),
  ('44444444-4444-4444-4444-444444444444', 'Revathi P.', 5, 'Spotless work — covered every floor and cleaned up after.'),
  ('66666666-6666-6666-6666-666666666666', 'Suresh V.', 5, 'Our courtyard looks brand new. Highly recommend.');

insert into public.courses (title, trade, description, duration, level) values
  ('Home Plumbing Basics', 'Plumber', 'Fix taps, traps and minor leaks yourself. Includes a tools starter list.', '4 weeks', 'Beginner'),
  ('Electrical Safety & Wiring', 'Electrician', 'Household wiring standards, earthing and safe repair practices.', '6 weeks', 'Intermediate'),
  ('Carpentry: Joints & Finishing', 'Carpenter', 'Measure, cut and finish strong joints for furniture work.', '5 weeks', 'Beginner'),
  ('Professional Painting Techniques', 'Painter', 'Surface prep, primers, textures and clean finishing.', '3 weeks', 'Beginner');
