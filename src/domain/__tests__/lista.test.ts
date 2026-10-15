import { describe, expect, it } from "vitest";
import { calcularLista } from "../lista";
import type { ItemLista, ObservacaoPreco } from "../tipos";

const HOJE = "2026-10-15";
const obs = (produtoId: string, mercadoId: string, valor: number): ObservacaoPreco => ({ produtoId, mercadoId, valor, data: "2026-10-10" });
const item = (produtoId: string, quantidade = 1, comprado = false): ItemLista => ({ produtoId, quantidade, comprado });

describe("calcularLista", () => {
  const observacoes = [
    obs("cafe", "A", 1800),
    obs("cafe", "B", 2000),
    obs("papel", "A", 2500),
    obs("papel", "B", 2100),
    obs("arroz", "A", 2400),
    obs("arroz", "B", 2600),
    obs("arroz", "C", 2000), // C só tem arroz
  ];

  it("escolhe o mercado único mais barato entre os que têm todos os itens", () => {
    const r = calcularLista([item("cafe"), item("papel"), item("arroz")], observacoes, HOJE);
    // A = 1800+2500+2400 = 6700; B = 2000+2100+2600 = 6700 → empate, desempata pelo id
    expect(r.melhorUnico?.mercadoIds).toEqual(["A"]);
    expect(r.melhorUnico?.total).toBe(6700);
    expect(r.porMercado.map((o) => o.mercadoIds[0])).toEqual(["A", "B"]);
  });

  it("acha a melhor combinação de dois mercados e diz onde comprar cada item", () => {
    const r = calcularLista([item("cafe"), item("papel"), item("arroz")], observacoes, HOJE);
    // A+B = café A 1800 + papel B 2100 + arroz A 2400 = 6300
    // A+C = café A 1800 + papel A 2500 + arroz C 2000 = 6300
    // B+C = café B 2000 + papel B 2100 + arroz C 2000 = 6100 ← melhor
    expect(r.melhorCombinacao?.mercadoIds).toEqual(["B", "C"]);
    expect(r.melhorCombinacao?.total).toBe(6100);
    expect(r.melhorCombinacao?.atribuicao).toEqual({ cafe: "B", papel: "B", arroz: "C" });
  });

  it("multiplica pela quantidade", () => {
    const r = calcularLista([item("cafe", 3)], observacoes, HOJE);
    expect(r.melhorUnico?.total).toBe(5400);
  });

  it("ignora itens já comprados e separa os sem preço", () => {
    const r = calcularLista([item("cafe"), item("papel", 1, true), item("feijao")], observacoes, HOJE);
    expect(r.semPreco).toEqual(["feijao"]);
    expect(r.melhorUnico?.total).toBe(1800);
  });

  it("não sugere combinação quando um mercado só já é o melhor", () => {
    const r = calcularLista([item("cafe")], observacoes, HOJE);
    expect(r.melhorCombinacao).toBeUndefined();
  });

  it("calcula o total pela média da cidade para mostrar a economia", () => {
    const r = calcularLista([item("cafe")], observacoes, HOJE);
    expect(r.totalMedioCidade).toBe(1900);
  });
});
