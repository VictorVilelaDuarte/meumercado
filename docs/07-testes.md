# 07 — Testes

Regra: **toda etapa precisa ser testável pelo próprio Claude**, sem ninguém olhar a tela.

| Camada | Ferramenta | Onde | Quando escrever |
|---|---|---|---|
| Regras de negócio | Vitest | `src/domain/__tests__/*.test.ts` | toda função nova em `domain` |
| Dados de exemplo | Vitest | `src/data/__tests__/` | ao mudar o mock |
| Leitor de nota | Vitest | `src/nfce/__tests__/` | ao mudar `lerNota` ou ao salvar uma nota real nova em `src/nfce/__fixtures__/` (docs/08-nfce.md) |
| Banco (SQL, RLS) | Postgres local | `supabase/testes/*.sql` (`npm run test:db`) | toda mudança em `supabase/migrations` (docs/09-banco.md) |
| Telas e fluxos | Playwright | `e2e/*.spec.ts` | toda tela nova (entra na lista `ROTAS` de `telas.spec.ts`) e todo fluxo com clique |

`npm run verificar` roda typecheck, lint, unitários, banco, build e e2e. Precisa terminar verde antes de commit.

## E2E
- Sobe `next start` na porta 3100 sobre o build (por isso o build vem antes).
- Tela de celular 390×844, idioma pt-BR.
- `telas.spec.ts`: cada rota responde 200, tem o `h1` esperado e não gera erro de JavaScript; menu inferior; fundo escuro.
- `fluxos.spec.ts`: busca, mapa do produto, lista recalculando total, admin aprovando, gerar convite, entrar com convite (válido e já usado), nota de outra pessoa dá 404.
- A Sefaz de verdade nunca entra nos testes: `sefaz.test.ts` usa uma Sefaz falsa e o e2e de escanear intercepta `/api/nfce` com `page.route`, respondendo com uma nota real salva.
- Prefira seletores por papel e texto (`getByRole`, `getByLabel`). Use `data-testid` só para números que mudam.
- Primeira vez numa máquina: `npx playwright install chromium`.

## Ver a tela
Para conferir visualmente, rode o build, `npx next start -p 3101` e tire screenshots com Playwright (`page.screenshot`).
