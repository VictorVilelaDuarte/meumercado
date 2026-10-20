import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lerNota } from "../lerNota";
import { resumirNota } from "../resumo";

const nota = (nome: string) => lerNota(readFileSync(join(__dirname, "..", "__fixtures__", `${nome}.html`), "utf-8"));

describe("resumirNota", () => {
  it("Tauste completa: conta EAN, categoriza e soma por categoria com desconto", () => {
    const resumo = resumirNota(nota("tauste-colinas-completa"));
    expect(resumo.itens).toHaveLength(22);
    expect(resumo.comEan).toBe(18); // 4 itens a granel vêm "SEM GTIN"
    expect(resumo.paraRevisao).toBe(0);
    expect(resumo.porCategoria.reduce((t, c) => t + c.valor, 0)).toBe(20609);
    expect(resumo.porCategoria[0]).toEqual({ categoria: "Mercearia", valor: 8044 });
    expect(resumo.porCategoria.find((c) => c.categoria === "Bebidas")?.valor).toBe(5787); // água já com R$ 7,20 de desconto
    expect(resumo.itens[12]).toMatchObject({ valorTotal: 2628, desconto: 720, valorPago: 1908 });
  });

  it("resumida: sem NCM a categoria sai da descrição e o que sobra vai para revisão", () => {
    const resumo = resumirNota(nota("carrefour-serimbura-1-resumida"));
    expect(resumo.comEan).toBe(0);
    expect(resumo.itens.find((i) => i.descricao === "REFRIG FANTA GUARANA")?.categoria).toBe("Bebidas");
    expect(resumo.paraRevisao).toBeGreaterThan(0);
  });
});
