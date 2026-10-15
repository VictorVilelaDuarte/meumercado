import { describe, expect, it } from "vitest";
import { compararItensComMedia, economiaPerdida, inflacaoPessoal, totalNota, totalPorCategoria, totalPorMes } from "../gastos";
import type { Nota, ObservacaoPreco, Produto } from "../tipos";

const produtos: Produto[] = [
  { id: "papel", nome: "Papel", categoria: "Higiene", unidadeMedida: "rolo", quantidadeEmbalagem: 12 },
  { id: "carne", nome: "Carne", categoria: "Açougue", unidadeMedida: "kg", quantidadeEmbalagem: 1 },
];

const nota = (id: string, data: string, itens: Nota["itens"], mercadoId = "A"): Nota => ({ id, usuarioId: "u1", mercadoId, data, itens });

const notas = [
  nota("n1", "2026-09-10", [
    { descricaoOriginal: "PAP HIG", produtoId: "papel", quantidade: 1, valorUnitario: 2500 },
    { descricaoOriginal: "CARNE", produtoId: "carne", quantidade: 1.5, valorUnitario: 4000 },
  ]),
  nota("n2", "2026-10-10", [
    { descricaoOriginal: "PAP HIG", produtoId: "papel", quantidade: 2, valorUnitario: 2200 },
    { descricaoOriginal: "KIT CHURR", quantidade: 1, valorUnitario: 1000 },
  ]),
];

describe("totais", () => {
  it("totalNota multiplica quantidade (inclusive fracionada) e soma", () => {
    expect(totalNota(notas[0])).toBe(2500 + 6000);
  });
  it("totalPorMes em ordem cronológica", () => {
    expect(totalPorMes(notas)).toEqual([
      { mes: "2026-09", total: 8500 },
      { mes: "2026-10", total: 5400 },
    ]);
  });
  it("totalPorCategoria do maior para o menor, sem produto vira Outros", () => {
    const r = totalPorCategoria(notas, produtos);
    expect(r.map((c) => [c.categoria, c.total])).toEqual([
      ["Higiene", 6900],
      ["Açougue", 6000],
      ["Outros", 1000],
    ]);
    expect(r.reduce((s, c) => s + c.fracao, 0)).toBeCloseTo(1);
  });
});

describe("economiaPerdida", () => {
  it("soma a diferença para o menor preço da cidade na data da nota", () => {
    const observacoes: ObservacaoPreco[] = [{ produtoId: "papel", mercadoId: "B", valor: 2000, data: "2026-10-05" }];
    // n2: papel 2 × (2200 − 2000) = 400. n1: em 10/09 não havia preço de comparação.
    expect(economiaPerdida(notas, observacoes)).toBe(400);
  });
});

describe("inflacaoPessoal", () => {
  it("compara a cesta do período base com os preços do período atual", () => {
    const r = inflacaoPessoal(notas, { de: "2026-09-01", ate: "2026-09-30" }, { de: "2026-10-01", ate: "2026-10-31" });
    // só papel aparece nos dois: 2500 → 2200 = −12%
    expect(r).toBeCloseTo(-0.12);
  });
  it("undefined sem produtos em comum", () => {
    expect(inflacaoPessoal(notas, { de: "2025-01-01", ate: "2025-01-31" }, { de: "2026-10-01", ate: "2026-10-31" })).toBeUndefined();
  });
});

describe("compararItensComMedia", () => {
  it("marca abaixo, acima e sem comparação", () => {
    const observacoes: ObservacaoPreco[] = [
      { produtoId: "papel", mercadoId: "B", valor: 2400, data: "2026-10-05" },
      { produtoId: "carne", mercadoId: "B", valor: 3000, data: "2026-10-05" },
    ];
    const n = nota("n3", "2026-10-10", [
      { descricaoOriginal: "PAP", produtoId: "papel", quantidade: 1, valorUnitario: 2200 },
      { descricaoOriginal: "CARNE", produtoId: "carne", quantidade: 1, valorUnitario: 3300 },
      { descricaoOriginal: "KIT", quantidade: 1, valorUnitario: 1000 },
    ]);
    expect(compararItensComMedia(n, observacoes).map((c) => c.rotulo)).toEqual(["abaixo", "acima", "sem_comparacao"]);
  });
});
