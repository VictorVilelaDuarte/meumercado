# meumercado

Comparador de preços de supermercado entre amigos, em São José dos Campos/SP.
Cada membro escaneia o QR Code da nota fiscal; os preços viram um mapa compartilhado dos mercados da cidade.
Os gastos de cada um continuam privados.

> Estado: front-end com dados de exemplo. Ainda sem banco, login ou leitura real de nota. Ver [docs/05-roteiro.md](docs/05-roteiro.md).

## Rodar

```bash
npm install
npx playwright install chromium   # só na primeira vez, para os testes de navegador
npm run dev                       # http://localhost:3000
npm run verificar                 # typecheck + lint + testes + build + e2e
```

## Documentação

Comece por [CLAUDE.md](CLAUDE.md) (serve para humanos também) e depois [docs/](docs/).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Vitest · Playwright.
Planejado: Supabase (Postgres + login) e Vercel. Motivos em [docs/decisoes/0001-stack.md](docs/decisoes/0001-stack.md).
