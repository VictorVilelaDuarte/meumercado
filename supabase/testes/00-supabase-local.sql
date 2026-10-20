-- Imita o pedaço do Supabase de que o esquema depende, para testar num Postgres comum (scripts/testar-banco.sh).
-- NÃO rode isto no Supabase de verdade: lá estas coisas já existem.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (id uuid primary key, email text);

-- No Supabase, auth.uid() lê o "sub" do token de login. Aqui o teste escreve o token com set_config.
create function auth.uid() returns uuid language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub', '')::uuid
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- Privilégios padrão do Supabase: as tabelas novas nascem abertas para os três papéis; quem fecha é o RLS.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
