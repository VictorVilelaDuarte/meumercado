import { describe, expect, it } from "vitest";
import {
  PONTOS_POR_NOTA,
  PONTOS_POR_PRECO_INEDITO,
  avaliarAlerta,
  economiaPercentual,
  estimarDespensa,
  intervaloMedioCompra,
  nivelPorPontos,
  pontosDaNota,
  rankingDesafio,
} from "../engajamento";
import type { AlertaPreco, Nota, ObservacaoPreco } from "../tipos";

const HOJE = "2026-10-15";
const nota = (data: string, itens: Nota["itens"], mercadoId = "A"): Nota => ({ id: data, usuarioId: "u", mercadoId, data, itens });
const cafe = (valorUnitario = 1800): Nota["itens"][number] => ({ descricaoOriginal: "CAFE", produtoId: "cafe", quantidade: 1, valorUnitario });

describe("despensa", () => {
  it("intervaloMedioCompra precisa de duas compras", () => {
    expect(intervaloMedioCompra(["2026-10-01"])).toBeUndefined();
    expect(intervaloMedioCompra(["2026-09-01", "2026-09-13", "2026-09-25"])).toBe(12);
  });
  it("marca como acabando quando passou ~80% do intervalo", () => {
    const notas = [nota("2026-09-10", [cafe()]), nota("2026-09-22", [cafe()]), nota("2026-10-04", [cafe()])];
    const [item] = estimarDespensa(notas, HOJE); // intervalo 12, passaram 11
    expect(item).toMatchObject({ produtoId: "cafe", intervaloDias: 12, diasRestantes: 1, acabando: true });
  });
});

describe("alertas", () => {
  const alerta: AlertaPreco = { id: "a", usuarioId: "u", produtoId: "cafe", meta: 1900, precoInicial: 2300, ativo: true };
  it("calcula progresso até a meta", () => {
    const r = avaliarAlerta(alerta, [{ produtoId: "cafe", mercadoId: "A", valor: 2100, data: "2026-10-14" }], HOJE);
    expect(r.atingiu).toBe(false);
    expect(r.progresso).toBeCloseTo(0.5);
    expect(r.faltam).toBe(200);
  });
  it("atinge quando o menor preço chega na meta", () => {
    const r = avaliarAlerta(alerta, [{ produtoId: "cafe", mercadoId: "A", valor: 1849, data: "2026-10-14" }], HOJE);
    expect(r).toMatchObject({ atingiu: true, progresso: 1, faltam: 0 });
  });
});

describe("pontos e níveis", () => {
  it("nível pelo total de pontos, com quanto falta para o próximo", () => {
    expect(nivelPorPontos(0)).toMatchObject({ nivel: 1, faltam: 200 });
    expect(nivelPorPontos(1240)).toMatchObject({ nivel: 4, nome: "Caçador", faltam: 260 });
    expect(nivelPorPontos(9999)).toMatchObject({ nivel: 5, faltam: 0, progresso: 1 });
  });
  it("nota vale pontos base + bônus por preço inédito naquele mercado", () => {
    const anteriores: ObservacaoPreco[] = [{ produtoId: "cafe", mercadoId: "A", valor: 1800, data: "2026-10-01" }];
    const n = nota("2026-10-14", [cafe(), { descricaoOriginal: "ARROZ", produtoId: "arroz", quantidade: 1, valorUnitario: 2400 }]);
    expect(pontosDaNota(n, anteriores)).toBe(PONTOS_POR_NOTA + PONTOS_POR_PRECO_INEDITO);
  });
});

describe("desafio de economia", () => {
  const observacoes: ObservacaoPreco[] = [
    { produtoId: "cafe", mercadoId: "A", valor: 1800, data: "2026-10-10" },
    { produtoId: "cafe", mercadoId: "B", valor: 2200, data: "2026-10-10" },
  ];
  it("economiaPercentual compara o que pagou com a média da cidade", () => {
    expect(economiaPercentual([nota("2026-10-12", [cafe(1800)])], observacoes)).toBeCloseTo(0.1);
  });
  it("ranking ordena da maior economia para a menor", () => {
    const r = rankingDesafio(
      [
        { usuarioId: "x", nome: "Xis", notas: [nota("2026-10-12", [cafe(2200)])] },
        { usuarioId: "y", nome: "Ypsilon", notas: [nota("2026-10-12", [cafe(1800)])] },
      ],
      observacoes,
    );
    expect(r.map((p) => [p.posicao, p.usuarioId])).toEqual([
      [1, "y"],
      [2, "x"],
    ]);
  });
});
