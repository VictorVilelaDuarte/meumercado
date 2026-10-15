import { mediaCidade, precosAtuais } from "./precos";
import type { Centavos, DataISO, ItemLista, ObservacaoPreco } from "./tipos";

export interface OpcaoCompra {
  /** 1 ou 2 mercados. */
  mercadoIds: string[];
  total: Centavos;
  /** Em qual mercado comprar cada produto. */
  atribuicao: Record<string, string>;
}

export interface ResultadoLista {
  /** Melhor opção em um só mercado (entre os que têm todos os itens). */
  melhorUnico?: OpcaoCompra;
  /** Melhor combinação de até dois mercados. Só aparece se for mais barata que a opção única. */
  melhorCombinacao?: OpcaoCompra;
  /** Cada opção de mercado único, da mais barata para a mais cara. */
  porMercado: OpcaoCompra[];
  /** Soma dos preços médios da cidade, para mostrar a economia. */
  totalMedioCidade: number;
  /** Produtos sem nenhum preço atual na cidade; ficam fora do cálculo. */
  semPreco: string[];
}

/**
 * Calcula onde a lista sai mais barata.
 *
 * Regras (ver docs/02-dominio.md, "Lista de compras"):
 * - Itens já comprados e produtos sem preço atual ficam fora.
 * - Um mercado só concorre como opção única se tiver preço para TODOS os itens restantes.
 * - A combinação de dois mercados pega, para cada item, o mais barato entre os dois; também precisa cobrir todos os itens.
 * - Empates são resolvidos pelo id do mercado, para o resultado ser sempre o mesmo.
 */
export function calcularLista(itens: ItemLista[], observacoes: ObservacaoPreco[], hoje: DataISO): ResultadoLista {
  const pendentes = itens.filter((i) => !i.comprado);
  const precos = new Map<string, Map<string, Centavos>>(); // produto → mercado → valor
  const semPreco: string[] = [];
  let totalMedioCidade = 0;

  for (const item of pendentes) {
    const atuais = precosAtuais(observacoes, item.produtoId, hoje);
    if (atuais.length === 0) {
      semPreco.push(item.produtoId);
      continue;
    }
    precos.set(item.produtoId, new Map(atuais.map((o) => [o.mercadoId, o.valor])));
    totalMedioCidade += (mediaCidade(observacoes, item.produtoId, hoje) ?? 0) * item.quantidade;
  }

  const itensComPreco = pendentes.filter((i) => precos.has(i.produtoId));
  const mercados = [...new Set([...precos.values()].flatMap((m) => [...m.keys()]))].sort();

  const custo = (ids: string[]): OpcaoCompra | undefined => {
    let total = 0;
    const atribuicao: Record<string, string> = {};
    for (const item of itensComPreco) {
      const doProduto = precos.get(item.produtoId)!;
      let melhor: { id: string; valor: Centavos } | undefined;
      for (const id of ids) {
        const valor = doProduto.get(id);
        if (valor !== undefined && (!melhor || valor < melhor.valor)) melhor = { id, valor };
      }
      if (!melhor) return undefined;
      total += melhor.valor * item.quantidade;
      atribuicao[item.produtoId] = melhor.id;
    }
    // Um par em que um mercado não recebe nenhum item é, na prática, opção única.
    const usados = [...new Set(Object.values(atribuicao))].sort();
    return { mercadoIds: usados, total: Math.round(total), atribuicao };
  };

  const porMercado = mercados
    .map((id) => custo([id]))
    .filter((o): o is OpcaoCompra => o !== undefined)
    .sort((a, b) => a.total - b.total || a.mercadoIds[0].localeCompare(b.mercadoIds[0]));

  let melhorCombinacao: OpcaoCompra | undefined;
  for (let i = 0; i < mercados.length; i++) {
    for (let j = i + 1; j < mercados.length; j++) {
      const opcao = custo([mercados[i], mercados[j]]);
      if (!opcao || opcao.mercadoIds.length < 2) continue;
      if (!melhorCombinacao || opcao.total < melhorCombinacao.total) melhorCombinacao = opcao;
    }
  }

  const melhorUnico = porMercado[0];
  if (melhorCombinacao && melhorUnico && melhorCombinacao.total >= melhorUnico.total) melhorCombinacao = undefined;

  return { melhorUnico, melhorCombinacao, porMercado, totalMedioCidade: Math.round(totalMedioCidade), semPreco };
}
