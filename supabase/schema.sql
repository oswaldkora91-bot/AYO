-- =====================================================================
-- AYO — Schéma de la base Supabase (copie de référence)
-- Ce fichier décrit la base telle qu'elle est en place sur le projet AYO.
-- Pour un NOUVEAU projet Supabase : collez-le dans « SQL Editor » puis « Run ».
-- =====================================================================

-- ---------- Entreprises : une ligne par compte entreprise ----------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  name text not null default '',
  state jsonb not null default '{}'::jsonb,         -- toutes les données du back-office (produits, stock, factures…)
  public_state jsonb not null default '{}'::jsonb,  -- ce que la boutique publique peut afficher
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.workspaces enable row level security;
create policy ws_select on public.workspaces for select to authenticated using (owner = (select auth.uid()));
create policy ws_insert on public.workspaces for insert to authenticated with check (owner = (select auth.uid()));
create policy ws_update on public.workspaces for update to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy ws_delete on public.workspaces for delete to authenticated using (owner = (select auth.uid()));

-- ---------- Commandes passées sur la boutique ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  ref text not null check (char_length(ref) between 3 and 40),
  payload jsonb not null,
  status text not null default 'En attente' check (status in ('En attente','En préparation','Prête','Livrée')),
  created_at timestamptz not null default now(),
  unique (workspace_id, ref)
);
create index if not exists orders_ws_idx on public.orders (workspace_id, created_at desc);
alter table public.orders enable row level security;
create policy orders_select on public.orders for select to authenticated using (exists (select 1 from public.workspaces w where w.id = orders.workspace_id and w.owner = (select auth.uid())));
create policy orders_update on public.orders for update to authenticated using (exists (select 1 from public.workspaces w where w.id = orders.workspace_id and w.owner = (select auth.uid()))) with check (exists (select 1 from public.workspaces w where w.id = orders.workspace_id and w.owner = (select auth.uid())));

-- ---------- Réservations, avis, messages, fichier clients ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  ref text not null check (char_length(ref) between 3 and 40),
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (char_length(phone) between 6 and 40),
  day text not null check (char_length(day) between 1 and 40),
  slot text not null default '' check (char_length(slot) <= 40),
  guests int not null default 1 check (guests between 1 and 2000),
  event_type text not null default '' check (char_length(event_type) <= 120),
  estimate_fcfa bigint not null default 0 check (estimate_fcfa between 0 and 100000000),
  status text not null default 'Confirmé' check (status in ('Confirmé','En cours','Terminé','Annulé')),
  created_at timestamptz not null default now(),
  unique (workspace_id, ref)
);
create index if not exists bookings_ws_idx on public.bookings (workspace_id, created_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author text not null check (char_length(author) between 1 and 80),
  stars smallint not null check (stars between 1 and 5),
  item text not null default '' check (char_length(item) <= 120),
  comment text not null check (char_length(comment) between 1 and 1000),
  status text not null default 'publié' check (status in ('publié','masqué')),
  created_at timestamptz not null default now()
);
create index if not exists reviews_ws_idx on public.reviews (workspace_id, created_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  ref text not null check (char_length(ref) between 3 and 40),
  name text not null check (char_length(name) between 1 and 120),
  email text not null default '' check (char_length(email) <= 160),
  topic text not null default '' check (char_length(topic) <= 80),
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'Nouveau' check (status in ('Nouveau','En cours','Traité')),
  created_at timestamptz not null default now(),
  unique (workspace_id, ref)
);
create index if not exists messages_ws_idx on public.messages (workspace_id, created_at desc);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact text not null check (char_length(contact) between 3 and 160),
  name text not null default '' check (char_length(name) <= 120),
  orders_count int not null default 0,
  bookings_count int not null default 0,
  messages_count int not null default 0,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (workspace_id, contact)
);
create index if not exists customers_ws_idx on public.customers (workspace_id, last_seen_at desc);

-- Lecture / modification réservées au propriétaire ; les visiteurs n'ajoutent que via les fonctions plus bas
do $$
declare t text;
begin
  foreach t in array array['bookings','reviews','messages','customers'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy %I on public.%I for select to authenticated using (exists (select 1 from public.workspaces w where w.id = %I.workspace_id and w.owner = (select auth.uid())))$p$, t||'_select', t, t);
    execute format($p$create policy %I on public.%I for update to authenticated using (exists (select 1 from public.workspaces w where w.id = %I.workspace_id and w.owner = (select auth.uid()))) with check (exists (select 1 from public.workspaces w where w.id = %I.workspace_id and w.owner = (select auth.uid())))$p$, t||'_update', t, t, t);
    execute format($p$create policy %I on public.%I for delete to authenticated using (exists (select 1 from public.workspaces w where w.id = %I.workspace_id and w.owner = (select auth.uid())))$p$, t||'_delete', t, t);
  end loop;
end $$;

-- ---------- Fonctions internes ----------
create or replace function public._touch_customer(p_ws uuid, p_contact text, p_name text, p_kind text)
returns void language plpgsql security definer set search_path = '' as $$
declare c text := lower(btrim(coalesce(p_contact, '')));
begin
  if char_length(c) < 3 then return; end if;
  insert into public.customers (workspace_id, contact, name, orders_count, bookings_count, messages_count)
  values (p_ws, left(c, 160), left(coalesce(p_name, ''), 120), (p_kind = 'order')::int, (p_kind = 'booking')::int, (p_kind = 'message')::int)
  on conflict (workspace_id, contact) do update set
    name = case when excluded.name <> '' then excluded.name else public.customers.name end,
    orders_count = public.customers.orders_count + (p_kind = 'order')::int,
    bookings_count = public.customers.bookings_count + (p_kind = 'booking')::int,
    messages_count = public.customers.messages_count + (p_kind = 'message')::int,
    last_seen_at = now();
end $$;
revoke all on function public._touch_customer(uuid, text, text, text) from public, anon, authenticated;

-- Garde-fou : 40 envois par boutique et par type toutes les 10 minutes
create or replace function public._rate_ok(p_ws uuid, p_kind text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if p_kind = 'order' then select count(*) into n from public.orders where workspace_id = p_ws and created_at > now() - interval '10 minutes';
  elsif p_kind = 'booking' then select count(*) into n from public.bookings where workspace_id = p_ws and created_at > now() - interval '10 minutes';
  elsif p_kind = 'review' then select count(*) into n from public.reviews where workspace_id = p_ws and created_at > now() - interval '10 minutes';
  else select count(*) into n from public.messages where workspace_id = p_ws and created_at > now() - interval '10 minutes';
  end if;
  return n < 40;
end $$;
revoke all on function public._rate_ok(uuid, text) from public, anon, authenticated;

-- ---------- Fonctions appelées par la boutique publique ----------
create or replace function public.get_shop(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('slug', w.slug, 'name', w.name, 'public', w.public_state,
    'reviews', coalesce((select jsonb_agg(jsonb_build_object('cid', r.id, 'author', r.author, 'stars', r.stars, 'item', r.item, 'comment', r.comment) order by r.created_at desc)
                         from (select * from public.reviews where workspace_id = w.id and status = 'publié' order by created_at desc limit 60) r), '[]'::jsonb))
  from public.workspaces w where w.slug = lower(p_slug) limit 1;
$$;

create or replace function public.place_order(p_slug text, p_order jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare v_ws uuid; v_ref text; v_amount numeric; v_client text;
begin
  if p_order is null or jsonb_typeof(p_order) <> 'object' or pg_column_size(p_order) > 20000 then raise exception 'commande invalide'; end if;
  v_ref := p_order->>'ref';
  if v_ref is null or char_length(v_ref) not between 3 and 40 then raise exception 'référence invalide'; end if;
  v_amount := nullif(p_order->>'amountFcfa', '')::numeric;
  if v_amount is null or v_amount <= 0 or v_amount > 50000000 then raise exception 'montant invalide'; end if;
  if jsonb_typeof(p_order->'items') = 'array' and jsonb_array_length(p_order->'items') > 60 then raise exception 'trop d''articles'; end if;
  select id into v_ws from public.workspaces where slug = lower(p_slug);
  if v_ws is null then raise exception 'boutique introuvable'; end if;
  if not public._rate_ok(v_ws, 'order') then raise exception 'trop de commandes, réessayez dans quelques minutes'; end if;
  insert into public.orders (workspace_id, ref, payload) values (v_ws, v_ref, p_order) on conflict (workspace_id, ref) do nothing;
  v_client := coalesce(p_order->>'client', '');
  perform public._touch_customer(v_ws, coalesce(nullif(substring(v_client from '\(([^)]+)\)'), ''), v_client), btrim(split_part(v_client, '(', 1)), 'order');
  return v_ref;
end $$;

create or replace function public.book_slot(p_slug text, p_booking jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare v_ws uuid; v_ref text := p_booking->>'ref';
begin
  if p_booking is null or jsonb_typeof(p_booking) <> 'object' or pg_column_size(p_booking) > 4000 then raise exception 'réservation invalide'; end if;
  select id into v_ws from public.workspaces where slug = lower(p_slug);
  if v_ws is null then raise exception 'boutique introuvable'; end if;
  if not public._rate_ok(v_ws, 'booking') then raise exception 'trop de réservations, réessayez dans quelques minutes'; end if;
  insert into public.bookings (workspace_id, ref, name, phone, day, slot, guests, event_type, estimate_fcfa)
  values (v_ws, v_ref, btrim(p_booking->>'name'), btrim(p_booking->>'phone'), coalesce(p_booking->>'day', ''), coalesce(p_booking->>'slot', ''),
          greatest(1, coalesce((p_booking->>'guests')::int, 1)), coalesce(p_booking->>'eventType', ''), greatest(0, coalesce((p_booking->>'estimateFcfa')::bigint, 0)))
  on conflict (workspace_id, ref) do nothing;
  perform public._touch_customer(v_ws, p_booking->>'phone', p_booking->>'name', 'booking');
  return v_ref;
end $$;

create or replace function public.post_review(p_slug text, p_review jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_ws uuid; v_id uuid;
begin
  if p_review is null or jsonb_typeof(p_review) <> 'object' or pg_column_size(p_review) > 3000 then raise exception 'avis invalide'; end if;
  select id into v_ws from public.workspaces where slug = lower(p_slug);
  if v_ws is null then raise exception 'boutique introuvable'; end if;
  if not public._rate_ok(v_ws, 'review') then raise exception 'trop d''avis, réessayez dans quelques minutes'; end if;
  insert into public.reviews (workspace_id, author, stars, item, comment)
  values (v_ws, btrim(p_review->>'author'), least(5, greatest(1, coalesce((p_review->>'stars')::int, 5))), coalesce(btrim(p_review->>'item'), ''), btrim(p_review->>'comment'))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.send_message(p_slug text, p_message jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare v_ws uuid; v_ref text := p_message->>'ref';
begin
  if p_message is null or jsonb_typeof(p_message) <> 'object' or pg_column_size(p_message) > 5000 then raise exception 'message invalide'; end if;
  select id into v_ws from public.workspaces where slug = lower(p_slug);
  if v_ws is null then raise exception 'boutique introuvable'; end if;
  if not public._rate_ok(v_ws, 'message') then raise exception 'trop de messages, réessayez dans quelques minutes'; end if;
  insert into public.messages (workspace_id, ref, name, email, topic, body)
  values (v_ws, v_ref, btrim(p_message->>'name'), coalesce(btrim(p_message->>'email'), ''), coalesce(p_message->>'topic', ''), btrim(p_message->>'body'))
  on conflict (workspace_id, ref) do nothing;
  perform public._touch_customer(v_ws, p_message->>'email', p_message->>'name', 'message');
  return v_ref;
end $$;

grant execute on function public.get_shop(text), public.place_order(text, jsonb), public.book_slot(text, jsonb),
  public.post_review(text, jsonb), public.send_message(text, jsonb) to anon, authenticated;
