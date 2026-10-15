import { indiceMercado, maioresQuedas, precoPorUnidade, precosAtuais, resumoPreco } from "@/domain/precos";
import type { Produto } from "@/domain/tipos";
import { repositorio } from "./repositorio";

/**
 * Consultas prontas para as telas: juntam dados do repositório com as regras do domínio.
 * Ficam aqui para que várias telas mostrem exatamente o mesmo número (ex.: índice do mercado no Início e no Mapa).
 */

export function nomeMercado(id: string): string {
  return repositorio.mercado(id)?.nome ?? id;
}

export function resumoDoProduto(produto: Produto) {
  const hoje = repositorio.hoje();
  const atuais = precosAtuais(repositorio.observacoes(), produto.id, hoje);
  const resumo = resumoPreco(atuais);
  return {
    produto,
    atuais,
    resumo,
    porUnidadeMenor: resumo ? precoPorUnidade(resumo.menor.valor, produto) : undefined,
  };
}

/** Mercados com índice de preço (100 = média da cidade), do mais barato para o mais caro. */
export function rankingMercados() {
  const hoje = repositorio.hoje();
  const observacoes = repositorio.observacoes();
  return repositorio
    .mercados()
    .map((mercado) => {
      const doMercado = observacoes.filter((o) => o.mercadoId === mercado.id);
      const ultima = doMercado.map((o) => o.data).sort().at(-1);
      return {
        mercado,
        indice: indiceMercado(observacoes, mercado.id, hoje),
        produtosComPreco: new Set(doMercado.map((o) => o.produtoId)).size,
        coletas: new Set(doMercado.map((o) => o.data)).size,
        ultimaColeta: ultima,
      };
    })
    .sort((a, b) => (a.indice ?? 999) - (b.indice ?? 999));
}

export function ofertasDaSemana() {
  return maioresQuedas(repositorio.observacoes(), repositorio.hoje()).map((o) => ({
    ...o,
    produto: repositorio.produto(o.produtoId)!,
    mercado: repositorio.mercado(o.mercadoId)!,
  }));
}
