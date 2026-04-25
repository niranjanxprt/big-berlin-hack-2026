create table if not exists public.canvas_state (
  id text primary key,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_canvas_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists canvas_state_set_updated_at on public.canvas_state;

create trigger canvas_state_set_updated_at
before update on public.canvas_state
for each row
execute function public.set_canvas_state_updated_at();

insert into public.canvas_state (id, nodes, edges)
values ('main', '[]'::jsonb, '[]'::jsonb)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('canvas-assets', 'canvas-assets', true)
on conflict (id) do nothing;
