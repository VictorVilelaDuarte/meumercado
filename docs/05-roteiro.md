# 05 — Roteiro

Marque `[x]` ao terminar e registre no `CHANGELOG.md`. Pegue sempre o primeiro item aberto da fase atual.

## Fase 0 — Base e validação (ATUAL)
- [x] Projeto Next.js + TypeScript + Tailwind + Vitest + Playwright
- [x] Regras de negócio puras com testes (`src/domain`)
- [x] Dados de exemplo determinísticos e repositório único
- [x] 17 telas do protótipo com dados de exemplo
- [x] Testes de navegador de todas as rotas e fluxos principais
- [x] Documentação (CLAUDE.md, docs/, ADRs)
- [x] **Teste com notas reais da Sefaz-SP** (2026-10-20, 4 notas): EAN e NCM vêm na "Consulta Completa"; exemplos anonimizados em `docs/08-nfce.md` e `src/nfce/__fixtures__/`
- [x] Leitor de nota: `src/nfce/` com função pura `lerNota(html) → NotaLida` testada com as notas reais, busca na Sefaz (`sefaz.ts`, `POST /api/nfce`) e tela `/escanear` lendo pelo link do QR Code
- [ ] PWA: manifest, ícone roxo, instalar na tela inicial

## Fase 1 — MVP com amigos
- [ ] Supabase: tabelas (mercados, produtos, observacoes, notas, itens, usuarios, convites), políticas RLS garantindo privacidade das notas
- [ ] `Repositorio` com Supabase (métodos `async`), mantendo o mock para os testes
- [ ] Login (link mágico por e-mail) + fluxo de convite e aprovação de verdade
- [ ] Escanear QR Code com a câmera do celular (`BarcodeDetector` com reserva em biblioteca)
- [ ] Gravar a nota lida e os preços (a busca na Sefaz pelo servidor já existe: `POST /api/nfce`). Se veio só a resumida, tentar a completa depois para pegar EAN/NCM
- [ ] Reconhecimento de produto (EAN → código do mercado → sugestão para o admin)
- [ ] Mercados reais pelo CNPJ da nota, com coordenadas (geocodificação do endereço)
- [ ] Salvar lista de compras, alertas e despensa no banco
- [ ] Deploy na Vercel

## Fase 2 — Mapa e engajamento
- [ ] Mapa real (MapLibre + OpenStreetMap)
- [ ] Aviso quando um alerta é atingido (notificação do PWA)
- [ ] Pontos e conquistas calculados no servidor
- [ ] Desafio mensal com premiação

## Fase 3 — Crescer
- [ ] Outras cidades / outros estados (outras Sefaz)
- [ ] Fotos de produtos (Open Food Facts pelo EAN)

## Ideias (ainda não planejadas)
- Comparar a lista inteira entre mercados mostrando o caminho no mapa.
- Avisar quando um preço da nota está muito acima da média ("preço suspeito").
- Exportar gastos para planilha.
- Aceitar também a chave de acesso digitada (44 dígitos) quando o QR Code estiver apagado. A consulta por chave pede captcha, então precisaria de outro caminho.
- Compartilhar o link do QR Code direto do leitor de QR do celular para o app (Web Share Target do PWA), sem copiar e colar.
