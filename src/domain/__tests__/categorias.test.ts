import { describe, expect, it } from "vitest";
import { categoriaPorDescricao, categoriaPorNcm, classificar, normalizarDescricao } from "../categorias";

describe("categoriaPorNcm (prefixo mais longo vence)", () => {
  it.each([
    ["48181000", "Higiene"], // papel higiênico
    ["33051000", "Higiene"], // xampu
    ["02013000", "Açougue"], // carne bovina
    ["0202.30.00", "Açougue"], // aceita pontos
    ["07131000", "Mercearia"], // feijão vence o capítulo 07
    ["07020000", "Hortifrúti"], // tomate (capítulo 07)
    ["34011190", "Higiene"], // sabonete vence 3401
    ["34012000", "Limpeza"], // outros sabões
    ["34022000", "Limpeza"], // detergente
  ])("NCM %s → %s", (ncm, categoria) => {
    expect(categoriaPorNcm(ncm)).toBe(categoria);
  });
  it("NCM desconhecido ou vazio → undefined", () => {
    expect(categoriaPorNcm("99999999")).toBeUndefined();
    expect(categoriaPorNcm(undefined)).toBeUndefined();
  });
});

describe("categoriaPorDescricao", () => {
  it.each([
    ["PAP HIG NEVE FD 12X30", "Higiene"],
    ["SHAMP SEDA 325ML", "Higiene"],
    ["PICANHA BOV KG", "Açougue"],
    ["Feijão Carioca 1kg", "Mercearia"],
    ["MACARRAO ESPAGUETE", "Mercearia"],
    ["MACA GALA KG", "Hortifrúti"],
    ["DETERG LIQ 500ML", "Limpeza"],
  ])("%s → %s", (descricao, categoria) => {
    expect(categoriaPorDescricao(descricao)).toBe(categoria);
  });
});

describe("classificar", () => {
  it("prefere o NCM", () => {
    expect(classificar({ ncm: "48181000", descricao: "PICANHA" })).toEqual({ categoria: "Higiene", origem: "ncm", precisaRevisao: false });
  });
  it("usa a descrição quando não há NCM", () => {
    expect(classificar({ descricao: "PICANHA BOV" }).origem).toBe("descricao");
  });
  it("manda para revisão quando nada bate", () => {
    expect(classificar({ descricao: "KIT CHURR PREMIUM" })).toEqual({ categoria: "Outros", origem: "nenhuma", precisaRevisao: true });
  });
  it("normaliza acentos e espaços", () => {
    expect(normalizarDescricao("  Feijão   preto ")).toBe("FEIJAO PRETO");
  });
});
