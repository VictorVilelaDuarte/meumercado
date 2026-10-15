# 02 — Regras de negócio

Todas as regras ficam em `src/domain/` como funções puras, cada uma com testes em `src/domain/__tests__/`.
Se uma regra mudar, mude o teste primeiro.

## Tipos básicos (`tipos.ts`)
- `Centavos`: inteiro. R$ 21,90 = `2190`.
- `DataISO`: `"2026-10-15"`.
- `Mercado`, `Produto` (com `ncm`, `unidadeMedida`, `quantidadeEmbalagem`), `ObservacaoPreco` (produto + mercado + valor + data),
  `Nota` e `ItemNota` (com `descricaoOriginal` como veio na nota e `produtoId` quando reconhecido), `Usuario`, `Convite`,
  `AlertaPreco`, `ListaCompras`.

## Preços (`precos.ts`)
- **Validade:** um preço vale por `VALIDADE_PRECO_DIAS = 30` dias. Mais velho que isso não aparece como "preço atual".
- `precosAtuais`: o preço mais recente de cada mercado, dentro da validade, do mais barato ao mais caro.
- `resumoPreco`: menor, maior, média, economia máxima (maior − menor) e em quantos mercados.
- `precoPorUnidade`: valor ÷ quantidade da embalagem (ex.: por rolo). Usado em "menor preço por unidade".
- **Índice do mercado** (`indiceMercado`): para cada produto visto em **2 ou mais** mercados, divide o preço do mercado pela média
  da cidade; o índice é a média dessas razões × 100, arredondada. 100 = na média; 94 = 6% mais barato.
- `maioresQuedas`: compara o preço dos últimos 7 dias com o anterior no mesmo mercado. Base do Hub de Ofertas.

## Lista de compras (`lista.ts`)
`calcularLista(itens, observacoes, hoje)` considera só itens não comprados e devolve:
- `melhorUnico`: o mercado com o menor total que tem **todos** os itens.
- `melhorCombinacao`: o melhor par de mercados (cada item no mais barato dos dois). **Só aparece se for mais barato que o melhor único.**
- `porMercado`, `totalMedioCidade` (para mostrar a economia) e `semPreco`.
- Empate: vence o mercado de id menor (resultado estável).

## Categorias (`categorias.ts`) — ADR 0003
1. `categoriaPorNcm`: tabela de prefixos NCM, **o prefixo mais longo vence** (ex.: `340111` Higiene antes de `3401` Limpeza).
2. Se não houver NCM ou ele não estiver na tabela: `categoriaPorDescricao` com expressões regulares sobre a descrição normalizada (sem acento, maiúscula).
3. Se nada casar: categoria "Outros" e `precisaRevisao = true` (vai para o painel do admin).

## Gastos (`gastos.ts`) — sempre de UMA pessoa
- `totalNota`, `totalPorMes`, `totalPorCategoria` (com fração do total).
- `economiaPerdida`: quanto teria economizado comprando cada item no mais barato da cidade naquele dia.
- `inflacaoPessoal(notas, base, atual)`: método de Laspeyres sobre a cesta que a pessoa comprou no mês base.
- `compararItensComMedia`: cada item da nota marcado como abaixo, acima ou na média (tolerância de 2%).

## Convites (`convites.ts`) — ADR 0004
```
membro ativo gera código (MERC-XXXX, vale 7 dias)
  → pessoa usa o código no /entrar → status "aguardando_aprovacao"
  → admin aprova → "ativo" (quem convidou ganha 100 pontos)
  → ou admin recusa → "recusado"
```
- Limite: 5 convites por membro (expirados devolvem a vaga). Admin não tem limite.
- Erros de regra lançam `ErroRegra` com a mensagem pronta para a tela.
- Código é aceito em minúsculas e com espaços (normalizado).

## Engajamento (`engajamento.ts`)
- **Despensa:** intervalo médio entre compras do mesmo produto → estimativa de quanto resta. Abaixo de 20% = "acabando".
- **Alertas:** atingiu quando o menor preço atual ≤ meta. Progresso = quanto já caiu do preço inicial até a meta.
- **Pontos:** 50 por nota, +5 por preço inédito naquele mercado, +100 por convite aprovado.
- **Níveis:** Iniciante (0), Curioso (200), Pesquisador (500), Caçador (1000), Mestre das ofertas (1500).
- **Desafio:** economia % = quanto a pessoa pagou abaixo da média da cidade nos mesmos produtos. Ranking por esse número.

## Formatação (`formato.ts`)
`formatarReais(2190)` → `"R$ 21,90"`; `formatarPercentual(-0.12)` → `"−12%"` (sinal de menos tipográfico);
`tempoRelativo` → "hoje", "ontem", "há N dias".
