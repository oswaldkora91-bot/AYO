-- =====================================================================
-- AYO · Paiement en ligne réel (FedaPay) — à exécuter après schema.sql
-- La clé secrète de chaque commerçant n'est lisible que par la fonction serveur « paiement »
-- (supabase/functions/paiement) : aucune politique RLS, aucun droit pour anon / authenticated.
-- =====================================================================
create table if not exists public.payment_accounts (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  provider text not null default 'fedapay' check (provider in ('fedapay')),
  env text not null check (env in ('sandbox','live')),
  secret_key text not null,
  key_hint text not null default '',
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.payment_accounts enable row level security;
revoke all on public.payment_accounts from anon, authenticated;

alter table public.orders add column if not exists pay_provider text;
alter table public.orders add column if not exists pay_status text check (pay_status in ('en attente','payé','refusé','annulé'));
alter table public.orders add column if not exists pay_ref text;
alter table public.orders add column if not exists pay_amount numeric;
alter table public.orders add column if not exists paid_at timestamptz;

create or replace function public.set_payment_key(p_key text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_ws uuid; k text := btrim(coalesce(p_key, '')); v_env text;
begin
  select id into v_ws from public.workspaces where owner = (select auth.uid());
  if v_ws is null then raise exception 'créez d''abord votre espace entreprise'; end if;
  if k = '' then delete from public.payment_accounts where workspace_id = v_ws; return jsonb_build_object('active', false); end if;
  if k ~ '^sk_sandbox_[A-Za-z0-9_-]{8,}$' then v_env := 'sandbox';
  elsif k ~ '^sk_live_[A-Za-z0-9_-]{8,}$' then v_env := 'live';
  else raise exception 'clé invalide : collez la clé secrète FedaPay (elle commence par sk_live_ ou sk_sandbox_)'; end if;
  insert into public.payment_accounts (workspace_id, env, secret_key, key_hint, verified_at, updated_at)
  values (v_ws, v_env, k, right(k, 4), null, now())
  on conflict (workspace_id) do update set env = excluded.env, secret_key = excluded.secret_key, key_hint = excluded.key_hint, verified_at = null, updated_at = now();
  return jsonb_build_object('active', true, 'provider', 'fedapay', 'env', v_env, 'hint', right(k, 4));
end $$;

create or replace function public.get_payment_status()
returns jsonb language sql stable security definer set search_path to '' as $$
  select coalesce((select jsonb_build_object('active', true, 'provider', p.provider, 'env', p.env, 'hint', p.key_hint, 'verified_at', p.verified_at, 'updated_at', p.updated_at)
    from public.payment_accounts p join public.workspaces w on w.id = p.workspace_id where w.owner = (select auth.uid())), jsonb_build_object('active', false));
$$;
revoke all on function public.set_payment_key(text), public.get_payment_status() from public, anon;
grant execute on function public.set_payment_key(text), public.get_payment_status() to authenticated;

CREATE OR REPLACE FUNCTION public.get_shop(p_slug text)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select jsonb_build_object('slug', w.slug, 'name', w.name, 'public', w.public_state,
    'reviews', coalesce((select jsonb_agg(jsonb_build_object('cid', r.id, 'author', r.author, 'stars', r.stars, 'item', r.item, 'comment', r.comment) order by r.created_at desc)
                         from (select * from public.reviews where workspace_id = w.id and status = 'publié' order by created_at desc limit 60) r), '[]'::jsonb),
    'pay', (select jsonb_build_object('provider', p.provider, 'env', p.env) from public.payment_accounts p where p.workspace_id = w.id))
  from public.workspaces w where w.slug = lower(p_slug) limit 1;
$function$;
