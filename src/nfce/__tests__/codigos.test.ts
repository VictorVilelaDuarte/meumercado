import { describe, expect, it } from "vitest";
import { chaveValida, desmontarChave, digitoChave, eanValido, lerQrCode, normalizarEan, URL_QR_CODE_SP } from "../codigos";

const CHAVE_TAUSTE = "35261065897910001560650260000624591342950530";
const P_TAUSTE = `${CHAVE_TAUSTE}|2|1|1|0AAFEBCA217E9112FED1FC289DB2ECF1E95624BD`;

describe("chave de acesso", () => {
  it("confere o dígito verificador (módulo 11)", () => {
    expect(digitoChave(CHAVE_TAUSTE.slice(0, 43))).toBe(0);
    expect(chaveValida(CHAVE_TAUSTE)).toBe(true);
    expect(chaveValida("35261000776574068117653070001660511852732291")).toBe(true);
    expect(chaveValida(CHAVE_TAUSTE.slice(0, 43) + "1")).toBe(false);
    expect(chaveValida("123")).toBe(false);
  });

  it("desmonta UF, mês, CNPJ, modelo, série e número", () => {
    expect(desmontarChave(CHAVE_TAUSTE)).toEqual({ uf: "35", anoMes: "2026-10", cnpj: "65897910001560", modelo: "65", serie: "26", numero: "62459" });
    expect(() => desmontarChave("1".repeat(44))).toThrow();
  });
});

describe("lerQrCode", () => {
  it("aceita o link com %7C e devolve um link refeito no endereço da Sefaz", () => {
    const qr = lerQrCode(`${URL_QR_CODE_SP}?p=${P_TAUSTE.replaceAll("|", "%7C")}`);
    expect(qr.chave).toBe(CHAVE_TAUSTE);
    expect(qr.url).toBe(`${URL_QR_CODE_SP}?p=${P_TAUSTE.replaceAll("|", "%7C")}`);
  });

  it("aceita o texto cru do QR Code, com | e espaços em volta", () => {
    expect(lerQrCode(`  ${URL_QR_CODE_SP}?p=${P_TAUSTE}\n`).chave).toBe(CHAVE_TAUSTE);
  });

  it("recusa outros sites, mesmo com a chave certa", () => {
    expect(() => lerQrCode(`https://exemplo.com/ConsultaQRCode.aspx?p=${P_TAUSTE}`)).toThrow(/São Paulo/);
    expect(() => lerQrCode(`https://www.nfce.fazenda.sp.gov.br.exemplo.com/x?p=${P_TAUSTE}`)).toThrow(/São Paulo/);
  });

  it("recusa texto que não é link, link sem chave e chave com dígito errado", () => {
    expect(() => lerQrCode("oi")).toThrow(/link/);
    expect(() => lerQrCode(`${URL_QR_CODE_SP}?p=123|2|1|1|AB`)).toThrow(/chave/);
    expect(() => lerQrCode(`${URL_QR_CODE_SP}?p=${CHAVE_TAUSTE.slice(0, 43)}1|2|1|1|AB`)).toThrow(/dígito/);
  });

  it("recusa parâmetros com caracteres estranhos", () => {
    expect(() => lerQrCode(`${URL_QR_CODE_SP}?p=${CHAVE_TAUSTE}|2|1|1|AB%26x%3D1`)).toThrow(/incompleto/);
  });
});

describe("EAN", () => {
  it("valida o dígito verificador", () => {
    expect(eanValido("7894904575794")).toBe(true);
    expect(eanValido("07894900093001")).toBe(true);
    expect(eanValido("7894904575795")).toBe(false);
    expect(eanValido("SEM GTIN")).toBe(false);
    expect(eanValido("0000000000000")).toBe(false);
  });

  it("normaliza GTIN-14 e UPC-12 para 13 dígitos", () => {
    expect(normalizarEan("07894900093001")).toBe("7894900093001");
    expect(normalizarEan("7894904575794")).toBe("7894904575794");
    expect(normalizarEan("036000291452")).toBe("0036000291452");
    expect(normalizarEan("SEM GTIN")).toBeUndefined();
    expect(normalizarEan(undefined)).toBeUndefined();
  });
});
