import { precosAtuais } from "./precos";
import type { Categoria, Centavos, DataISO, Nota, ObservacaoPreco, Produto } from "./tipos";

/**
 * Cálculos da aba "Meus gastos". Tudo aqui recebe só as notas do PRÓPRIO usuário:
 * quem chama é responsável por nunca misturar notas de outras pessoas (ver docs/02-dominio.md, "Privacidade").
 */

export function totalNota(nota: Nota): Centavos {
  return nota.itens.reduce((s, i) => s + Math.round(i.valorUnitario * i.quantidade), 0);
}

/** Total gasto por mês (AAAA-MM), em ordem cronológica. */
export function totalPorMes(notas: Nota[]): { mes: string; total: Centavos }[] {
  const porMes = new Map<string, Centavos>();
  for (const n of notas) {
    const mes = n.data.slice(0, 7);
    porMes.set(mes, (porMes.get(mes) ?? 0) + totalNota(n));
  }
  return [...porMes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mes, total]) => ({ mes, total }));
}

/** Total por categoria nas notas dadas, do maior para o menor. Itens sem produto casado contam como "Outros". */
export function totalPorCategoria(notas: Nota[], produtos: Produto[]): { categoria: Categoria; total: Centavos; fracao: number }[] {
  const categoriaDe = new Map(produtos.map((p) => [p.id, p.categoria]));
  const porCategoria = new Map<Categoria, Centavos>();
  let geral = 0;
  for (const n of notas) {
    for (const i of n.itens) {
      const categoria = (i.produtoId && categoriaDe.get(i.produtoId)) || "Outros";
      const valor = Math.round(i.valorUnitario * i.quantidade);
      porCategoria.set(categoria, (porCategoria.get(categoria) ?? 0) + valor);
      geral += valor;
    }
  }
  return [...porCategoria.entries()]
    .map(([categoria, total]) => ({ categoria, total, fracao: geral === 0 ? 0 : total / geral }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Quanto a pessoa teria economizado comprando cada item pelo menor preço da cidade NA DATA da nota.
 * Itens sem produto casado ou sem preço de comparação são ignorados.
 */
export function economiaPerdida(notas: Nota[], observacoes: ObservacaoPreco[]): Centavos {
  let economia = 0;
  for (const n of notas) {
    for (const i of n.itens) {
      if (!i.produtoId) continue;
      const menor = precosAtuais(observacoes, i.produtoId, n.data)[0];
      if (!menor || menor.valor >= i.valorUnitario) continue;
      economia += (i.valorUnitario - menor.valor) * i.quantidade;
    }
  }
  return Math.round(economia);
}

/**
 * Inflação pessoal (índice de Laspeyres): quanto custaria hoje a cesta que a pessoa comprou no período base.
 * Usa só produtos comprados nos dois períodos. Retorna a variação (0,041 = +4,1%) ou `undefined` sem produtos em comum.
 */
export function inflacaoPessoal(
  notas: Nota[],
  base: { de: DataISO; ate: DataISO },
  atual: { de: DataISO; ate: DataISO },
): number | undefined {
  const resumo = (de: DataISO, ate: DataISO) => {
    const m = new Map<string, { quantidade: number; gasto: number }>();
    for (const n of notas) {
      if (n.data < de || n.data > ate) continue;
      for (const i of n.itens) {
        if (!i.produtoId) continue;
        const atualItem = m.get(i.produtoId) ?? { quantidade: 0, gasto: 0 };
        atualItem.quantidade += i.quantidade;
        atualItem.gasto += i.valorUnitario * i.quantidade;
        m.set(i.produtoId, atualItem);
      }
    }
    return m;
  };
  const b = resumo(base.de, base.ate);
  const a = resumo(atual.de, atual.ate);
  let custoBase = 0;
  let custoAtual = 0;
  for (const [produtoId, itemBase] of b) {
    const itemAtual = a.get(produtoId);
    if (!itemAtual) continue;
    const precoMedioAtual = itemAtual.gasto / itemAtual.quantidade;
    custoBase += itemBase.gasto;
    custoAtual += precoMedioAtual * itemBase.quantidade;
  }
  if (custoBase === 0) return undefined;
  return custoAtual / custoBase - 1;
}

export interface ComparacaoItem {
  item: Nota["itens"][number];
  mediaCidade?: number;
  /** (pago - média) / média. Negativo = pagou menos que a média. */
  diferenca?: number;
  rotulo: "abaixo" | "acima" | "na_media" | "sem_comparacao";
}

/** Faixa em que a diferença conta como "na média". */
export const TOLERANCIA_MEDIA = 0.02;

/** Compara cada item da nota com a média da cidade na data da nota. Usado na tela de detalhe da nota. */
export function compararItensComMedia(nota: Nota, observacoes: ObservacaoPreco[]): ComparacaoItem[] {
  return nota.itens.map((item) => {
    if (!item.produtoId) return { item, rotulo: "sem_comparacao" };
    const outros = precosAtuais(
      observacoes.filter((o) => o.mercadoId !== nota.mercadoId || o.data !== nota.data),
      item.produtoId,
      nota.data,
    );
    if (outros.length === 0) return { item, rotulo: "sem_comparacao" };
    const media = outros.reduce((s, o) => s + o.valor, 0) / outros.length;
    const diferenca = (item.valorUnitario - media) / media;
    const rotulo = diferenca < -TOLERANCIA_MEDIA ? "abaixo" : diferenca > TOLERANCIA_MEDIA ? "acima" : "na_media";
    return { item, mediaCidade: media, diferenca, rotulo };
  });
}
