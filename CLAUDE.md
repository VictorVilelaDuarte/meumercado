# CLAUDE.md — guia para o Claude Code neste repositório

Leia este arquivo inteiro antes de mexer em qualquer coisa. Ele é curto de propósito; os detalhes estão em `docs/`.

## O que é

**meumercado**: app web (PWA, celular primeiro) para comparar preços de supermercado em São José dos Campos/SP.
Só para convidados. Os preços vêm das notas fiscais (NFC-e) que os membros escaneiam pelo QR Code.
Preços são compartilhados; os gastos de cada pessoa são privados. Visão completa: `docs/01-visao.md`.

## Estado atual (atualize a cada etapa)

- **Fase 0 quase concluída:** front-end completo com **dados de exemplo** (sem banco, sem login).
- **Leitura real de nota funciona** (2026-10-20): `/escanear` lê pelo link do QR Code via `POST /api/nfce` → Sefaz-SP, com EAN e NCM. Ainda não grava. Ver `docs/08-nfce.md`.
- **Banco pronto mas não ligado** (2026-10-20): esquema Supabase em `supabase/migrations`, testado com `npm run test:db`. Ver `docs/09-banco.md`.
- Próximo passo: criar o projeto no Supabase e ligar o `repositorio` nele. Ver `docs/05-roteiro.md`.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | app em http://localhost:3000 |
| `npm test` | testes unitários (Vitest) das regras em `src/domain` e `src/data` |
| `npm run test:db` | testes do banco (SQL + privacidade) num Postgres local; pulado se não houver Postgres |
| `npm run typecheck` | TypeScript sem gerar arquivos |
| `npm run lint` | ESLint |
| `npm run build` | build de produção (precisa passar antes do e2e) |
| `npm run test:e2e` | testes de navegador (Playwright) contra o build, porta 3100 |
| `npm run verificar` | **tudo acima em sequência. Rode antes de cada commit.** |

Primeira vez numa máquina: `npm install` e `npx playwright install chromium`.

## Estrutura

```
src/
  domain/      regras de negócio PURAS (sem React, sem I/O). Cada arquivo tem testes em domain/__tests__
  nfce/        leitor da NFC-e: lerNota.ts (PURO, HTML → NotaLida), codigos.ts (chave, QR, EAN), sefaz.ts (busca, só servidor)
               __fixtures__/ = notas reais anonimizadas; __tests__/ = testes com elas
  data/        mock.ts (dados de exemplo), repositorio.ts (ÚNICO acesso a dados), consultas.ts (junções para telas)
  components/  ui.tsx (peças visuais), Icone, Mapa, Graficos, NavInferior
  app/         rotas do Next.js. (app)/ = telas com menu inferior; entrar/ = fora do app
supabase/      migrations/ = esquema do banco (SQL, RLS); testes/ = testes do banco (npm run test:db)
e2e/           testes Playwright (telas.spec.ts abre TODA rota; fluxos.spec.ts testa interações)
docs/          documentação; decisoes/ guarda as ADRs (por que escolhemos cada coisa)
```

## Regras que não se quebram

1. **Dinheiro é inteiro em centavos** (`Centavos`). Formate só na tela com `formatarReais`.
2. **Datas são strings ISO `AAAA-MM-DD`**. "Hoje" vem de `repositorio.hoje()`, nunca de `new Date()` em regra de negócio.
3. **Telas nunca importam `data/mock`**. Sempre `repositorio`. É isso que permite trocar o mock pelo Supabase.
4. **Privacidade:** notas e gastos só via `repositorio.notasDoUsuario(id)` / `repositorio.nota(id, notaId)`. Ranking mostra só nome e percentual.
5. **Regra nova vai em `src/domain` com teste**, nunca dentro do componente.
6. **Visual (decisão do Victor):** fundo SEMPRE escuro; roxo e branco são as cores principais; verde só em gráficos e números (economia, queda de preço). Use os tokens de `src/app/globals.css` (`bg-roxo`, `text-verde`...). Ver `docs/03-design.md`.
7. **Usuário nunca bipa código de barras.** Produto é reconhecido pela nota (EAN vem da "Consulta Completa", ADR 0006). Categoria vem do NCM, sem IA (`docs/decisoes/0003-categorias-por-ncm.md`).
8. **Convite precisa de aprovação do administrador** (`docs/decisoes/0004-convite-com-aprovacao.md`).
9. Nomes de código em português (como já está).
10. **Nota real no repositório só anonimizada** (sem CPF, nome, cartão, operador, hash do QR). O leitor nunca lê a aba "Destinatário".
11. O servidor só consulta `www.nfce.fazenda.sp.gov.br`, e só depois de `lerQrCode` validar a chave.
12. **Banco:** privacidade é garantida por RLS em `supabase/migrations`. Nunca dê ao navegador a chave `service_role`; nota só entra por `registrar_nota` no servidor. Mudança de esquema = migração NOVA + teste em `supabase/testes`.

## Como trabalhar aqui (obrigatório)

1. Leia `docs/05-roteiro.md` e pegue o próximo item.
2. Implemente com testes (unitário em `domain`, e2e se for tela ou fluxo).
3. Rode `npm run verificar`. Tudo verde.
4. **Documente:** atualize a tela em `docs/06-telas.md`, marque o item no roteiro, registre no `CHANGELOG.md`.
   Decisão nova de arquitetura ou produto → nova ADR em `docs/decisoes/` (copie o formato das existentes).
5. Ideia nova que não será feita agora → `docs/05-roteiro.md`, seção "Ideias".
6. Commit pequeno, mensagem em português.

## Mapa da documentação

- `docs/01-visao.md` — produto, público, o que é e o que não é
- `docs/02-dominio.md` — todas as regras de negócio com exemplos
- `docs/03-design.md` — cores, fontes, componentes
- `docs/04-dados-de-exemplo.md` — o que existe no mock e como mudar
- `docs/05-roteiro.md` — fases, checklist, ideias
- `docs/06-telas.md` — cada tela: rota, objetivo, dados, regras, testes
- `docs/07-testes.md` — como testar e como escrever testes novos
- `docs/08-nfce.md` — o que sabemos da nota fiscal (QR Code, Sefaz-SP)
- `docs/09-banco.md` — tabelas, funções, privacidade, como criar no Supabase
- `docs/decisoes/` — ADRs
