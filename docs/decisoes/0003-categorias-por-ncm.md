# ADR 0003 — Categorias pelo NCM, sem IA

Data: 2026-10-15 · Estado: aceita (pedido do Victor)

**Contexto:** o Victor quer cada produto na categoria certa (papel higiênico e shampoo → Higiene; carne → Açougue) automaticamente, sem IA e sem trabalho manual dos usuários.

**Decisão:** 1) tabela de prefixos do código NCM que vem em cada item da nota, prefixo mais longo vence; 2) se faltar NCM, regras de palavras na descrição; 3) o que sobrar vai para revisão no painel do admin.

**Por quê:** o NCM é obrigatório na nota e classifica o produto por lei; é determinístico, gratuito e testável.

**Consequências:** a tabela em `src/domain/categorias.ts` cresce com o uso. Confirmar no teste com notas reais se o NCM aparece na consulta pública (`docs/08-nfce.md`).
