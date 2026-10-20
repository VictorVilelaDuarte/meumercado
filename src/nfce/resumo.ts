import { classificar } from "@/domain/categorias";
import type { Categoria, Centavos } from "@/domain/tipos";
import type { ItemLido, NotaLida } from "./tipos";

/** O que a tela de escanear mostra logo depois de ler a nota. Função pura, testada em __tests__/resumo.test.ts. */
export interface ResumoNota {
  itens: (ItemLido & { categoria: Categoria; precisaRevisao: boolean; valorPago: Centavos })[];
  /** Itens com código de barras: são os que casam sozinhos entre mercados. */
  comEan: number;
  /** Itens que o administrador vai precisar categorizar. */
  paraRevisao: number;
  /** Gasto por categoria (já com desconto), da maior para a menor. */
  porCategoria: { categoria: Categoria; valor: Centavos }[];
}

export function resumirNota(nota: NotaLida): ResumoNota {
  const itens = nota.itens.map((item) => {
    const { categoria, precisaRevisao } = classificar(item);
    return { ...item, categoria, precisaRevisao, valorPago: item.valorTotal - item.desconto };
  });
  const somas = new Map<Categoria, Centavos>();
  for (const item of itens) somas.set(item.categoria, (somas.get(item.categoria) ?? 0) + item.valorPago);
  return {
    itens,
    comEan: itens.filter((i) => i.ean).length,
    paraRevisao: itens.filter((i) => i.precisaRevisao).length,
    porCategoria: [...somas].map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor),
  };
}
