import { diasEntre } from "./formato";
import type { Centavos, DataISO, ObservacaoPreco, Produto } from "./tipos";

/** Quantos dias um preço visto continua valendo para comparação. */
export const VALIDADE_PRECO_DIAS = 30;

/** Preço por unidade de medida (por rolo, por kg...). Retorna centavos, podendo ter fração. */
export function precoPorUnidade(valor: Centavos, produto: Pick<Produto, "quantidadeEmbalagem">): number {
  if (produto.quantidadeEmbalagem <= 0) throw new Error("quantidadeEmbalagem deve ser maior que zero");
  return valor / produto.quantidadeEmbalagem;
}

/** Variação entre dois valores: (depois - antes) / antes. Ex.: 2490 → 2190 = −0,12. */
export function variacaoPercentual(antes: number, depois: number): number {
  if (antes === 0) return 0;
  return (depois - antes) / antes;
}

/**
 * Preço atual de um produto em cada mercado: a observação mais recente de cada mercado
 * dentro da janela de validade. Ordenado do mais barato para o mais caro.
 */
export function precosAtuais(
  observacoes: ObservacaoPreco[],
  produtoId: string,
  hoje: DataISO,
  validadeDias = VALIDADE_PRECO_DIAS,
): ObservacaoPreco[] {
  const maisRecente = new Map<string, ObservacaoPreco>();
  for (const o of observacoes) {
    if (o.produtoId !== produtoId) continue;
    const idade = diasEntre(o.data, hoje);
    if (idade < 0 || idade > validadeDias) continue;
    const atual = maisRecente.get(o.mercadoId);
    if (!atual || o.data > atual.data) maisRecente.set(o.mercadoId, o);
  }
  return [...maisRecente.values()].sort((a, b) => a.valor - b.valor || a.mercadoId.localeCompare(b.mercadoId));
}

export interface ResumoPreco {
  menor: ObservacaoPreco;
  maior: ObservacaoPreco;
  media: number;
  /** Diferença entre o mais caro e o mais barato. */
  economiaMaxima: Centavos;
  quantidadeMercados: number;
}

/** Resumo para a tela de produto. `undefined` quando ninguém viu o produto na janela. */
export function resumoPreco(atuais: ObservacaoPreco[]): ResumoPreco | undefined {
  if (atuais.length === 0) return undefined;
  const ordenados = [...atuais].sort((a, b) => a.valor - b.valor);
  const soma = ordenados.reduce((s, o) => s + o.valor, 0);
  return {
    menor: ordenados[0],
    maior: ordenados[ordenados.length - 1],
    media: soma / ordenados.length,
    economiaMaxima: ordenados[ordenados.length - 1].valor - ordenados[0].valor,
    quantidadeMercados: ordenados.length,
  };
}

/** Média dos preços atuais de um produto na cidade. `undefined` se não houver preço. */
export function mediaCidade(observacoes: ObservacaoPreco[], produtoId: string, hoje: DataISO): number | undefined {
  return resumoPreco(precosAtuais(observacoes, produtoId, hoje))?.media;
}

/**
 * Posição de um preço numa escala de 0 (mais barato) a 1 (mais caro), usada para colorir os pinos do mapa.
 * Com um único preço, retorna 0.
 */
export function posicaoNaFaixa(valor: Centavos, menor: Centavos, maior: Centavos): number {
  if (maior === menor) return 0;
  return Math.min(1, Math.max(0, (valor - menor) / (maior - menor)));
}

/**
 * Índice de preço de um mercado: 100 = média da cidade.
 * Para cada produto com preço atual no mercado, compara com a média da cidade; o índice é a média dessas razões × 100.
 * Retorna `undefined` se o mercado não tiver nenhum preço atual.
 */
export function indiceMercado(observacoes: ObservacaoPreco[], mercadoId: string, hoje: DataISO): number | undefined {
  const produtos = new Set(observacoes.filter((o) => o.mercadoId === mercadoId).map((o) => o.produtoId));
  const razoes: number[] = [];
  for (const produtoId of produtos) {
    const atuais = precosAtuais(observacoes, produtoId, hoje);
    const doMercado = atuais.find((o) => o.mercadoId === mercadoId);
    const resumo = resumoPreco(atuais);
    if (!doMercado || !resumo || resumo.quantidadeMercados < 2) continue;
    razoes.push(doMercado.valor / resumo.media);
  }
  if (razoes.length === 0) return undefined;
  return Math.round((razoes.reduce((s, r) => s + r, 0) / razoes.length) * 100);
}

/** Menor preço da cidade em cada mês (AAAA-MM), para o gráfico de histórico. */
export function menorPrecoPorMes(observacoes: ObservacaoPreco[], produtoId: string): { mes: string; valor: Centavos }[] {
  const porMes = new Map<string, Centavos>();
  for (const o of observacoes) {
    if (o.produtoId !== produtoId) continue;
    const mes = o.data.slice(0, 7);
    const atual = porMes.get(mes);
    if (atual === undefined || o.valor < atual) porMes.set(mes, o.valor);
  }
  return [...porMes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mes, valor]) => ({ mes, valor }));
}

/** Média de todos os preços vistos em cada mês, para comparar com o menor preço no histórico. */
export function mediaPorMes(observacoes: ObservacaoPreco[], produtoId: string): { mes: string; valor: number }[] {
  const porMes = new Map<string, number[]>();
  for (const o of observacoes) {
    if (o.produtoId !== produtoId) continue;
    const mes = o.data.slice(0, 7);
    porMes.set(mes, [...(porMes.get(mes) ?? []), o.valor]);
  }
  return [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, valores]) => ({ mes, valor: valores.reduce((s, v) => s + v, 0) / valores.length }));
}

export interface Oferta {
  produtoId: string;
  mercadoId: string;
  valorAnterior: Centavos;
  valorAtual: Centavos;
  variacao: number;
  data: DataISO;
}

/**
 * Maiores quedas de preço: compara a observação mais recente de cada produto+mercado (dentro de `janelaDias`)
 * com a observação anterior do mesmo produto no mesmo mercado. Só quedas entram. Ordenado pela maior queda.
 */
export function maioresQuedas(observacoes: ObservacaoPreco[], hoje: DataISO, janelaDias = 7): Oferta[] {
  const grupos = new Map<string, ObservacaoPreco[]>();
  for (const o of observacoes) {
    const chave = `${o.produtoId}|${o.mercadoId}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), o]);
  }
  const ofertas: Oferta[] = [];
  for (const lista of grupos.values()) {
    const ordenada = [...lista].sort((a, b) => b.data.localeCompare(a.data));
    const [ultima, anterior] = ordenada;
    if (!ultima || !anterior) continue;
    const idade = diasEntre(ultima.data, hoje);
    if (idade < 0 || idade > janelaDias) continue;
    if (ultima.valor >= anterior.valor) continue;
    ofertas.push({
      produtoId: ultima.produtoId,
      mercadoId: ultima.mercadoId,
      valorAnterior: anterior.valor,
      valorAtual: ultima.valor,
      variacao: variacaoPercentual(anterior.valor, ultima.valor),
      data: ultima.data,
    });
  }
  return ofertas.sort((a, b) => a.variacao - b.variacao);
}
