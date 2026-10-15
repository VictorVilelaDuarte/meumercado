import { diasEntre } from "./formato";
import { precosAtuais } from "./precos";
import type { AlertaPreco, Centavos, DataISO, Nota, ObservacaoPreco } from "./tipos";

/* ---------------- Despensa Digital ---------------- */

/** Fração do intervalo abaixo da qual o item aparece como "acabando". */
export const LIMIAR_ACABANDO = 0.2;

/** Intervalo médio, em dias, entre compras do mesmo produto. Precisa de pelo menos 2 compras. */
export function intervaloMedioCompra(datas: DataISO[]): number | undefined {
  const ordenadas = [...new Set(datas)].sort();
  if (ordenadas.length < 2) return undefined;
  let soma = 0;
  for (let i = 1; i < ordenadas.length; i++) soma += diasEntre(ordenadas[i - 1], ordenadas[i]);
  return soma / (ordenadas.length - 1);
}

export interface ItemDespensa {
  produtoId: string;
  intervaloDias: number;
  ultimaCompra: DataISO;
  diasRestantes: number;
  /** 1 = acabou de comprar, 0 = deve ter acabado. */
  nivel: number;
  acabando: boolean;
}

/** Estima o que está acabando a partir das notas do próprio usuário. Os que estão acabando vêm primeiro. */
export function estimarDespensa(notas: Nota[], hoje: DataISO): ItemDespensa[] {
  const compras = new Map<string, DataISO[]>();
  for (const n of notas) for (const i of n.itens) if (i.produtoId) compras.set(i.produtoId, [...(compras.get(i.produtoId) ?? []), n.data]);
  const itens: ItemDespensa[] = [];
  for (const [produtoId, datas] of compras) {
    const intervalo = intervaloMedioCompra(datas);
    if (intervalo === undefined || intervalo <= 0) continue;
    const ultimaCompra = [...datas].sort().at(-1)!;
    const passados = diasEntre(ultimaCompra, hoje);
    const diasRestantes = Math.max(0, Math.round(intervalo - passados));
    const nivel = Math.max(0, Math.min(1, 1 - passados / intervalo));
    itens.push({ produtoId, intervaloDias: Math.round(intervalo), ultimaCompra, diasRestantes, nivel, acabando: nivel <= LIMIAR_ACABANDO });
  }
  return itens.sort((a, b) => a.nivel - b.nivel || a.produtoId.localeCompare(b.produtoId));
}

/* ---------------- Alertas de preço ---------------- */

export interface EstadoAlerta {
  alerta: AlertaPreco;
  menorAtual?: ObservacaoPreco;
  atingiu: boolean;
  /** 0 = no preço inicial, 1 = chegou na meta. */
  progresso: number;
  faltam: Centavos;
}

export function avaliarAlerta(alerta: AlertaPreco, observacoes: ObservacaoPreco[], hoje: DataISO): EstadoAlerta {
  const menorAtual = precosAtuais(observacoes, alerta.produtoId, hoje)[0];
  if (!menorAtual) return { alerta, atingiu: false, progresso: 0, faltam: 0 };
  const atingiu = menorAtual.valor <= alerta.meta;
  const distanciaTotal = alerta.precoInicial - alerta.meta;
  const progresso = atingiu ? 1 : distanciaTotal <= 0 ? 0 : Math.max(0, Math.min(1, (alerta.precoInicial - menorAtual.valor) / distanciaTotal));
  return { alerta, menorAtual, atingiu, progresso, faltam: Math.max(0, menorAtual.valor - alerta.meta) };
}

/* ---------------- Pontos e níveis ---------------- */

export const PONTOS_POR_NOTA = 50;
/** Bônus por item cujo produto ainda não tinha preço naquele mercado. */
export const PONTOS_POR_PRECO_INEDITO = 5;

export const NIVEIS = [
  { nivel: 1, nome: "Iniciante", minimo: 0 },
  { nivel: 2, nome: "Curioso", minimo: 200 },
  { nivel: 3, nome: "Pesquisador", minimo: 500 },
  { nivel: 4, nome: "Caçador", minimo: 1000 },
  { nivel: 5, nome: "Mestre das ofertas", minimo: 1500 },
] as const;

export function nivelPorPontos(pontos: number) {
  const atual = [...NIVEIS].reverse().find((n) => pontos >= n.minimo) ?? NIVEIS[0];
  const proximo = NIVEIS.find((n) => n.minimo > pontos);
  const progresso = proximo ? (pontos - atual.minimo) / (proximo.minimo - atual.minimo) : 1;
  return { ...atual, proximo, faltam: proximo ? proximo.minimo - pontos : 0, progresso };
}

/** Pontos por uma nota: base + bônus por preço inédito (produto que o mercado ainda não tinha no sistema). */
export function pontosDaNota(nota: Nota, observacoesAnteriores: ObservacaoPreco[]): number {
  const conhecidos = new Set(observacoesAnteriores.filter((o) => o.mercadoId === nota.mercadoId).map((o) => o.produtoId));
  const ineditos = new Set(nota.itens.filter((i) => i.produtoId && !conhecidos.has(i.produtoId)).map((i) => i.produtoId));
  return PONTOS_POR_NOTA + ineditos.size * PONTOS_POR_PRECO_INEDITO;
}

/* ---------------- Desafio de Economia ---------------- */

/**
 * Economia percentual de um conjunto de notas: quanto se pagou abaixo da média da cidade nos mesmos produtos, na data de cada nota.
 * 0,074 = pagou 7,4% menos que a média. Itens sem comparação ficam fora.
 */
export function economiaPercentual(notas: Nota[], observacoes: ObservacaoPreco[]): number {
  let pago = 0;
  let medio = 0;
  for (const n of notas) {
    for (const i of n.itens) {
      if (!i.produtoId) continue;
      const atuais = precosAtuais(observacoes, i.produtoId, n.data);
      if (atuais.length === 0) continue;
      pago += i.valorUnitario * i.quantidade;
      medio += (atuais.reduce((s, o) => s + o.valor, 0) / atuais.length) * i.quantidade;
    }
  }
  if (medio === 0) return 0;
  return (medio - pago) / medio;
}

export function rankingDesafio(
  participantes: { usuarioId: string; nome: string; notas: Nota[] }[],
  observacoes: ObservacaoPreco[],
): { posicao: number; usuarioId: string; nome: string; economia: number }[] {
  return participantes
    .map((p) => ({ usuarioId: p.usuarioId, nome: p.nome, economia: economiaPercentual(p.notas, observacoes) }))
    .sort((a, b) => b.economia - a.economia || a.nome.localeCompare(b.nome))
    .map((p, i) => ({ posicao: i + 1, ...p }));
}
