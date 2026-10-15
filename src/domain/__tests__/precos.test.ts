import { describe, expect, it } from "vitest";
import {
  indiceMercado,
  maioresQuedas,
  menorPrecoPorMes,
  posicaoNaFaixa,
  precoPorUnidade,
  precosAtuais,
  resumoPreco,
  variacaoPercentual,
} from "../precos";
import type { ObservacaoPreco } from "../tipos";

const HOJE = "2026-10-15";
const obs = (produtoId: string, mercadoId: string, valor: number, data: string): ObservacaoPreco => ({ produtoId, mercadoId, valor, data });

describe("precoPorUnidade", () => {
  it("divide o preço pela quantidade da embalagem", () => {
    expect(precoPorUnidade(2190, { quantidadeEmbalagem: 12 })).toBeCloseTo(182.5);
  });
  it("rejeita embalagem vazia", () => {
    expect(() => precoPorUnidade(100, { quantidadeEmbalagem: 0 })).toThrow();
  });
});

describe("variacaoPercentual", () => {
  it("calcula queda e alta", () => {
    expect(variacaoPercentual(2490, 2190)).toBeCloseTo(-0.1205, 3);
    expect(variacaoPercentual(1000, 1100)).toBeCloseTo(0.1);
  });
  it("não divide por zero", () => {
    expect(variacaoPercentual(0, 100)).toBe(0);
  });
});

describe("precosAtuais", () => {
  const observacoes = [
    obs("p1", "m1", 2500, "2026-10-01"),
    obs("p1", "m1", 2190, "2026-10-13"), // mais recente do m1
    obs("p1", "m2", 2340, "2026-10-14"),
    obs("p1", "m3", 1000, "2026-08-01"), // velho demais (> 30 dias)
    obs("p2", "m1", 999, "2026-10-14"), // outro produto
    obs("p1", "m4", 900, "2026-10-20"), // no futuro: ignorado
  ];
  it("pega a observação mais recente por mercado, dentro da validade, do mais barato ao mais caro", () => {
    const atuais = precosAtuais(observacoes, "p1", HOJE);
    expect(atuais.map((o) => [o.mercadoId, o.valor])).toEqual([
      ["m1", 2190],
      ["m2", 2340],
    ]);
  });
  it("resumoPreco traz menor, maior, média e economia", () => {
    const resumo = resumoPreco(precosAtuais(observacoes, "p1", HOJE))!;
    expect(resumo.menor.valor).toBe(2190);
    expect(resumo.maior.valor).toBe(2340);
    expect(resumo.media).toBe(2265);
    expect(resumo.economiaMaxima).toBe(150);
    expect(resumo.quantidadeMercados).toBe(2);
  });
  it("resumoPreco é undefined sem preços", () => {
    expect(resumoPreco([])).toBeUndefined();
  });
});

describe("posicaoNaFaixa", () => {
  it("vai de 0 (barato) a 1 (caro)", () => {
    expect(posicaoNaFaixa(2190, 2190, 2749)).toBe(0);
    expect(posicaoNaFaixa(2749, 2190, 2749)).toBe(1);
    expect(posicaoNaFaixa(2000, 2000, 2000)).toBe(0);
  });
});

describe("indiceMercado", () => {
  const observacoes = [
    obs("a", "barato", 900, "2026-10-10"),
    obs("a", "caro", 1100, "2026-10-10"),
    obs("b", "barato", 1800, "2026-10-10"),
    obs("b", "caro", 2200, "2026-10-10"),
    obs("c", "barato", 500, "2026-10-10"), // só um mercado: não entra
  ];
  it("100 = média da cidade; abaixo de 100 = mais barato", () => {
    expect(indiceMercado(observacoes, "barato", HOJE)).toBe(90);
    expect(indiceMercado(observacoes, "caro", HOJE)).toBe(110);
  });
  it("undefined para mercado sem preço", () => {
    expect(indiceMercado(observacoes, "nenhum", HOJE)).toBeUndefined();
  });
});

describe("menorPrecoPorMes", () => {
  it("agrupa por mês e pega o menor", () => {
    const r = menorPrecoPorMes(
      [obs("p", "m1", 2500, "2026-09-02"), obs("p", "m2", 2400, "2026-09-20"), obs("p", "m1", 2200, "2026-10-01")],
      "p",
    );
    expect(r).toEqual([
      { mes: "2026-09", valor: 2400 },
      { mes: "2026-10", valor: 2200 },
    ]);
  });
});

describe("maioresQuedas", () => {
  it("lista só quedas recentes, da maior para a menor", () => {
    const r = maioresQuedas(
      [
        obs("a", "m1", 1000, "2026-10-01"),
        obs("a", "m1", 800, "2026-10-14"), // −20%
        obs("b", "m1", 1000, "2026-10-01"),
        obs("b", "m1", 900, "2026-10-12"), // −10%
        obs("c", "m1", 1000, "2026-10-01"),
        obs("c", "m1", 1200, "2026-10-14"), // alta: fora
        obs("d", "m1", 1000, "2026-09-01"),
        obs("d", "m1", 500, "2026-09-20"), // queda antiga: fora
      ],
      HOJE,
    );
    expect(r.map((o) => o.produtoId)).toEqual(["a", "b"]);
    expect(r[0].variacao).toBeCloseTo(-0.2);
  });
});
