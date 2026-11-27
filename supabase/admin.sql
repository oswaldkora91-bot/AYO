-- =====================================================================
-- AYO · Espace administrateur (page admin.html)
-- À exécuter APRÈS schema.sql, dans Supabase > SQL Editor.
-- Les tables ne sont lisibles que par les fonctions ci-dessous
-- (RLS activé sans politique) ; chaque fonction vérifie que l'appelant
-- est dans platform_admins.
-- =====================================================================

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.admin_followups (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  status text not null default 'Nouveau' check (status in ('Nouveau','Actif','À relancer','En pause')),
  note text not null default '' check (char_length(note) <= 4000),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create table if not exists public.admin_actions (
  id bigint generated always as identity primary key,
  admin_id uuid, admin_email text not null default '',
  workspace_id uuid, user_id uuid, company text not null default '',
  action text not null check (action in ('modification','suppression','suivi','export')),
  reason text not null default '', details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_actions_user_idx on public.admin_actions (user_id, created_at desc);
create index if not exists admin_actions_created_idx on public.admin_actions (created_at desc);
create table if not exists public.deleted_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, workspace_id uuid, email text not null default '', company text not null default '',
  slug text not null default '', reason text not null default '', snapshot jsonb not null default '{}'::jsonb,
  deleted_by uuid, deleted_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
alter table public.admin_followups enable row level security;
alter table public.admin_actions enable row level security;
alter table public.deleted_accounts enable row level security;

-- Modifications faites par l'équipe AYO : l'application de l'entreprise les relit et les applique
alter table public.workspaces add column if not exists admin_rev int not null default 0;
alter table public.workspaces add column if not exists admin_patch jsonb not null default '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$function$;

CREATE OR REPLACE FUNCTION public._admin_guard()
 RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'accès réservé aux administrateurs AYO' using errcode = '42501'; end if;
  return (select auth.uid());
end $function$;

CREATE OR REPLACE FUNCTION public._admin_log(p_ws uuid, p_user uuid, p_company text, p_action text, p_reason text, p_details jsonb)
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO ''
AS $function$
  insert into public.admin_actions (admin_id, admin_email, workspace_id, user_id, company, action, reason, details)
  values ((select auth.uid()), coalesce((select email from auth.users where id = (select auth.uid())), ''), p_ws, p_user, coalesce(p_company, ''), p_action, coalesce(p_reason, ''), coalesce(p_details, '{}'::jsonb));
$function$;

-- À lancer une fois dans le SQL Editor : select public.make_platform_admin('votre@email');
CREATE OR REPLACE FUNCTION public.make_platform_admin(p_email text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then raise exception 'aucun compte avec cet e-mail : créez d''abord le compte sur le site'; end if;
  insert into public.platform_admins (user_id) values (uid) on conflict do nothing;
  return 'administrateur ajouté : ' || p_email;
end $function$;

CREATE OR REPLACE FUNCTION public.admin_overview()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  perform public._admin_guard();
  return jsonb_build_object(
    'accounts', (select count(*) from auth.users u where not exists (select 1 from public.platform_admins a where a.user_id = u.id)),
    'companies', (select count(*) from public.workspaces),
    'incomplete', (select count(*) from auth.users u where not exists (select 1 from public.workspaces w where w.owner = u.id) and not exists (select 1 from public.platform_admins a where a.user_id = u.id)),
    'active7', (select count(*) from public.workspaces where updated_at > now() - interval '7 days'),
    'orders', (select count(*) from public.orders),
    'revenue', (select coalesce(sum(nullif(payload->>'amountFcfa','')::numeric), 0) from public.orders),
    'bookings', (select count(*) from public.bookings),
    'messages_new', (select count(*) from public.messages where status = 'Nouveau'),
    'to_follow', (select count(*) from public.admin_followups where status = 'À relancer'),
    'deleted', (select count(*) from public.deleted_accounts)
  );
end $function$;

CREATE OR REPLACE FUNCTION public.admin_list(p_search text DEFAULT ''::text)
 RETURNS TABLE(user_id uuid, email text, email_confirmed boolean, signed_up timestamp with time zone, last_sign_in timestamp with time zone, workspace_id uuid, slug text, company text, city text, specialty text, format integer, products integer, orders bigint, revenue numeric, bookings bigint, messages_new bigint, customers bigint, updated_at timestamp with time zone, status text, note text, last_action_at timestamp with time zone)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
declare q text := '%' || lower(btrim(coalesce(p_search, ''))) || '%';
begin
  perform public._admin_guard();
  return query
  select u.id, u.email::text, u.email_confirmed_at is not null, u.created_at, u.last_sign_in_at,
         w.id, w.slug, coalesce(nullif(w.name, ''), w.state->'tenant'->>'name', ''), coalesce(w.state->'tenant'->>'city', ''), coalesce(w.state->'tenant'->>'specialty', ''),
         nullif(w.state->>'activeFormat', '')::int,
         coalesce(jsonb_array_length(case when jsonb_typeof(w.state->'customProducts') = 'array' then w.state->'customProducts' end), 0),
         (select count(*) from public.orders o where o.workspace_id = w.id),
         (select coalesce(sum(nullif(o.payload->>'amountFcfa','')::numeric), 0) from public.orders o where o.workspace_id = w.id),
         (select count(*) from public.bookings b where b.workspace_id = w.id),
         (select count(*) from public.messages m where m.workspace_id = w.id and m.status = 'Nouveau'),
         (select count(*) from public.customers c where c.workspace_id = w.id),
         w.updated_at, coalesce(f.status, case when w.id is null then 'Inscription incomplète' else 'Nouveau' end), coalesce(f.note, ''),
         (select max(a.created_at) from public.admin_actions a where a.user_id = u.id)
  from auth.users u
  left join public.workspaces w on w.owner = u.id
  left join public.admin_followups f on f.workspace_id = w.id
  where not exists (select 1 from public.platform_admins pa where pa.user_id = u.id)
    and (q = '%%' or lower(coalesce(w.name, '')) like q or lower(coalesce(w.slug, '')) like q or lower(u.email) like q
         or lower(coalesce(w.state->'tenant'->>'city', '')) like q or lower(coalesce(w.state->'tenant'->>'specialty', '')) like q)
  order by coalesce(w.updated_at, u.created_at) desc
  limit 500;
end $function$;

CREATE OR REPLACE FUNCTION public.admin_get(p_user uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
declare w public.workspaces; u auth.users;
begin
  perform public._admin_guard();
  select * into u from auth.users where id = p_user;
  if u.id is null then raise exception 'compte introuvable'; end if;
  select * into w from public.workspaces where owner = p_user;
  return jsonb_build_object(
    'account', jsonb_build_object('user_id', u.id, 'email', u.email, 'email_confirmed', u.email_confirmed_at is not null, 'signed_up', u.created_at, 'last_sign_in', u.last_sign_in_at, 'meta', u.raw_user_meta_data),
    'workspace', case when w.id is null then null else jsonb_build_object('id', w.id, 'slug', w.slug, 'name', w.name, 'state', w.state, 'created_at', w.created_at, 'updated_at', w.updated_at, 'admin_rev', w.admin_rev) end,
    'orders', coalesce((select jsonb_agg(to_jsonb(o) - 'workspace_id' order by o.created_at desc) from (select * from public.orders where workspace_id = w.id order by created_at desc limit 300) o), '[]'::jsonb),
    'bookings', coalesce((select jsonb_agg(to_jsonb(b) - 'workspace_id' order by b.created_at desc) from (select * from public.bookings where workspace_id = w.id order by created_at desc limit 300) b), '[]'::jsonb),
    'messages', coalesce((select jsonb_agg(to_jsonb(m) - 'workspace_id' order by m.created_at desc) from (select * from public.messages where workspace_id = w.id order by created_at desc limit 300) m), '[]'::jsonb),
    'reviews', coalesce((select jsonb_agg(to_jsonb(r) - 'workspace_id' order by r.created_at desc) from (select * from public.reviews where workspace_id = w.id order by created_at desc limit 300) r), '[]'::jsonb),
    'customers', coalesce((select jsonb_agg(to_jsonb(c) - 'workspace_id' order by c.last_seen_at desc) from (select * from public.customers where workspace_id = w.id order by last_seen_at desc limit 500) c), '[]'::jsonb),
    'followup', (select to_jsonb(f) from public.admin_followups f where f.workspace_id = w.id),
    'actions', coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from (select * from public.admin_actions where user_id = p_user order by created_at desc limit 100) a), '[]'::jsonb)
  );
end $function$;

CREATE OR REPLACE FUNCTION public.admin_update(p_user uuid, p_patch jsonb, p_reason text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare w public.workspaces; k text; v text; changed jsonb := '{}'::jsonb; old_v text;
        allowed text[] := array['name','city','specialty','ifu','rccm','address','phone','whatsapp','email'];
        path text[];
begin
  perform public._admin_guard();
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'indiquez la demande de l''entreprise (5 caractères au moins)'; end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then raise exception 'modification invalide'; end if;
  select * into w from public.workspaces where owner = p_user for update;
  if w.id is null then raise exception 'cette entreprise n''a pas encore créé son espace'; end if;
  for k, v in select key, value #>> '{}' from jsonb_each(p_patch) loop
    if not (k = any(allowed)) then raise exception 'champ non modifiable : %', k; end if;
    v := btrim(coalesce(v, ''));
    if char_length(v) > 200 then raise exception 'valeur trop longue pour %', k; end if;
    if k = 'ifu' and v <> '' and v !~ '^\d{13}$' then raise exception 'l''IFU doit comporter 13 chiffres'; end if;
    if k = 'email' and v <> '' and v !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'e-mail invalide'; end if;
    if k = 'name' and v = '' then raise exception 'le nom de l''entreprise ne peut pas être vide'; end if;
    path := case k when 'name' then array['tenant','name'] when 'city' then array['tenant','city'] when 'specialty' then array['tenant','specialty']
                   when 'ifu' then array['billing','ifu'] when 'rccm' then array['billing','rccm'] when 'address' then array['billing','address']
                   else array['company', k] end;
    old_v := coalesce(w.state #>> path, '');
    if old_v is distinct from v then
      changed := changed || jsonb_build_object(k, jsonb_build_object('avant', old_v, 'après', v));
      if w.state -> path[1] is null or jsonb_typeof(w.state -> path[1]) <> 'object' then w.state := jsonb_set(w.state, array[path[1]], '{}'::jsonb, true); end if;
      w.state := jsonb_set(w.state, path, to_jsonb(v), true);
      if path[1] in ('tenant','company') then
        if w.public_state -> path[1] is null or jsonb_typeof(w.public_state -> path[1]) <> 'object' then w.public_state := jsonb_set(w.public_state, array[path[1]], '{}'::jsonb, true); end if;
        w.public_state := jsonb_set(w.public_state, path, to_jsonb(v), true);
      end if;
      w.admin_patch := jsonb_set(coalesce(w.admin_patch, '{}'::jsonb), array[k], jsonb_build_object('v', v, 'rev', w.admin_rev + 1), true);
    end if;
  end loop;
  if changed = '{}'::jsonb then return jsonb_build_object('changed', false); end if;
  update public.workspaces set state = w.state, public_state = w.public_state, admin_patch = w.admin_patch, admin_rev = w.admin_rev + 1,
         name = coalesce(w.state->'tenant'->>'name', w.name), updated_at = now()
   where id = w.id;
  perform public._admin_log(w.id, p_user, coalesce(w.state->'tenant'->>'name', w.name), 'modification', p_reason, changed);
  return jsonb_build_object('changed', true, 'fields', changed);
end $function$;

CREATE OR REPLACE FUNCTION public.admin_set_followup(p_user uuid, p_status text, p_note text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare w public.workspaces;
begin
  perform public._admin_guard();
  select * into w from public.workspaces where owner = p_user;
  if w.id is null then raise exception 'cette entreprise n''a pas encore créé son espace'; end if;
  insert into public.admin_followups (workspace_id, status, note, updated_at, updated_by)
  values (w.id, p_status, coalesce(p_note, ''), now(), (select auth.uid()))
  on conflict (workspace_id) do update set status = excluded.status, note = excluded.note, updated_at = now(), updated_by = excluded.updated_by;
  perform public._admin_log(w.id, p_user, w.name, 'suivi', '', jsonb_build_object('statut', p_status, 'note', left(coalesce(p_note, ''), 300)));
end $function$;

CREATE OR REPLACE FUNCTION public.admin_log_export(p_user uuid, p_what text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare w public.workspaces;
begin
  perform public._admin_guard();
  select * into w from public.workspaces where owner = p_user;
  perform public._admin_log(w.id, p_user, coalesce(w.name, ''), 'export', '', jsonb_build_object('contenu', left(coalesce(p_what, ''), 80)));
end $function$;

CREATE OR REPLACE FUNCTION public.admin_delete_account(p_user uuid, p_reason text, p_confirm text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare u auth.users; w public.workspaces; snap jsonb;
begin
  perform public._admin_guard();
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'indiquez la demande de l''entreprise (5 caractères au moins)'; end if;
  if exists (select 1 from public.platform_admins where user_id = p_user) then raise exception 'un compte administrateur ne peut pas être supprimé ici'; end if;
  select * into u from auth.users where id = p_user;
  if u.id is null then raise exception 'compte introuvable'; end if;
  select * into w from public.workspaces where owner = p_user;
  if lower(btrim(coalesce(p_confirm, ''))) not in (lower(coalesce(w.name, '')), lower(u.email)) or btrim(coalesce(p_confirm, '')) = '' then
    raise exception 'confirmation incorrecte : recopiez le nom de l''entreprise ou l''e-mail du compte';
  end if;
  snap := public.admin_get(p_user);
  insert into public.deleted_accounts (user_id, workspace_id, email, company, slug, reason, snapshot, deleted_by)
  values (u.id, w.id, u.email, coalesce(w.name, ''), coalesce(w.slug, ''), p_reason, snap, (select auth.uid()));
  perform public._admin_log(w.id, p_user, coalesce(w.name, u.email), 'suppression', p_reason, jsonb_build_object('email', u.email, 'boutique', w.slug));
  delete from auth.users where id = p_user; -- supprime aussi l'entreprise, ses commandes, réservations, avis, messages et clients
end $function$;

CREATE OR REPLACE FUNCTION public.admin_journal(p_limit integer DEFAULT 200)
 RETURNS SETOF public.admin_actions LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  perform public._admin_guard();
  return query select * from public.admin_actions order by created_at desc limit least(greatest(p_limit, 1), 1000);
end $function$;

CREATE OR REPLACE FUNCTION public.admin_deleted_list()
 RETURNS TABLE(id uuid, email text, company text, slug text, reason text, deleted_at timestamp with time zone, deleted_by_email text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
#variable_conflict use_column
begin
  perform public._admin_guard();
  return query select d.id, d.email, d.company, d.slug, d.reason, d.deleted_at, coalesce((select au.email::text from auth.users au where au.id = d.deleted_by), '')
               from public.deleted_accounts d order by d.deleted_at desc limit 500;
end $function$;

CREATE OR REPLACE FUNCTION public.admin_deleted_get(p_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  perform public._admin_guard();
  return (select to_jsonb(d) from public.deleted_accounts d where d.id = p_id);
end $function$;

-- Droits : seules les fonctions publiques d'administration sont appelables (elles vérifient le rôle)
revoke all on function public._admin_guard(), public._admin_log(uuid, uuid, text, text, text, jsonb), public.make_platform_admin(text) from public, anon, authenticated;
revoke all on function public.is_platform_admin(), public.admin_overview(), public.admin_list(text), public.admin_get(uuid), public.admin_update(uuid, jsonb, text),
  public.admin_set_followup(uuid, text, text), public.admin_log_export(uuid, text), public.admin_delete_account(uuid, text, text),
  public.admin_journal(integer), public.admin_deleted_list(), public.admin_deleted_get(uuid) from public, anon;
grant execute on function public.is_platform_admin(), public.admin_overview(), public.admin_list(text), public.admin_get(uuid), public.admin_update(uuid, jsonb, text),
  public.admin_set_followup(uuid, text, text), public.admin_log_export(uuid, text), public.admin_delete_account(uuid, text, text),
  public.admin_journal(integer), public.admin_deleted_list(), public.admin_deleted_get(uuid) to authenticated;
