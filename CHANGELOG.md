# Changelog

Registre aqui cada etapa entregue, a mais recente no topo. Formato: data, o que mudou, como testar.

## 2026-10-15 — Fase 0: front-end com dados de exemplo

- Projeto criado: Next.js 15, TypeScript, Tailwind 4, Vitest, Playwright.
- Regras de negócio em `src/domain` com 77 testes unitários: preços e validade, índice de mercado, lista de compras
  (melhor mercado ou combinação de dois), categorias por NCM, gastos e inflação pessoal, convites com aprovação do
  administrador, despensa, alertas, pontos, níveis e desafio.
- Dados de exemplo determinísticos (`src/data/mock.ts`): 6 mercados fictícios, 18 produtos, 7 pessoas, ~1.500 preços.
- 17 telas: Início, Busca, Produto, Histórico, Mercados (mapa), Escanear (simulado), Nota, Gastos, Lista, Ofertas,
  Alertas, Despensa, Desafio, Perfil, Convites, Admin, Entrar.
- 26 testes de navegador: toda rota abre sem erro; fluxos de busca, lista, aprovação de entrada, convite, privacidade.
- Como testar: `npm run verificar`.
