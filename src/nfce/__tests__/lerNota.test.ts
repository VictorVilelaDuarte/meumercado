import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { classificar } from "@/domain/categorias";
import { centavosBr, ErroLeituraNota, lerNota, numeroBr, texto } from "../lerNota";

/** Notas reais de São José dos Campos, anonimizadas (docs/08-nfce.md). */
const NOTAS = ["tauste-colinas", "americanas-aquarius", "carrefour-serimbura-1", "carrefour-serimbura-2"] as const;
const fixture = (nome: string) => readFileSync(join(__dirname, "..", "__fixtures__", `${nome}.html`), "utf-8");
const completa = (nota: (typeof NOTAS)[number]) => lerNota(fixture(`${nota}-completa`));
const resumida = (nota: (typeof NOTAS)[number]) => lerNota(fixture(`${nota}-resumida`));

describe("números no formato brasileiro", () => {
  it("converte para centavos sem erro de float", () => {
    expect(centavosBr("32,8800000000")).toBe(3288);
    expect(centavosBr("16,6")).toBe(1660);
    expect(centavosBr("206,090")).toBe(20609);
    expect(centavosBr("1.234,56")).toBe(123456);
    expect(centavosBr("0,005")).toBe(1);
    expect(centavosBr("")).toBe(0);
  });

  it("lê quantidades com vírgula", () => {
    expect(numeroBr("0,3560")).toBe(0.356);
    expect(numeroBr("12")).toBe(12);
    expect(numeroBr("")).toBe(0);
  });

  it("tira tags e decodifica entidades", () => {
    expect(texto("<b>P&amp;G</b>\n  &#32;x &#xE9;")).toBe("P&G x é");
  });
});

describe("lerNota: página completa (Visualizar em Abas)", () => {
  it("Tauste: cabeçalho, mercado e totais", () => {
    const nota = completa("tauste-colinas");
    expect(nota.fonte).toBe("completa");
    expect(nota.chave).toBe("35261065897910001560650260000624591342950530");
    expect(nota).toMatchObject({ numero: "62459", serie: "26", data: "2026-10-20", hora: "13:45:26" });
    expect(nota.emitente).toEqual({
      cnpj: "65897910001560",
      razaoSocial: "TAUSTE SUPERMERCADOS LTDA",
      nomeFantasia: undefined,
      endereco: "AV. SAO JOAO, 2555",
      bairro: "JARDIM DAS COLINAS",
      municipio: "SAO JOSE DOS CAMPOS",
      uf: "SP",
      cep: "12242000",
    });
    expect(nota.itens).toHaveLength(22);
    expect(nota).toMatchObject({ valorProdutos: 21329, descontos: 720, valorPago: 20609 });
  });

  it("Tauste: item a granel sem EAN, item com EAN e item com desconto", () => {
    const { itens } = completa("tauste-colinas");
    expect(itens[0]).toEqual({
      numero: 1,
      descricao: "FILE FG TEMP BD",
      codigo: "102858",
      ean: undefined, // "SEM GTIN": pesado na loja
      ncm: "02071422",
      quantidade: 0.356,
      unidade: "KG",
      valorUnitario: 3288,
      valorTotal: 1171,
      desconto: 0,
    });
    expect(itens[2]).toMatchObject({ descricao: "FETT SEARA LEV BROC", ean: "7894904575794", ncm: "19022000" });
    expect(itens[12]).toMatchObject({ descricao: "AGUA MIN LIND VER CG", quantidade: 12, valorUnitario: 219, valorTotal: 2628, desconto: 720 });
  });

  it("Carrefour manda GTIN-14 com zero na frente: normalizamos para 13 dígitos", () => {
    const { itens } = completa("carrefour-serimbura-1");
    expect(itens[0]).toMatchObject({ descricao: "REFRIG FANTA GUARANA", ean: "7894900093001", ncm: "22021000", unidade: "un9" });
  });

  it("Americanas: nota de um item só", () => {
    const nota = completa("americanas-aquarius");
    expect(nota.emitente).toMatchObject({ cnpj: "00776574068117", razaoSocial: "americanas sa - 0550", bairro: "Jardim Aquarius", cep: "12246870" });
    expect(nota.itens).toEqual([
      expect.objectContaining({ descricao: "ENERG RED BULL POMELO 473ML", ean: "9002490297855", ncm: "22029900", valorTotal: 1599 }),
    ]);
    expect(nota.valorPago).toBe(1599);
  });

  it.each(NOTAS)("%s: todo item tem NCM e a soma dos itens bate com o total", (nome) => {
    const nota = completa(nome);
    expect(nota.itens.every((i) => i.ncm?.length === 8)).toBe(true);
    const soma = nota.itens.reduce((t, i) => t + i.valorTotal, 0);
    const descontos = nota.itens.reduce((t, i) => t + i.desconto, 0);
    expect(soma).toBe(nota.valorProdutos);
    expect(descontos).toBe(nota.descontos);
    expect(soma - descontos).toBe(nota.valorPago);
  });

  it.each(NOTAS)("%s: todo item ganha categoria pelo NCM, sem ir para revisão", (nome) => {
    const semCategoria = completa(nome).itens.filter((i) => classificar(i).origem !== "ncm").map((i) => `${i.ncm} ${i.descricao}`);
    expect(semCategoria).toEqual([]);
  });

  it("o NCM das notas reais categoriza sem IA", () => {
    const categorias = completa("carrefour-serimbura-2").itens.map((i) => classificar(i).categoria);
    expect(categorias).toEqual(["Açougue", "Laticínios", "Mercearia"]);
  });
});

describe("lerNota: página resumida (a que o QR Code abre)", () => {
  it("Tauste: lê itens e totais, sem EAN e sem NCM", () => {
    const nota = resumida("tauste-colinas");
    expect(nota.fonte).toBe("resumida");
    expect(nota.emitente).toMatchObject({ cnpj: "65897910001560", endereco: "AV. SAO JOAO, 2555", bairro: "JARDIM DAS COLINAS", municipio: "SAO JOSE DOS CAMPOS", uf: "SP" });
    expect(nota.itens[0]).toEqual({
      numero: 1,
      descricao: "FILE FG TEMP BD",
      codigo: "102858",
      quantidade: 0.356,
      unidade: "KG",
      valorUnitario: 3288,
      valorTotal: 1171,
      desconto: 0,
    });
    expect(nota).toMatchObject({ valorProdutos: 21329, descontos: 720, valorPago: 20609 });
  });

  it("sem linha de desconto, o total dos produtos é o valor pago", () => {
    expect(resumida("americanas-aquarius")).toMatchObject({ valorProdutos: 1599, descontos: 0, valorPago: 1599 });
  });

  it.each(NOTAS)("%s: resumida e completa concordam no que as duas mostram", (nome) => {
    const c = completa(nome);
    const r = resumida(nome);
    expect(r).toMatchObject({ chave: c.chave, numero: c.numero, serie: c.serie, data: c.data, hora: c.hora, valorPago: c.valorPago, descontos: c.descontos });
    expect(r.emitente).toMatchObject({ cnpj: c.emitente.cnpj, razaoSocial: c.emitente.razaoSocial, bairro: c.emitente.bairro });
    const essencial = ({ numero, descricao, codigo, quantidade, unidade, valorUnitario, valorTotal }: (typeof c.itens)[number]) => ({ numero, descricao, codigo, quantidade, unidade, valorUnitario, valorTotal });
    expect(r.itens.map(essencial)).toEqual(c.itens.map(essencial));
  });
});

describe("lerNota: páginas que não são nota", () => {
  it("captcha da Sefaz dá erro claro", () => {
    expect(() => lerNota("<html><body>Consulta Pública Digite os caracteres da imagem ao lado</body></html>")).toThrow(/captcha/);
  });

  it("qualquer outra página dá erro", () => {
    expect(() => lerNota("<html><body>Olá</body></html>")).toThrow(ErroLeituraNota);
  });

  it("página completa sem itens dá erro", () => {
    const semItens = fixture("americanas-aquarius-completa").replaceAll('<table class="toggle box">', "<table>");
    expect(() => lerNota(semItens)).toThrow(/não tem itens/);
  });
});
