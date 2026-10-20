# 06 — Telas

Cada tela: rota, arquivo, objetivo, dados, regras e testes. O comentário no topo de cada `page.tsx` aponta para a seção daqui.
Toda rota está em `e2e/telas.spec.ts`. Estado: **todas com dados de exemplo**.

## inicio
`/` · `src/app/(app)/page.tsx` — Saudação, pontos, busca, botão de escanear, maiores quedas, 3 mercados mais baratos, atalhos (alertas, despensa, desafio, convites).
Dados: `ofertasDaSemana`, `rankingMercados`.

## busca
`/busca?q=&c=&ordem=unidade` · `(app)/busca/page.tsx` — Busca por nome (sem acento), filtro por categoria, ordenação por preço por unidade. Filtros ficam na URL (dá para compartilhar).
Teste: "busca filtra produtos".

## produto
`/produto/[id]` · `(app)/produto/[id]/page.tsx` — Menor preço, economia máxima, **mapa dos mercados com pino de preço por faixa**, lista de preços com "há N dias", link para histórico. Só preços válidos (30 dias).
Teste: "produto mostra mapa e preços por mercado".

## historico
`/produto/[id]/historico` — Gráfico de linhas do menor preço e da média por mês.

## mercados
`/mercados?m=<id>` · `(app)/mercados/page.tsx` — Mapa de todos os mercados e ranking pelo índice (100 = média). `?m=` seleciona um mercado.

## escanear
`/escanear` · `(app)/escanear/LerNota.tsx` (cliente) — Visor de câmera (ainda decorativo: câmera é Fase 1) e **leitura real da nota pelo link do QR Code**: a pessoa cola o link, a tela chama `POST /api/nfce`, que busca na Sefaz-SP (`src/nfce/sefaz.ts`) e devolve a nota lida (`src/nfce/lerNota.ts`).
Mostra mercado, bairro, data, nº de itens, quantos têm código de barras, valor pago, desconto e cada item com categoria pelo NCM (`resumirNota`) ou "revisar". Se a Sefaz só devolveu a versão resumida, avisa que veio sem código de barras. **Ainda não grava** a nota (Fase 1). Embaixo, a última nota de exemplo.
Erros: link que não é da Sefaz-SP ou chave com dígito errado → 400 com mensagem; Sefaz fora do ar ou captcha → 502.
Testes: "escanear: colar o link do QR Code mostra a nota lida (Sefaz simulada)" e "escanear: link que não é da Sefaz-SP é recusado pelo servidor".

## nota
`/nota/[id]` — Itens da nota da própria pessoa, cada um marcado abaixo/acima/na média, pontos ganhos, itens não reconhecidos.
**Privacidade:** busca com `repositorio.nota(usuarioAtual, id)`; nota de outra pessoa → 404. Teste: "privacidade".

## gastos
`/gastos` — Total do mês, gráfico por mês, por categoria, inflação pessoal, economia perdida, últimas notas. Só dados da própria pessoa.

## lista
`/lista` · `ListaInterativa.tsx` (cliente) — Itens com checkbox; cartão "MELHOR OPÇÃO" (um mercado ou combinação de dois) com total e economia contra a média. Marcar item recalcula. Ainda não salva.
Teste: "marcar item como comprado recalcula o total da lista".

## ofertas
`/ofertas?c=` — Maior queda em destaque e grade das demais, filtro por categoria.

## alertas
`/alertas` — Alertas atingidos em destaque; os demais com barra de progresso até a meta; avisos automáticos (ainda só visuais).

## despensa
`/despensa` — Itens "acabando" e "em casa", estimados pelo intervalo entre compras da pessoa.

## desafio
`/desafio` — Posição da pessoa, economia vs. média do grupo, ranking (só nome e %), dias restantes no mês.

## perfil
`/perfil` — Nível e progresso, números da pessoa, conquistas, links (convites, desafio, alertas, despensa, admin se for admin).

## convites
`/convites` · `ConvitesInterativo.tsx` (cliente) — Gerar código (limite 5, admin ilimitado), lista de códigos, pessoas convidadas com o estado ("Aguardando o administrador", "Aprovado"...).
Teste: "membro gera convite e o código aparece".

## admin
`/admin` · `AdminInterativo.tsx` (cliente) — Só admin (outros → 404). Estatísticas, **pedidos de entrada com Aprovar/Recusar**, produtos para revisar.
Teste: "administrador aprova pedido de entrada".

## entrar
`/entrar` · `EntrarFormulario.tsx` (cliente) — Fora do app (sem menu). Nome + código de convite → mensagem "aguardando aprovação". Erros: código inexistente, usado, expirado.
Testes: "entrar com convite válido...", "convite já usado...".
