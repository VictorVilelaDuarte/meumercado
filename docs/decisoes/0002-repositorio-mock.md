# ADR 0002 — Repositório único com dados de exemplo

Data: 2026-10-15 · Estado: aceita

**Contexto:** queremos construir e testar as telas antes de ter banco e antes de ver notas reais.

**Decisão:** toda leitura de dados passa por `repositorio` (`src/data/repositorio.ts`), uma interface. Hoje ela usa `mock.ts`, gerado com semente fixa.

**Por quê:** as telas ficam prontas e testáveis; trocar pelo Supabase muda um arquivo; dados determinísticos deixam os testes estáveis.

**Consequências:** quando o Supabase entrar, os métodos viram `async` e as páginas passam a usar `await`. Os testes unitários continuam usando o mock.
