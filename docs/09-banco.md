# 09 — Banco de dados (Supabase / Postgres)

Status (2026-10-20): **esquema pronto e testado num Postgres local.** Ainda não está ligado ao app: as telas continuam
usando o mock (`src/data/repositorio.ts`). Ligar é o próximo item do roteiro (Fase 1).

- Esquema: `supabase/migrations/20261020000000_esquema_inicial.sql` (um arquivo só, comentado).
- Testes: `supabase/testes/` com `npm run test:db` (também roda dentro de `npm run verificar`).
- Por que assim: `docs/decisoes/0007-banco-supabase.md`.

## Tabelas

| Tabela | O que guarda | Quem lê |
|---|---|---|
| `perfis` | pessoa (id do login, nome, papel, status, quem convidou, pontos) | o próprio; ativos veem os outros ativos; admin vê todos |
| `convites` | código MERC-XXXX, quem criou, usado por quem, validade | quem criou e o admin |
| `mercados` | loja pelo CNPJ (`rede` = 8 primeiros dígitos), nome mostrado, endereço, CEP, lat/lng | membros ativos |
| `produtos` | nome, categoria, EAN (13 dígitos), NCM, unidade, embalagem, `precisa_revisao` | membros ativos |
| `codigos_mercado` | código interno do produto em cada rede → produto (para itens sem EAN) | membros ativos |
| `observacoes_preco` | **preço compartilhado**: produto, mercado, valor por unidade já com desconto, data. Sem usuário, sem nota | membros ativos |
| `notas` | nota da pessoa (chave única, mercado, data, totais, pontos) | **só o dono** (nem o admin) |
| `itens_nota` | itens como vieram da Sefaz, com produto e categoria | **só o dono** |
| `pendencias_produto` | itens que não casaram com produto (rede + código), quantas vezes apareceram | só o admin |
| `alertas`, `listas_compras`, `itens_lista` | coisas pessoais | só o dono |

Dinheiro é inteiro em centavos; datas de nota são `date`; a hora de emissão é `timestamptz` em horário de Brasília.

## Funções (o app chama com `supabase.rpc(...)`)

| Função | Quem chama | O que faz |
|---|---|---|
| `criar_primeiro_admin(nome)` | o Victor, uma vez | com o banco vazio, quem chamar vira admin ativo. Depois dá erro |
| `gerar_convite()` | membro ativo | cria MERC-XXXX válido por 7 dias; limite de 5 por membro (admin sem limite) |
| `entrar_com_convite(codigo, nome)` | quem acabou de criar login | cria o perfil "aguardando_aprovacao" e gasta o convite |
| `aprovar_entrada(id)` / `recusar_entrada(id)` | admin | aprova (quem convidou ganha 100 pontos) ou recusa |
| `registrar_nota(usuario, nota)` | **só o servidor** (`service_role`) | grava nota e itens, reconhece produtos, gera preços e pontos |
| `resolver_pendencia(rede, codigo, produto)` | admin | liga um código de granel a um produto, completa notas antigas e gera os preços que faltavam |
| `ranking_desafio('2026-10')` | membro ativo | posição, nome e economia % do mês. Não mostra valores nem itens |

Mesmas regras de `src/domain` (convites, pontos, economia do desafio), agora garantidas também no banco. Se mudar uma, mude a outra.

### Por que `registrar_nota` é só do servidor
Se o navegador pudesse chamar, qualquer membro mandaria um JSON inventado e criaria preço falso. Assim, o fluxo é:
tela → `POST /api/nfce` → servidor busca na Sefaz (`buscarNota`) → `notaParaRegistro` (põe a categoria pelo NCM) →
`registrar_nota` com a chave `service_role`, passando o id de quem está logado. A chave `service_role` nunca vai para o navegador.

### Reconhecimento de produto dentro de `registrar_nota`
1. Item com EAN → produto com aquele EAN (cria se for o primeiro; fica `precisa_revisao` para o admin dar um nome bom).
   Aproveita e aprende o código interno daquela rede.
2. Sem EAN → `codigos_mercado` (rede + código).
3. Nada → `pendencias_produto`. O admin resolve uma vez e vale para todas as filiais da rede.

Com as 4 notas reais: 21 produtos criados pelo EAN, 21 preços, 4 pendências (frios e kibe do Tauste, a granel).

## Como criar no Supabase (passo a passo para o Victor)
1. Crie uma conta em supabase.com e um projeto novo (região São Paulo, `sa-east-1`). Guarde a senha do banco.
2. No painel do projeto, abra **SQL Editor → New query**, cole o arquivo `supabase/migrations/20261020000000_esquema_inicial.sql`
   inteiro e clique em **Run**. Deve terminar sem erro.
   (Quem usa a CLI: `supabase link --project-ref <ref>` e `supabase db push`.)
3. Em **Authentication → Providers**, deixe ligado o login por e-mail (link mágico).
4. Em **Project Settings → API**, copie a URL, a chave `anon` e a chave `service_role` para o `.env.local` do app
   (nomes em `docs/05-roteiro.md`, quando o item de ligar o app for feito). **Nunca** suba a `service_role` para o GitHub.
5. Entre no app com seu e-mail e chame `criar_primeiro_admin('Victor')` (o app vai ter um botão para isso; até lá, pelo SQL Editor
   não funciona, porque lá não há usuário logado).

## Testes (`npm run test:db`)
`scripts/testar-banco.sh` sobe um Postgres temporário, aplica `supabase/testes/00-supabase-local.sql` (imita o que o Supabase
já tem: papéis `anon`/`authenticated`/`service_role`, `auth.uid()`), a migração e os testes:
- `01-regras.sql`: convites (formato, uso, expirado, limite), aprovação e recusa, primeiro admin, privacidade (nota só do dono,
  nem o admin lê; quem não é membro não lê nada; ninguém muda papel ou pontos), registro de nota (validações, preço com desconto,
  um preço por produto, EAN casando entre redes, pontos), pendência resolvida pelo admin, ranking e apagar nota.
- `02-notas-reais.sql`: grava as 4 notas reais (`notas-reais.json`) e confere produtos, preços, pendências e pontos.

`notas-reais.json` é o resultado de `notaParaRegistro` nas fixtures; o Vitest confere que está em dia. Se mudar o leitor,
gere de novo com `GERAR_NOTAS_REAIS=1 npx vitest run registro`.

Precisa do Postgres instalado (`sudo apt install postgresql` / `brew install postgresql`). Sem ele, o teste avisa e é pulado.

## Para mudar o esquema depois
Nunca edite uma migração que já rodou no Supabase. Crie um arquivo novo em `supabase/migrations/` com data na frente
(`20261101000000_o_que_muda.sql`), acrescente o teste em `supabase/testes/` e rode `npm run test:db`.
