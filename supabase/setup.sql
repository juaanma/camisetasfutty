-- =====================================================================
-- Camisetas Futty — preparación de Supabase
-- Pegá TODO este archivo en Supabase > SQL Editor > New query > Run.
-- Se puede correr más de una vez sin romper nada.
-- =====================================================================

-- 1) Tablas -----------------------------------------------------------

-- Ajustes generales de la tienda (una sola fila)
create table if not exists public.ajustes (
  id          int primary key default 1 check (id = 1),
  wa          text    not null default '',
  ig          text    not null default '',
  pay         text    not null default '',
  show_prices boolean not null default true,
  show_sold   boolean not null default true,
  sections    text[]  not null default '{}'
);

-- Camisetas
create table if not exists public.items (
  id         text primary key,
  name       text not null,
  sub        text not null default '',
  section    text not null,
  size       text not null default '',
  units      int  not null default 1,
  price      int,
  code       text not null default '',
  status     text not null default 'disponible',
  is_new     boolean not null default false,
  img        text not null default '',
  position   double precision not null default 0,
  created_at timestamptz not null default now()
);

-- Fotos extra de cada camiseta (espalda y detalles) para la vista 3D
alter table public.items add column if not exists imgs text[] not null default '{}';

-- Estados permitidos ("encargo" = A pedido, se muestra en "Pedidos a encargo")
alter table public.items drop constraint if exists items_status_check;
alter table public.items add constraint items_status_check check (status in ('disponible','reservada','vendida','encargo'));

-- Quiénes pueden editar (correos de los dueños)
create table if not exists public.admins (
  email text primary key
);

-- ¿El usuario que entró es dueño?
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;
grant execute on function public.es_admin() to anon, authenticated;

-- 2) Permisos: todos leen, solo los dueños editan ----------------------

alter table public.ajustes enable row level security;
alter table public.items   enable row level security;
alter table public.admins  enable row level security;

drop policy if exists "todos leen ajustes" on public.ajustes;
drop policy if exists "dueño edita ajustes" on public.ajustes;
create policy "todos leen ajustes"  on public.ajustes for select using (true);
create policy "dueño edita ajustes" on public.ajustes for all to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "todos leen items" on public.items;
drop policy if exists "dueño edita items" on public.items;
create policy "todos leen items"  on public.items for select using (true);
create policy "dueño edita items" on public.items for all to authenticated using (public.es_admin()) with check (public.es_admin());
-- La tabla admins no tiene políticas: nadie la lee ni la cambia desde la web.

-- 3) Lugar para las fotos ---------------------------------------------

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "todos ven fotos"   on storage.objects;
drop policy if exists "dueño sube fotos"  on storage.objects;
drop policy if exists "dueño borra fotos" on storage.objects;
create policy "todos ven fotos"   on storage.objects for select using (bucket_id = 'fotos');
create policy "dueño sube fotos"  on storage.objects for insert to authenticated with check (bucket_id = 'fotos' and public.es_admin());
create policy "dueño borra fotos" on storage.objects for delete to authenticated using (bucket_id = 'fotos' and public.es_admin());

-- 4) Catálogo inicial (las 20 camisetas de la página anterior) --------

insert into public.ajustes (id, wa, ig, pay, show_prices, show_sold, sections)
values (1, '5493413052001', 'https://www.instagram.com/camisetas_futty/', 'Efectivo o transferencia', true, true, array['Retro','Lifestyle','Actuales'])
on conflict (id) do nothing;

insert into public.items (id,name,sub,section,size,units,price,code,status,is_new,img,position) values
('i1','Alemania','Home 1990 · Versión jugador','Retro','L / XL',1,49900,'0230','disponible',false,'img/fotos/i1.jpg',0),
('i2','Arsenal','Home 2005/06 · Henry 14','Retro','L / XL',1,63000,'0263','disponible',false,'img/fotos/i2.jpg',1),
('i3','Barcelona','Home 2014/15 · Neymar · Final de Berlín','Retro','L / XL',2,64900,'0267 / 0275','disponible',false,'img/fotos/i3.jpg',2),
('i4','Uruguay','Local 2025/26','Actuales','L / XL',1,49900,'0268','disponible',false,'img/fotos/i4.jpg',3),
('i12','Newcastle United','Away 1995/96','Retro','L / XL',1,64000,'0319','disponible',false,'img/fotos/i12.jpg',4),
('i5','Arsenal','Adidas Style · Bordó','Lifestyle','L / XL',1,58900,'0282','disponible',false,'img/fotos/i5.jpg',5),
('i6','Argentina','Adidas Originals · Celeste y blanca','Lifestyle','L / XL / XXL',1,59900,'0299','disponible',false,'img/fotos/i6.jpg',6),
('i7','Adidas Originals','Blanca y bordó','Lifestyle','L / XL',1,59900,'0307','disponible',false,'img/fotos/i7.jpg',7),
('i8','Adidas Rose Blue','Azul · 03','Lifestyle','L / XL',1,54900,'0309','disponible',false,'img/fotos/i8.jpg',8),
('i9','Adidas Originals','Blanca','Lifestyle','L / XL',1,54900,'0310','disponible',false,'img/fotos/i9.jpg',9),
('i10','Adidas Originals','Azul marino','Lifestyle','L / XL',1,59900,'0314','disponible',false,'img/fotos/i10.jpg',10),
('i11','Adidas Originals','Negra','Lifestyle','L / XL',1,58000,'0315','disponible',false,'img/fotos/i11.jpg',11),
('i1793241650759','Barcelona','Third 2021/22 · Coutinho 14','Actuales','L / XL',1,52500,'0114','disponible',false,'img/fotos/i1793241650759.jpg',12),
('n1','Adidas Originals','Seoul · Azul marino','Lifestyle','M / L / XL',1,null,'','disponible',true,'img/fotos/n1.jpg',13),
('n2','Adidas Originals','Blanca y negra','Lifestyle','M / L / XL',1,null,'','disponible',true,'img/fotos/n2.jpg',14),
('n3','Newcastle United','Adidas Originals','Lifestyle','M / L / XL',1,null,'','disponible',true,'img/fotos/n3.jpg',15),
('n4','Barcelona','Nike · Bordó y azul','Lifestyle','M / L / XL',1,null,'','disponible',true,'img/fotos/n4.jpg',16),
('n5','West Ham United','Iron Maiden · Brave New World','Lifestyle','M / L / XL',1,null,'','disponible',true,'img/fotos/n5.jpg',17),
('n6','Liverpool','Away 1995/96 · Carlsberg','Retro','M / L / XL',1,null,'','disponible',true,'img/fotos/n6.jpg',18),
('n7','Liverpool','Away 1993/95 · Carlsberg','Retro','M / L / XL',1,null,'','disponible',true,'img/fotos/n7.jpg',19)
on conflict (id) do nothing;

-- 5) EL DUEÑO ---------------------------------------------------------
-- Cambiá el correo de abajo por el del dueño (el mismo que vas a crear
-- en Authentication > Users) y volvé a correr SOLO esta línea.
-- insert into public.admins (email) values ('correo-del-dueno@gmail.com') on conflict do nothing;
