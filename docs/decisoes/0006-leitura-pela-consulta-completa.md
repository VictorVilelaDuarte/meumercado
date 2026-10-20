# ADR 0006 — Ler a nota pela "Consulta Completa" da Sefaz-SP, no servidor

Data: 2026-10-20 · Estado: aceita

**Contexto:** precisamos de EAN e NCM de cada item para casar produtos entre mercados (sem o usuário bipar nada) e para
categorizar (ADR 0003). A página que o QR Code abre não traz esses campos. O XML da nota traz, mas baixá-lo exige
certificado digital do destinatário ou do emitente. O teste com 4 notas reais (docs/08-nfce.md) mostrou que a
"Consulta Completa", aberta pelo botão "Visualizar em Abas", traz EAN e NCM sem certificado.

**Decisão:**
1. O servidor do app (rota `POST /api/nfce`) simula o botão "Visualizar em Abas" (GET + POST do ASP.NET + GET, com cookies)
   e lê a página completa com `lerNota` (função pura em `src/nfce/lerNota.ts`).
2. Se a Sefaz pedir captcha, tenta de novo com sessão nova (3 vezes). Se ainda falhar, usa a página resumida: guarda preços,
   mas sem EAN/NCM.
3. O servidor só consulta `www.nfce.fazenda.sp.gov.br`, com o link refeito a partir de uma chave com dígito verificador válido.
4. O leitor ignora a aba "Destinatário" (onde ficaria CPF e nome).

**Por quê:** é o único caminho gratuito e sem certificado que dá EAN e NCM. Ler o HTML com expressões regulares (e não com DOM)
deixa a mesma função rodar no servidor e nos testes, sem dependência nova.

**Consequências:**
- Se a Sefaz mudar o layout, `lerNota` quebra. Os testes com as notas reais salvas em `src/nfce/__fixtures__/` mostram onde;
  basta salvar a página nova como fixture e ajustar.
- O captcha intermitente pode piorar com muitas consultas do mesmo IP. A Fase 1 deve gravar a nota resumida na hora e
  completar EAN/NCM depois, se precisar.
- Não tentamos resolver captcha.
