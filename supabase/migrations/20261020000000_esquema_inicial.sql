-- =====================================================================================
-- meumercado — esquema inicial do banco (Supabase / Postgres 15+)
-- Documentação: docs/09-banco.md · Decisão: docs/decisoes/0007-banco-supabase.md
--
-- Regras que este arquivo garante no próprio banco (não dependem do app):
--   * Dinheiro é inteiro em centavos.
--   * Preços (observacoes_preco) são de todos e NÃO dizem quem comprou.
--   * Notas e itens são PRIVADOS: só o dono lê. Nem o administrador lê nota de ninguém.
--   * Só membro ATIVO (aprovado pelo admin) lê preços, produtos e mercados.
--   * Nota só entra pelo servidor (registrar_nota, papel service_role), depois de buscada na Sefaz.
--     Assim ninguém inventa preço mandando um JSON direto para o banco.
-- =====================================================================================

create extension if not exists pgcrypto;

-- ---------- tipos ----------
create type public.categoria as enum ('Açougue', 'Hortifrúti', 'Laticínios', 'Mercearia', 'Bebidas', 'Higiene', 'Limpeza', 'Outros');
create type public.unidade_medida as enum ('un', 'kg', 'l', 'rolo');
create type public.papel_usuario as enum ('membro', 'admin');
create type public.status_membro as enum ('aguardando_aprovacao', 'ativo', 'recusado', 'removido');
create type public.status_convite as enum ('disponivel', 'usado');
create type public.fonte_nota as enum ('completa', 'resumida');

-- ---------- tabelas ----------

-- Pessoa do grupo. O id é o mesmo do login do Supabase (auth.users).
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 60),
  papel public.papel_usuario not null default 'membro',
  status public.status_membro not null default 'aguardando_aprovacao',
  convidado_por uuid references public.perfis (id) on delete set null,
  pontos integer not null default 0 check (pontos >= 0),
  criado_em timestamptz not null default now()
);

-- Código de convite MERC-XXXX (ADR 0004). "Expirado" não é guardado: é disponível com expira_em no passado.
create table public.convites (
  codigo text primary key check (codigo ~ '^MERC-[A-HJ-NP-Z2-9]{4}$'),
  criado_por uuid not null references public.perfis (id) on delete cascade,
  status public.status_convite not null default 'disponivel',
  usado_por uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  expira_em date not null
);
create index convites_criado_por on public.convites (criado_por);

-- Loja. Cada filial tem seu CNPJ; os 8 primeiros dígitos (rede) são iguais em todas as filiais da mesma empresa.
create table public.mercados (
  id uuid primary key default gen_random_uuid(),
  cnpj char(14) not null unique check (cnpj ~ '^[0-9]{14}$'),
  rede char(8) generated always as (left(cnpj, 8)) stored,
  razao_social text not null,
  -- Nome mostrado no app ("Tauste Colinas"). Começa igual à razão social; o admin ajusta.
  nome text not null,
  endereco text not null default '',
  bairro text not null default '',
  municipio text not null default '',
  uf char(2) not null default 'SP',
  cep char(8) check (cep ~ '^[0-9]{8}$'),
  lat double precision,
  lng double precision,
  criado_em timestamptz not null default now()
);

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria public.categoria not null default 'Outros',
  -- EAN normalizado para 13 dígitos (ou 8), ver normalizarEan em src/nfce/codigos.ts.
  ean text unique check (ean ~ '^([0-9]{8}|[0-9]{13})$'),
  ncm char(8) check (ncm ~ '^[0-9]{8}$'),
  unidade_medida public.unidade_medida not null default 'un',
  quantidade_embalagem numeric not null default 1 check (quantidade_embalagem > 0),
  -- true = criado automaticamente pela nota; o admin ainda precisa dar nome bonito / conferir categoria.
  precisa_revisao boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Reconhecimento sem EAN (granel): código interno do produto naquela rede → produto. Aprendido com o admin.
create table public.codigos_mercado (
  rede char(8) not null,
  codigo text not null,
  produto_id uuid not null references public.produtos (id) on delete cascade,
  primary key (rede, codigo)
);

-- Itens que o sistema não conseguiu casar com um produto. Fila do admin. Não diz quem comprou.
create table public.pendencias_produto (
  rede char(8) not null,
  codigo text not null,
  descricao text not null,
  ncm char(8),
  categoria public.categoria not null default 'Outros',
  vezes integer not null default 1,
  primeiro_visto timestamptz not null default now(),
  primary key (rede, codigo)
);

-- Nota fiscal. PRIVADA. A chave é única: a mesma nota não entra duas vezes, nem por pessoas diferentes.
create table public.notas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  mercado_id uuid not null references public.mercados (id),
  chave char(44) not null unique check (chave ~ '^[0-9]{44}$'),
  numero text not null,
  serie text not null,
  emitida_em timestamptz not null,
  data date not null,
  valor_produtos integer not null check (valor_produtos >= 0),
  descontos integer not null default 0 check (descontos >= 0),
  valor_pago integer not null check (valor_pago >= 0),
  fonte public.fonte_nota not null,
  pontos integer not null default 0,
  criado_em timestamptz not null default now()
);
create index notas_usuario_data on public.notas (usuario_id, data desc);

-- Itens da nota, como vieram da Sefaz. PRIVADOS (seguem a nota).
create table public.itens_nota (
  id uuid primary key default gen_random_uuid(),
  nota_id uuid not null references public.notas (id) on delete cascade,
  numero integer not null,
  descricao text not null,
  codigo text not null default '',
  ean text,
  ncm char(8),
  quantidade numeric(12, 4) not null check (quantidade > 0),
  unidade text not null default '',
  valor_unitario integer not null check (valor_unitario >= 0),
  valor_total integer not null check (valor_total >= 0),
  desconto integer not null default 0 check (desconto >= 0),
  produto_id uuid references public.produtos (id) on delete set null,
  categoria public.categoria not null default 'Outros',
  unique (nota_id, numero)
);
create index itens_nota_produto on public.itens_nota (produto_id);

-- Preço visto: produto, mercado, valor por unidade (já com desconto) e data. É o dado COMPARTILHADO.
-- De propósito não tem ligação com nota nem usuário.
create table public.observacoes_preco (
  id bigint generated always as identity primary key,
  produto_id uuid not null references public.produtos (id) on delete cascade,
  mercado_id uuid not null references public.mercados (id) on delete cascade,
  valor integer not null check (valor > 0),
  data date not null
);
create index observacoes_produto_data on public.observacoes_preco (produto_id, data desc);
create index observacoes_mercado_data on public.observacoes_preco (mercado_id, data desc);

create table public.alertas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  produto_id uuid not null references public.produtos (id) on delete cascade,
  meta integer not null check (meta > 0),
  preco_inicial integer not null check (preco_inicial > 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index alertas_usuario on public.alertas (usuario_id);

create table public.listas_compras (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 60),
  criado_em timestamptz not null default now()
);
create index listas_usuario on public.listas_compras (usuario_id);

create table public.itens_lista (
  lista_id uuid not null references public.listas_compras (id) on delete cascade,
  produto_id uuid not null references public.produtos (id) on delete cascade,
  quantidade numeric not null default 1 check (quantidade > 0),
  comprado boolean not null default false,
  primary key (lista_id, produto_id)
);

-- ---------- funções de apoio ----------

-- "Hoje" no fuso de São Paulo (regra 2 do CLAUDE.md: hoje vem de um lugar só).
create function public.hoje() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

create function public.eu_ativo() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where id = auth.uid() and status = 'ativo')
$$;

create function public.eu_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where id = auth.uid() and status = 'ativo' and papel = 'admin')
$$;

-- Dígito verificador módulo 11 da chave de acesso (mesma regra de digitoChave em src/nfce/codigos.ts).
create function public.chave_valida(chave text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  soma integer := 0;
  peso integer := 2;
  resto integer;
begin
  if chave is null or chave !~ '^[0-9]{44}$' then return false; end if;
  for i in reverse 43..1 loop
    soma := soma + substr(chave, i, 1)::integer * peso;
    peso := case when peso = 9 then 2 else peso + 1 end;
  end loop;
  resto := soma % 11;
  return (case when resto < 2 then 0 else 11 - resto end) = substr(chave, 44, 1)::integer;
end
$$;

-- ---------- convites e entrada (ADR 0004) ----------

-- Primeiro acesso do sistema: quem chamar isto com o banco vazio vira administrador ativo. Depois não faz mais nada.
create function public.criar_primeiro_admin(p_nome text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Faça login primeiro.'; end if;
  lock table public.perfis in exclusive mode;
  if exists (select 1 from public.perfis) then raise exception 'O administrador já existe.'; end if;
  insert into public.perfis (id, nome, papel, status) values (auth.uid(), btrim(p_nome), 'admin', 'ativo');
end
$$;

create function public.gerar_convite() returns text
language plpgsql security definer set search_path = '' as $$
declare
  eu public.perfis;
  em_uso integer;
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  novo text;
begin
  select * into eu from public.perfis where id = auth.uid();
  if eu.id is null or eu.status <> 'ativo' then raise exception 'Só membros ativos podem convidar.'; end if;
  if eu.papel <> 'admin' then
    -- Mesma regra de convitesEmUso (src/domain/convites.ts): expirados devolvem a vaga.
    select count(*) into em_uso from public.convites
      where criado_por = eu.id and (status = 'usado' or expira_em >= public.hoje());
    if em_uso >= 5 then raise exception 'Você já usou todos os seus convites.'; end if;
  end if;
  loop
    novo := 'MERC-' || (select string_agg(substr(alfabeto, 1 + floor(random() * 32)::integer, 1), '') from generate_series(1, 4));
    exit when not exists (select 1 from public.convites where codigo = novo);
  end loop;
  insert into public.convites (codigo, criado_por, expira_em) values (novo, eu.id, public.hoje() + 7);
  return novo;
end
$$;

-- Quem acabou de criar login usa o código. Entra como "aguardando_aprovacao".
create function public.entrar_com_convite(p_codigo text, p_nome text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  c public.convites;
begin
  if auth.uid() is null then raise exception 'Faça login primeiro.'; end if;
  if exists (select 1 from public.perfis where id = auth.uid()) then raise exception 'Você já tem cadastro.'; end if;
  select * into c from public.convites where codigo = upper(btrim(p_codigo)) for update;
  if c.codigo is null then raise exception 'Código de convite não encontrado.'; end if;
  if c.status = 'usado' then raise exception 'Este convite já foi usado.'; end if;
  if c.expira_em < public.hoje() then raise exception 'Este convite expirou. Peça um novo a quem te convidou.'; end if;
  insert into public.perfis (id, nome, convidado_por) values (auth.uid(), btrim(p_nome), c.criado_por);
  update public.convites set status = 'usado', usado_por = auth.uid() where codigo = c.codigo;
end
$$;

create function public.aprovar_entrada(p_usuario uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  alvo public.perfis;
begin
  if not public.eu_admin() then raise exception 'Só o administrador pode fazer isso.'; end if;
  select * into alvo from public.perfis where id = p_usuario for update;
  if alvo.id is null then raise exception 'Pessoa não encontrada.'; end if;
  if alvo.status <> 'aguardando_aprovacao' then raise exception 'Esta pessoa não está aguardando aprovação.'; end if;
  update public.perfis set status = 'ativo' where id = alvo.id;
  -- PONTOS_POR_CONVITE_APROVADO
  update public.perfis set pontos = pontos + 100 where id = alvo.convidado_por;
end
$$;

create function public.recusar_entrada(p_usuario uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.eu_admin() then raise exception 'Só o administrador pode fazer isso.'; end if;
  update public.perfis set status = 'recusado' where id = p_usuario and status = 'aguardando_aprovacao';
  if not found then raise exception 'Esta pessoa não está aguardando aprovação.'; end if;
end
$$;

-- ---------- notas ----------

/*
  Grava uma nota lida da Sefaz (NotaLida de src/nfce/tipos.ts, já com a categoria de cada item; ver
  notaParaRegistro em src/nfce/registro.ts). SÓ o servidor chama (service_role), com o id de quem está logado.

  Para cada item, acha o produto:
    1. pelo EAN (cria o produto se for a primeira vez, e aprende o código interno da rede);
    2. senão, pelo código interno da rede (codigos_mercado);
    3. senão, vai para pendencias_produto (fila do admin).
  Cada produto reconhecido vira UM preço compartilhado (valor por unidade, já com desconto).
  Pontos: 50 pela nota + 5 por produto que ainda não tinha preço naquele mercado (pontosDaNota).
*/
create function public.registrar_nota(p_usuario uuid, p_nota jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  emitente jsonb := p_nota -> 'emitente';
  v_chave text := p_nota ->> 'chave';
  v_mercado public.mercados;
  v_nota_id uuid;
  v_item jsonb;
  v_ean text;
  v_codigo text;
  v_categoria public.categoria;
  v_produto uuid;
  v_ineditos integer := 0;
  v_pontos integer;
begin
  if not exists (select 1 from public.perfis where id = p_usuario and status = 'ativo') then
    raise exception 'Só membros ativos podem registrar notas.';
  end if;
  if not public.chave_valida(v_chave) then raise exception 'Chave de acesso inválida.'; end if;
  if substr(v_chave, 7, 14) <> emitente ->> 'cnpj' then raise exception 'O CNPJ não bate com a chave da nota.'; end if;
  if exists (select 1 from public.notas where chave = v_chave) then raise exception 'Esta nota já foi registrada.'; end if;
  if jsonb_array_length(coalesce(p_nota -> 'itens', '[]')) = 0 then raise exception 'A nota não tem itens.'; end if;

  insert into public.mercados as m (cnpj, razao_social, nome, endereco, bairro, municipio, uf, cep)
  values (
    emitente ->> 'cnpj', emitente ->> 'razaoSocial', coalesce(emitente ->> 'nomeFantasia', emitente ->> 'razaoSocial'),
    coalesce(emitente ->> 'endereco', ''), coalesce(emitente ->> 'bairro', ''), coalesce(emitente ->> 'municipio', ''),
    coalesce(emitente ->> 'uf', 'SP'), nullif(emitente ->> 'cep', '')
  )
  -- Mercado já existe: mantém o nome que o admin deu; só completa o CEP se faltava.
  on conflict (cnpj) do update set cep = coalesce(m.cep, excluded.cep)
  returning * into v_mercado;

  insert into public.notas (usuario_id, mercado_id, chave, numero, serie, emitida_em, data, valor_produtos, descontos, valor_pago, fonte)
  values (
    p_usuario, v_mercado.id, v_chave, p_nota ->> 'numero', p_nota ->> 'serie',
    ((p_nota ->> 'data') || ' ' || (p_nota ->> 'hora') || ' America/Sao_Paulo')::timestamptz, (p_nota ->> 'data')::date,
    (p_nota ->> 'valorProdutos')::integer, (p_nota ->> 'descontos')::integer, (p_nota ->> 'valorPago')::integer,
    (p_nota ->> 'fonte')::public.fonte_nota
  )
  returning id into v_nota_id;

  for v_item in select * from jsonb_array_elements(p_nota -> 'itens') loop
    v_ean := nullif(v_item ->> 'ean', '');
    v_codigo := coalesce(v_item ->> 'codigo', '');
    v_categoria := coalesce((v_item ->> 'categoria')::public.categoria, 'Outros');
    v_produto := null;

    if v_ean is not null then
      insert into public.produtos as p (nome, categoria, ean, ncm, precisa_revisao)
      values (v_item ->> 'descricao', v_categoria, v_ean, nullif(v_item ->> 'ncm', ''), true)
      on conflict (ean) do update set ncm = coalesce(p.ncm, excluded.ncm)
      returning id into v_produto;
      if v_codigo <> '' then
        insert into public.codigos_mercado (rede, codigo, produto_id) values (v_mercado.rede, v_codigo, v_produto)
        on conflict do nothing;
      end if;
    elsif v_codigo <> '' then
      select produto_id into v_produto from public.codigos_mercado where rede = v_mercado.rede and codigo = v_codigo;
      if v_produto is null then
        insert into public.pendencias_produto as pp (rede, codigo, descricao, ncm, categoria)
        values (v_mercado.rede, v_codigo, v_item ->> 'descricao', nullif(v_item ->> 'ncm', ''), v_categoria)
        on conflict (rede, codigo) do update set vezes = pp.vezes + 1;
      end if;
    end if;

    insert into public.itens_nota (nota_id, numero, descricao, codigo, ean, ncm, quantidade, unidade, valor_unitario, valor_total, desconto, produto_id, categoria)
    values (
      v_nota_id, (v_item ->> 'numero')::integer, v_item ->> 'descricao', v_codigo, v_ean, nullif(v_item ->> 'ncm', ''),
      (v_item ->> 'quantidade')::numeric, coalesce(v_item ->> 'unidade', ''), (v_item ->> 'valorUnitario')::integer,
      (v_item ->> 'valorTotal')::integer, coalesce((v_item ->> 'desconto')::integer, 0), v_produto, v_categoria
    );
  end loop;

  -- Pontos: produtos desta nota sem preço anterior neste mercado.
  select count(distinct i.produto_id) into v_ineditos
  from public.itens_nota i
  where i.nota_id = v_nota_id and i.produto_id is not null
    and not exists (select 1 from public.observacoes_preco o where o.produto_id = i.produto_id and o.mercado_id = v_mercado.id);
  v_pontos := 50 + 5 * v_ineditos;

  -- Um preço por produto (a mesma nota pode ter 5 linhas do mesmo feijão).
  insert into public.observacoes_preco (produto_id, mercado_id, valor, data)
  select produto_id, v_mercado.id, round(min(((valor_total - desconto)::numeric / quantidade)))::integer, (p_nota ->> 'data')::date
  from public.itens_nota
  where nota_id = v_nota_id and produto_id is not null and valor_total > desconto
  group by produto_id;

  update public.notas set pontos = v_pontos where id = v_nota_id;
  update public.perfis set pontos = pontos + v_pontos where id = p_usuario;
  return v_nota_id;
end
$$;

/*
  Admin liga uma pendência a um produto. O sistema aprende (codigos_mercado), completa os itens antigos
  dessa rede e gera os preços que faltavam. O admin não vê de quem eram os itens.
*/
create function public.resolver_pendencia(p_rede text, p_codigo text, p_produto uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_qtd integer;
begin
  if not public.eu_admin() then raise exception 'Só o administrador pode fazer isso.'; end if;
  insert into public.codigos_mercado (rede, codigo, produto_id) values (p_rede, p_codigo, p_produto)
  on conflict (rede, codigo) do update set produto_id = excluded.produto_id;

  with atualizados as (
    update public.itens_nota i set produto_id = p_produto
    from public.notas n join public.mercados m on m.id = n.mercado_id
    where i.nota_id = n.id and m.rede = p_rede and i.codigo = p_codigo and i.produto_id is null
    returning i.nota_id, i.valor_total, i.desconto, i.quantidade, n.mercado_id, n.data
  )
  insert into public.observacoes_preco (produto_id, mercado_id, valor, data)
  select p_produto, mercado_id, round(min((valor_total - desconto)::numeric / quantidade))::integer, data
  from atualizados where valor_total > desconto
  group by nota_id, mercado_id, data;
  get diagnostics v_qtd = row_count;

  delete from public.pendencias_produto where rede = p_rede and codigo = p_codigo;
  return v_qtd;
end
$$;

-- ---------- desafio (ranking só com nome e percentual) ----------

/*
  Mesma conta de economiaPercentual (src/domain/engajamento.ts): para cada item reconhecido no mês,
  compara o que a pessoa pagou com a média do preço atual de cada mercado (mais recente nos 30 dias até a data da nota).
  Lê as notas de todos, mas devolve SÓ nome e percentual. Qualquer membro ativo pode chamar.
*/
create function public.ranking_desafio(p_mes text) returns table (posicao bigint, nome text, economia numeric)
language sql stable security definer set search_path = '' as $$
  with itens as (
    select n.usuario_id, i.produto_id, n.data, i.quantidade,
           (i.valor_total - i.desconto)::numeric as pago
    from public.notas n join public.itens_nota i on i.nota_id = n.id
    where public.eu_ativo() and to_char(n.data, 'YYYY-MM') = p_mes and i.produto_id is not null
  ),
  comparados as (
    select it.usuario_id, it.pago, media.valor * it.quantidade as medio
    from itens it
    cross join lateral (
      select avg(ultimo.valor) as valor from (
        select distinct on (o.mercado_id) o.valor
        from public.observacoes_preco o
        where o.produto_id = it.produto_id and o.data <= it.data and o.data >= it.data - 30
        order by o.mercado_id, o.data desc, o.id desc
      ) ultimo
    ) media
    where media.valor is not null
  ),
  por_pessoa as (
    select p.nome, coalesce((sum(c.medio) - sum(c.pago)) / nullif(sum(c.medio), 0), 0) as economia
    from public.perfis p join comparados c on c.usuario_id = p.id
    where p.status = 'ativo'
    group by p.id, p.nome
  )
  select rank() over (order by economia desc), nome, round(economia, 4)
  from por_pessoa
  order by economia desc, nome
$$;

-- ---------- segurança por linha (RLS) ----------

alter table public.perfis enable row level security;
alter table public.convites enable row level security;
alter table public.mercados enable row level security;
alter table public.produtos enable row level security;
alter table public.codigos_mercado enable row level security;
alter table public.pendencias_produto enable row level security;
alter table public.notas enable row level security;
alter table public.itens_nota enable row level security;
alter table public.observacoes_preco enable row level security;
alter table public.alertas enable row level security;
alter table public.listas_compras enable row level security;
alter table public.itens_lista enable row level security;

-- Perfis: cada um vê o seu; membros ativos veem os outros ativos (nome e pontos no ranking); o admin vê todos (pedidos).
create policy perfis_ler on public.perfis for select to authenticated
  using (id = auth.uid() or public.eu_admin() or (public.eu_ativo() and status = 'ativo'));
create policy perfis_mudar_nome on public.perfis for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.perfis from authenticated;
grant update (nome) on public.perfis to authenticated;

create policy convites_ler on public.convites for select to authenticated
  using (criado_por = auth.uid() or public.eu_admin());

-- Dados compartilhados: leitura para membros ativos; mudanças só pelo admin.
create policy mercados_ler on public.mercados for select to authenticated using (public.eu_ativo());
create policy mercados_admin on public.mercados for update to authenticated using (public.eu_admin()) with check (public.eu_admin());
create policy produtos_ler on public.produtos for select to authenticated using (public.eu_ativo());
create policy produtos_admin on public.produtos for update to authenticated using (public.eu_admin()) with check (public.eu_admin());
create policy codigos_ler on public.codigos_mercado for select to authenticated using (public.eu_ativo());
create policy observacoes_ler on public.observacoes_preco for select to authenticated using (public.eu_ativo());
create policy pendencias_admin on public.pendencias_produto for select to authenticated using (public.eu_admin());

-- Notas: só o dono lê e pode apagar. Ninguém insere direto (só registrar_nota). Os preços que a nota gerou continuam.
create policy notas_dono_ler on public.notas for select to authenticated using (usuario_id = auth.uid());
create policy notas_dono_apagar on public.notas for delete to authenticated using (usuario_id = auth.uid());
create policy itens_dono_ler on public.itens_nota for select to authenticated
  using (exists (select 1 from public.notas n where n.id = nota_id and n.usuario_id = auth.uid()));

-- Coisas pessoais: tudo do próprio usuário, e só enquanto ativo.
create policy alertas_dono on public.alertas for all to authenticated
  using (usuario_id = auth.uid() and public.eu_ativo()) with check (usuario_id = auth.uid() and public.eu_ativo());
create policy listas_dono on public.listas_compras for all to authenticated
  using (usuario_id = auth.uid() and public.eu_ativo()) with check (usuario_id = auth.uid() and public.eu_ativo());
create policy itens_lista_dono on public.itens_lista for all to authenticated
  using (exists (select 1 from public.listas_compras l where l.id = lista_id and l.usuario_id = auth.uid()) and public.eu_ativo())
  with check (exists (select 1 from public.listas_compras l where l.id = lista_id and l.usuario_id = auth.uid()) and public.eu_ativo());

-- Visitante sem login (anon) não lê nada.
revoke all on all tables in schema public from anon;

-- ---------- quem pode chamar cada função ----------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.hoje(), public.eu_ativo(), public.eu_admin(), public.chave_valida(text) to authenticated;
grant execute on function
  public.criar_primeiro_admin(text), public.gerar_convite(), public.entrar_com_convite(text, text),
  public.aprovar_entrada(uuid), public.recusar_entrada(uuid), public.resolver_pendencia(text, text, uuid),
  public.ranking_desafio(text)
to authenticated;
-- registrar_nota: só o servidor (chave service_role), nunca o navegador.
grant execute on function public.registrar_nota(uuid, jsonb) to service_role;
