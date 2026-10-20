-- Registra as 4 notas reais (src/nfce/__fixtures__, já no formato de notaParaRegistro) num banco limpo
-- e confere o que o reconhecimento de produto faz com elas. O JSON é conferido pelo Vitest (registro.test.ts).
set client_min_messages = warning;
\set notas `cat supabase/testes/notas-reais.json`

truncate public.notas, public.observacoes_preco, public.produtos, public.codigos_mercado, public.pendencias_produto, public.mercados cascade;
update public.perfis set pontos = 0;

set role service_role;
\o /dev/null
select public.registrar_nota('00000000-0000-0000-0000-00000000000b', nota) from jsonb_array_elements(:'notas'::jsonb) as nota;
\o
reset role;

do $$
begin
  perform teste.afirmar((select count(*) = 3 from public.mercados), '3 mercados (as duas notas do Carrefour são da mesma loja)');
  perform teste.afirmar((select count(*) = 33 from public.itens_nota), '33 itens gravados');
  perform teste.afirmar((select count(*) = 21 from public.produtos), '21 produtos diferentes com EAN');
  perform teste.afirmar((select count(*) = 21 from public.observacoes_preco), 'um preço por produto');
  perform teste.afirmar((select count(*) = 4 and bool_and(rede = '65897910') from public.pendencias_produto), 'os 4 itens a granel do Tauste vão para o admin');
  perform teste.afirmar((select count(*) = 0 from public.produtos where categoria = 'Outros'), 'todo produto com categoria pelo NCM');
  perform teste.afirmar((select sum(valor_pago) = 20609 + 1599 + 2492 + 8188 from public.notas), 'valores pagos das 4 notas');
  -- 4 notas × 50 + 5 por produto inédito (21).
  perform teste.afirmar((select pontos = 4 * 50 + 21 * 5 from public.perfis where id = '00000000-0000-0000-0000-00000000000b'), 'pontos das 4 notas');
end $$;
