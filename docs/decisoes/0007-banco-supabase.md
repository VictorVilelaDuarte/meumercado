# ADR 0007 — Banco no Supabase, com as regras de privacidade no próprio banco

Data: 2026-10-20 · Estado: aceita (pedido do Victor: "crie o banco de dados necessário para o sistema")

**Contexto:** o app sai do mock. Precisa de login, notas privadas, preços compartilhados e convite com aprovação.
A ADR 0001 já apontava o Supabase.

**Decisão:**
1. Supabase (Postgres + login por e-mail). Esquema em `supabase/migrations/`, em SQL puro.
2. Privacidade e permissões com RLS (segurança por linha) no banco, não só no app: nota e itens só o dono lê,
   nem o administrador; preços (`observacoes_preco`) não têm ligação com pessoa nem nota.
3. Ações com regra (convite, aprovação, nota, pendência, ranking) são funções do banco (`security definer`). As tabelas
   não aceitam escrita direta nesses casos.
4. Nota só entra por `registrar_nota`, que só o servidor (`service_role`) pode chamar, depois de buscar a nota na Sefaz.
5. A categoria continua sendo calculada em TypeScript (`notaParaRegistro`), para manter uma tabela de NCM só.
6. Testes do banco num Postgres local (`npm run test:db`), imitando o mínimo do Supabase.

**Por quê:** mesmo que o app tenha um erro, o banco não entrega a nota de uma pessoa a outra nem aceita preço inventado.
Testar em Postgres local deixa o Claude conferir tudo sem conta no Supabase.

**Consequências:**
- Algumas regras existem em dois lugares (`src/domain` e SQL): convites, pontos, economia do desafio. Os comentários
  das funções SQL apontam a função TypeScript equivalente; mudar uma exige mudar a outra.
- Apagar uma nota não apaga os preços que ela gerou (eles são anônimos e de todos).
- A mesma nota não entra duas vezes, nem por pessoas diferentes (chave única).
