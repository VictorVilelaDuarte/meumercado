-- Testes do esquema: convites, privacidade, registro de nota, preços, pendências e ranking.
-- Rodam com scripts/testar-banco.sh (npm run test:db). Cada bloco falha com uma mensagem clara se a regra quebrar.

create schema teste;
grant usage on schema teste to anon, authenticated, service_role;

-- Age como uma pessoa logada (ou como o servidor, se papel = 'service_role').
create procedure teste.como(usuario uuid, papel text default 'authenticated') language plpgsql as $$
begin
  perform set_config('role', 'postgres', false);
  perform set_config('request.jwt.claims', coalesce(json_build_object('sub', usuario)::text, ''), false);
  perform set_config('role', papel, false);
end $$;
grant execute on procedure teste.como(uuid, text) to authenticated, service_role;

create function teste.afirmar(condicao boolean, mensagem text) returns void language plpgsql as $$
begin
  if condicao is not true then raise exception 'FALHOU: %', mensagem; end if;
end $$;

-- Roda um comando e confere que ele falha com a mensagem esperada.
create function teste.espera_erro(comando text, trecho text) returns void language plpgsql as $$
begin
  execute comando;
  raise exception 'FALHOU: deveria ter dado erro "%": %', trecho, comando;
exception when others then
  if sqlerrm like 'FALHOU:%' then raise; end if;
  if position(trecho in sqlerrm) = 0 then raise exception 'FALHOU: erro esperado "%", veio "%"', trecho, sqlerrm; end if;
end $$;
grant execute on all functions in schema teste to anon, authenticated, service_role;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'victor@exemplo.com'),
  ('00000000-0000-0000-0000-00000000000b', 'bia@exemplo.com'),
  ('00000000-0000-0000-0000-00000000000c', 'caio@exemplo.com'),
  ('00000000-0000-0000-0000-00000000000d', 'intruso@exemplo.com');

-- Notas de teste no formato de notaParaRegistro (src/nfce/registro.ts), baseadas nas notas reais do Tauste e do Carrefour.
create table teste.notas (nome text primary key, dados jsonb);
insert into teste.notas values
('tauste', '{
  "fonte": "completa", "chave": "35261065897910001560650260000624591342950530", "numero": "62459", "serie": "26",
  "data": "2026-10-20", "hora": "13:45:26", "valorProdutos": 4810, "descontos": 720, "valorPago": 4090,
  "emitente": {"cnpj": "65897910001560", "razaoSocial": "TAUSTE SUPERMERCADOS LTDA", "endereco": "AV. SAO JOAO, 2555",
               "bairro": "JARDIM DAS COLINAS", "municipio": "SAO JOSE DOS CAMPOS", "uf": "SP", "cep": "12242000"},
  "itens": [
    {"numero": 1, "descricao": "FILE FG TEMP BD", "codigo": "102858", "ncm": "02071422", "quantidade": 0.356, "unidade": "KG",
     "valorUnitario": 3288, "valorTotal": 1171, "desconto": 0, "categoria": "Açougue"},
    {"numero": 2, "descricao": "FEIJAO PR FUGINI CAR", "codigo": "115362", "ean": "7897517209223", "ncm": "20055900", "quantidade": 1,
     "unidade": "SH", "valorUnitario": 399, "valorTotal": 399, "desconto": 0, "categoria": "Mercearia"},
    {"numero": 3, "descricao": "FEIJAO PR FUGINI CAR", "codigo": "115362", "ean": "7897517209223", "ncm": "20055900", "quantidade": 1,
     "unidade": "SH", "valorUnitario": 399, "valorTotal": 399, "desconto": 0, "categoria": "Mercearia"},
    {"numero": 4, "descricao": "AGUA MIN LIND VER CG", "codigo": "113233", "ean": "7896089500318", "ncm": "22011000", "quantidade": 12,
     "unidade": "PT", "valorUnitario": 219, "valorTotal": 2628, "desconto": 720, "categoria": "Bebidas"},
    {"numero": 5, "descricao": "SAL ITAL SOU D TERRA", "codigo": "158828", "ncm": "07051900", "quantidade": 1,
     "unidade": "PC", "valorUnitario": 213, "valorTotal": 213, "desconto": 0, "categoria": "Hortifrúti"}
  ]}'),
('carrefour', '{
  "fonte": "completa", "chave": "35261045543915003601650870000474121414899812", "numero": "47412", "serie": "87",
  "data": "2026-10-15", "hora": "17:42:57", "valorProdutos": 1018, "descontos": 0, "valorPago": 1018,
  "emitente": {"cnpj": "45543915003601", "razaoSocial": "CARREFOUR COMERCIO E INDUSTRIA LTDA", "endereco": "AVENIDA DEPUTADO BENEDITO MATARAZZO, 5701",
               "bairro": "JARDIM SERIMBURA", "municipio": "SAO JOSE DOS CAMPOS", "uf": "SP", "cep": "12230000"},
  "itens": [
    {"numero": 1, "descricao": "FEIJAO FUGINI", "codigo": "SS000001", "ean": "7897517209223", "ncm": "20055900", "quantidade": 2,
     "unidade": "un9", "valorUnitario": 509, "valorTotal": 1018, "desconto": 0, "categoria": "Mercearia"}
  ]}');
grant select on teste.notas to authenticated, service_role;

-- ---------------- convites e entrada ----------------
do $$ <<convite>>
declare codigo text;
begin
  call teste.como('00000000-0000-0000-0000-00000000000a');
  perform public.criar_primeiro_admin('Victor');
  perform teste.afirmar((select papel = 'admin' and status = 'ativo' from public.perfis where nome = 'Victor'), 'primeiro usuário vira admin ativo');

  call teste.como('00000000-0000-0000-0000-00000000000d');
  perform teste.espera_erro($q$select public.criar_primeiro_admin('Intruso')$q$, 'já existe');
  perform teste.espera_erro($q$select public.gerar_convite()$q$, 'Só membros ativos');

  call teste.como('00000000-0000-0000-0000-00000000000a');
  codigo := public.gerar_convite();
  perform teste.afirmar(codigo ~ '^MERC-[A-HJ-NP-Z2-9]{4}$', 'código no formato MERC-XXXX');

  call teste.como('00000000-0000-0000-0000-00000000000b');
  perform teste.espera_erro($q$select public.entrar_com_convite('MERC-ZZZZ', 'Bia')$q$, 'não encontrado');
  perform public.entrar_com_convite(lower(codigo), 'Bia');
  perform teste.afirmar((select status = 'aguardando_aprovacao' from public.perfis where id = auth.uid()), 'quem usa convite fica aguardando');
  perform teste.afirmar(not public.eu_ativo(), 'aguardando não é ativo');
  perform teste.afirmar((select count(*) = 0 from public.mercados), 'aguardando não lê dados do app');
  perform teste.espera_erro(format('select public.aprovar_entrada(%L)', auth.uid()), 'Só o administrador');

  call teste.como('00000000-0000-0000-0000-00000000000c');
  perform teste.espera_erro(format('select public.entrar_com_convite(%L, %L)', codigo, 'Caio'), 'já foi usado');

  call teste.como('00000000-0000-0000-0000-00000000000a');
  perform teste.afirmar((select count(*) = 2 from public.perfis), 'admin vê o pedido pendente');
  perform public.aprovar_entrada('00000000-0000-0000-0000-00000000000b');
  perform teste.afirmar((select pontos = 100 from public.perfis where nome = 'Victor'), 'quem convidou ganha 100 pontos');

  -- Bia, já ativa, convida o Caio; convite vencido é recusado.
  call teste.como('00000000-0000-0000-0000-00000000000b');
  codigo := public.gerar_convite();
  perform set_config('role', 'postgres', false);
  update public.convites c set expira_em = public.hoje() - 1 where c.codigo = convite.codigo;
  call teste.como('00000000-0000-0000-0000-00000000000c');
  perform teste.espera_erro(format('select public.entrar_com_convite(%L, %L)', codigo, 'Caio'), 'expirou');

  -- Limite de 5 convites por membro (o vencido devolveu a vaga).
  call teste.como('00000000-0000-0000-0000-00000000000b');
  for i in 1..5 loop perform public.gerar_convite(); end loop;
  perform teste.espera_erro($q$select public.gerar_convite()$q$, 'todos os seus convites');
  perform teste.afirmar((select count(*) = 6 from public.convites), 'membro vê só os próprios convites');

  call teste.como('00000000-0000-0000-0000-00000000000c');
  perform teste.afirmar((select count(*) = 0 from public.convites), 'quem não é membro não vê convites');
end $$;

-- Aprova o Caio por um convite novo do admin, para os testes seguintes.
do $$
declare codigo text;
begin
  call teste.como('00000000-0000-0000-0000-00000000000a');
  codigo := public.gerar_convite();
  call teste.como('00000000-0000-0000-0000-00000000000c');
  perform public.entrar_com_convite(codigo, 'Caio');
  call teste.como('00000000-0000-0000-0000-00000000000a');
  perform public.recusar_entrada('00000000-0000-0000-0000-00000000000c');
  perform teste.afirmar((select status = 'recusado' from public.perfis where nome = 'Caio'), 'admin recusa pedido');
  perform set_config('role', 'postgres', false);
  update public.perfis set status = 'aguardando_aprovacao' where nome = 'Caio';
  call teste.como('00000000-0000-0000-0000-00000000000a');
  perform public.aprovar_entrada('00000000-0000-0000-0000-00000000000c');
end $$;

-- ---------------- registrar nota ----------------
do $$ <<registrar>>
declare nota_id uuid;
begin
  -- O navegador (authenticated) não pode registrar nota: só o servidor.
  call teste.como('00000000-0000-0000-0000-00000000000b');
  perform teste.espera_erro(
    format('select public.registrar_nota(%L, %L)', auth.uid(), (select dados from teste.notas where nome = 'tauste')),
    'permission denied');
  perform teste.espera_erro($q$insert into public.observacoes_preco (produto_id, mercado_id, valor, data) values (gen_random_uuid(), gen_random_uuid(), 1, '2026-10-20')$q$, 'row-level security');

  call teste.como(null, 'service_role');
  perform teste.espera_erro(
    format('select public.registrar_nota(%L, %L)', '00000000-0000-0000-0000-00000000000d', (select dados from teste.notas where nome = 'tauste')),
    'Só membros ativos');
  perform teste.espera_erro(
    format('select public.registrar_nota(%L, %L)', '00000000-0000-0000-0000-00000000000b',
           jsonb_set((select dados from teste.notas where nome = 'tauste'), '{chave}', '"35261065897910001560650260000624591342950531"')),
    'Chave de acesso inválida');
  perform teste.espera_erro(
    format('select public.registrar_nota(%L, %L)', '00000000-0000-0000-0000-00000000000b',
           jsonb_set((select dados from teste.notas where nome = 'tauste'), '{emitente,cnpj}', '"11111111000111"')),
    'CNPJ não bate');

  nota_id := public.registrar_nota('00000000-0000-0000-0000-00000000000b', (select dados from teste.notas where nome = 'tauste'));
  perform teste.espera_erro(
    format('select public.registrar_nota(%L, %L)', '00000000-0000-0000-0000-00000000000c', (select dados from teste.notas where nome = 'tauste')),
    'já foi registrada');

  perform teste.afirmar((select count(*) = 1 from public.mercados where cnpj = '65897910001560' and rede = '65897910'), 'mercado criado pelo CNPJ');
  perform teste.afirmar((select count(*) = 5 from public.itens_nota i where i.nota_id = registrar.nota_id), 'todos os itens gravados');
  perform teste.afirmar((select count(*) = 2 from public.produtos), 'produtos criados pelos EANs (feijão e água)');
  perform teste.afirmar((select count(*) = 2 from public.pendencias_produto), 'itens sem EAN e sem código conhecido vão para o admin');
  perform teste.afirmar((select count(*) = 2 from public.observacoes_preco), 'um preço por produto, mesmo com o feijão em duas linhas');
  perform teste.afirmar((select valor = 159 from public.observacoes_preco o join public.produtos p on p.id = o.produto_id where p.ean = '7896089500318'),
    'preço da água já com desconto: (2628 - 720) / 12 = 159');
  perform teste.afirmar((select pontos = 60 from public.notas where id = nota_id), 'nota vale 50 + 5 por produto inédito no mercado');
  perform teste.afirmar((select pontos = 60 from public.perfis where nome = 'Bia'), 'pontos vão para quem escaneou');
  perform teste.afirmar((select emitida_em = '2026-10-20 13:45:26-03' from public.notas where id = nota_id), 'hora de Brasília');

  -- Carrefour: o mesmo feijão (mesmo EAN) casa com o produto já criado, em outra rede.
  perform public.registrar_nota('00000000-0000-0000-0000-00000000000c', (select dados from teste.notas where nome = 'carrefour'));
  perform teste.afirmar((select count(*) = 2 from public.produtos), 'mesmo EAN não cria produto novo');
  perform teste.afirmar((select count(distinct mercado_id) = 2 from public.observacoes_preco o join public.produtos p on p.id = o.produto_id where p.ean = '7897517209223'),
    'feijão tem preço nos dois mercados');
  perform teste.afirmar((select count(*) = 2 from public.codigos_mercado where produto_id = (select id from public.produtos where ean = '7897517209223')),
    'código interno aprendido em cada rede');
end $$;

-- ---------------- privacidade ----------------
do $$
begin
  call teste.como('00000000-0000-0000-0000-00000000000b');
  perform teste.afirmar((select count(*) = 1 from public.notas), 'Bia vê só a própria nota');
  perform teste.afirmar((select count(*) = 5 from public.itens_nota), 'Bia vê só os próprios itens');
  perform teste.afirmar((select count(*) = 3 from public.observacoes_preco), 'preços são de todos');
  perform teste.afirmar((select count(*) = 0 from public.pendencias_produto), 'pendências só o admin vê');

  call teste.como('00000000-0000-0000-0000-00000000000c');
  perform teste.afirmar((select count(*) = 1 from public.notas), 'Caio vê só a própria nota');
  update public.notas set valor_pago = 1;
  perform teste.afirmar((select count(*) = 0 from public.notas where valor_pago = 1), 'ninguém altera nota');

  call teste.como('00000000-0000-0000-0000-00000000000a');
  perform teste.afirmar((select count(*) = 0 from public.notas), 'nem o admin lê nota dos outros');
  perform teste.afirmar((select count(*) = 0 from public.itens_nota), 'nem o admin lê itens dos outros');
  perform teste.afirmar((select count(*) = 2 from public.pendencias_produto), 'admin vê as pendências');

  call teste.como('00000000-0000-0000-0000-00000000000d');
  perform teste.afirmar((select count(*) = 0 from public.observacoes_preco), 'quem não é membro não vê preços');
  perform teste.afirmar((select count(*) = 0 from public.perfis), 'quem não é membro não vê pessoas');

  perform set_config('role', 'anon', false);
  perform teste.espera_erro($q$select count(*) from public.observacoes_preco$q$, 'permission denied');

  -- Perfil: cada um só muda o próprio nome, nunca papel, status ou pontos.
  call teste.como('00000000-0000-0000-0000-00000000000b');
  update public.perfis set nome = 'Beatriz' where id = auth.uid();
  perform teste.afirmar((select nome = 'Beatriz' from public.perfis where id = auth.uid()), 'muda o próprio nome');
  update public.perfis set nome = 'Hacker' where nome = 'Victor';
  perform teste.afirmar((select count(*) = 0 from public.perfis where nome = 'Hacker'), 'não muda nome dos outros');
  perform teste.espera_erro($q$update public.perfis set papel = 'admin' where id = auth.uid()$q$, 'permission denied');
  perform teste.espera_erro($q$update public.perfis set pontos = 9999 where id = auth.uid()$q$, 'permission denied');
end $$;

-- ---------------- lista e alertas (pessoais) ----------------
do $$
declare lista uuid;
begin
  call teste.como('00000000-0000-0000-0000-00000000000b');
  insert into public.listas_compras (nome) values ('Compra do mês') returning id into lista;
  insert into public.itens_lista (lista_id, produto_id, quantidade) select lista, id, 2 from public.produtos;
  insert into public.alertas (produto_id, meta, preco_inicial) select id, 300, 399 from public.produtos where ean = '7897517209223';

  call teste.como('00000000-0000-0000-0000-00000000000c');
  perform teste.afirmar((select count(*) = 0 from public.listas_compras), 'lista é privada');
  perform teste.afirmar((select count(*) = 0 from public.itens_lista), 'itens da lista são privados');
  perform teste.afirmar((select count(*) = 0 from public.alertas), 'alertas são privados');
  perform teste.espera_erro(format('insert into public.itens_lista (lista_id, produto_id) select %L, id from public.produtos limit 1', lista), 'row-level security');
end $$;

-- ---------------- pendência resolvida pelo admin ----------------
do $$
declare criados integer; produto uuid;
begin
  perform set_config('role', 'postgres', false);
  insert into public.produtos (nome, categoria, unidade_medida, precisa_revisao) values ('Filé de frango temperado', 'Açougue', 'kg', false) returning id into produto;

  call teste.como('00000000-0000-0000-0000-00000000000b');
  perform teste.espera_erro(format('select public.resolver_pendencia(%L, %L, %L)', '65897910', '102858', produto), 'Só o administrador');

  call teste.como('00000000-0000-0000-0000-00000000000a');
  criados := public.resolver_pendencia('65897910', '102858', produto);
  perform teste.afirmar(criados = 1, 'pendência gera o preço que faltava');
  perform teste.afirmar((select valor = 3289 from public.observacoes_preco where produto_id = produto), 'preço por kg: 1171 / 0,356 = 3289');
  perform teste.afirmar((select count(*) = 1 from public.pendencias_produto), 'pendência sai da fila');

  call teste.como('00000000-0000-0000-0000-00000000000b');
  perform teste.afirmar((select produto_id = produto from public.itens_nota where codigo = '102858'), 'item antigo da Bia ficou ligado ao produto');
end $$;

-- ---------------- ranking do desafio ----------------
do $$
declare r record;
begin
  call teste.como('00000000-0000-0000-0000-00000000000d');
  perform teste.afirmar((select count(*) = 0 from public.ranking_desafio('2026-10')), 'quem não é membro não vê ranking');

  call teste.como('00000000-0000-0000-0000-00000000000a');
  -- Feijão: Bia pagou 399 (Tauste), Caio 509 (Carrefour). No dia da nota do Caio (15/10) só existia o preço dele: economia 0.
  -- No dia da Bia (20/10) a média era (399 + 509) / 2 = 454.
  for r in select * from public.ranking_desafio('2026-10') loop
    raise notice 'ranking: % % %', r.posicao, r.nome, r.economia;
  end loop;
  perform teste.afirmar((select nome = 'Beatriz' from public.ranking_desafio('2026-10') where posicao = 1), 'Bia economizou mais');
  perform teste.afirmar((select count(*) = 2 from public.ranking_desafio('2026-10')), 'ranking tem só quem tem nota no mês');
  perform teste.afirmar((select pg_get_function_result('public.ranking_desafio(text)'::regprocedure) = 'TABLE(posicao bigint, nome text, economia numeric)'),
    'ranking devolve só posição, nome e percentual');
end $$;

-- ---------------- apagar nota ----------------
do $$
begin
  call teste.como('00000000-0000-0000-0000-00000000000c');
  delete from public.notas;
  perform teste.afirmar((select count(*) = 0 from public.notas), 'dono apaga a própria nota');
  call teste.como('00000000-0000-0000-0000-00000000000b');
  perform teste.afirmar((select count(*) = 1 from public.notas), 'apagar a sua não apaga a dos outros');
  perform teste.afirmar((select count(*) = 4 from public.observacoes_preco), 'os preços continuam (não dizem de quem eram)');
end $$;

reset role;
