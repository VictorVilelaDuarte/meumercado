# 04 — Dados de exemplo

Arquivo: `src/data/mock.ts`. Tudo é **inventado** (CNPJs `00.000.000/0001-0X`, endereços "[endereço de exemplo]").

- **Data de referência:** `DATA_REFERENCIA = "2026-10-15"`. É o "hoje" do app enquanto não há banco.
- **Determinístico:** os preços são gerados com um gerador pseudoaleatório com semente fixa (`criarGerador`). Mesma semente, mesmos dados, então os testes são estáveis.
- **Mercados (6):** dutra, vila-ema, centro, satelite, aquarius, urbanova.
- **Produtos (18):** todos com NCM real do tipo de produto, para testar a categorização.
- **Preços:** gerados de maio em diante, mais algumas quedas fixas recentes para o Hub de Ofertas.
- **Pessoas:** `victor` (admin, usuário atual), ana, rafael, marina, joao (ativos), lucas e bia (aguardando aprovação).
- **Convites:** MERC-7Q4K (usado por lucas), MERC-B2RT (usado por bia), MERC-H8WX (disponível — use no /entrar).
- **Notas:** geradas por pessoa; uma tem o item "KIT CHURR PREMIUM" sem produto reconhecido (testa o "não reconhecido").
- **Revisões do admin:** 2 descrições de nota esperando confirmação.

`src/data/__tests__/mock.test.ts` garante a coerência (todo preço aponta para produto e mercado existentes, categoria do NCM bate com a do produto, privacidade, etc.).

## Trocar pelo banco
Implementar a interface `Repositorio` (`src/data/repositorio.ts`) com Supabase e trocar a última linha do arquivo.
As telas não mudam. Métodos hoje síncronos vão virar `async` nessa etapa (as páginas já são Server Components).
