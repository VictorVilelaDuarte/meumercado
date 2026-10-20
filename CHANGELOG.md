# Changelog

Registre aqui cada etapa entregue, a mais recente no topo. Formato: data, o que mudou, como testar.

## 2026-10-20 — Banco de dados (Supabase)

- Esquema em `supabase/migrations/20261020000000_esquema_inicial.sql`: perfis, convites, mercados, produtos, códigos por rede,
  preços compartilhados, notas e itens privados, pendências do admin, alertas e listas.
- Privacidade no próprio banco (RLS): nota só o dono lê, nem o admin; preços sem ligação com pessoa; quem não foi aprovado não lê nada.
- Funções: primeiro admin, gerar/usar convite, aprovar/recusar, `registrar_nota` (só o servidor; reconhece produto por EAN ou
  código da rede, gera preços e pontos), resolver pendência e ranking do desafio.
- `notaParaRegistro` (`src/nfce/registro.ts`) prepara a nota lida para o banco.
- Testes: `npm run test:db` sobe um Postgres local e roda as regras + as 4 notas reais. Entrou no `npm run verificar`.
- Ainda não ligado ao app (próximo passo). Como criar no Supabase: `docs/09-banco.md`. Decisão: ADR 0007.

## 2026-10-20 — Leitura de notas reais da Sefaz-SP

- Teste com 4 notas reais de São José dos Campos (Tauste, Americanas, 2× Carrefour): a página do QR Code não traz EAN/NCM,
  mas a "Consulta Completa" (botão "Visualizar em Abas") traz, sem certificado. 29 de 33 itens com EAN, 33 de 33 com NCM.
  Detalhes em `docs/08-nfce.md`; decisão em `docs/decisoes/0006-leitura-pela-consulta-completa.md`.
- Novo `src/nfce/`: `lerNota(html)` (puro, lê página completa e resumida), `lerQrCode` / chave de acesso / EAN (`codigos.ts`),
  `buscarNota` (passo a passo na Sefaz com cookies, novas tentativas no captcha e reserva na resumida) e `resumirNota`.
- Notas reais anonimizadas em `src/nfce/__fixtures__/` (sem cartão, operador, hash do QR e dados de sessão).
- Rota `POST /api/nfce` e tela `/escanear` lendo a nota de verdade pelo link do QR Code (ainda sem gravar; câmera na Fase 1).
- Tabela de NCM ampliada com o que as notas mostraram: ovos (0407), carnes preparadas (1602), conservas (2005), molhos (2103),
  algodão e hastes (5601).
- Testes: 40 unitários novos em `src/nfce/__tests__` e 2 e2e novos na tela de escanear.
- Como testar: `npm run verificar`.

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
