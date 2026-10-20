/**
 * Regras dos códigos que aparecem na NFC-e: chave de acesso, link do QR Code e EAN (GTIN).
 * Funções puras; testes em src/nfce/__tests__/codigos.test.ts.
 */

/** Único endereço que o app aceita consultar (evita usar o servidor para abrir links de terceiros). */
export const HOST_SEFAZ_SP = "www.nfce.fazenda.sp.gov.br";
export const URL_QR_CODE_SP = `https://${HOST_SEFAZ_SP}/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx`;

export class ErroCodigoNota extends Error {}

/** Dígito verificador módulo 11 da chave de acesso (pesos 2 a 9, da direita para a esquerda). */
export function digitoChave(primeiros43: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = primeiros43.length - 1; i >= 0; i--) {
    soma += Number(primeiros43[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function chaveValida(chave: string): boolean {
  return /^\d{44}$/.test(chave) && digitoChave(chave.slice(0, 43)) === Number(chave[43]);
}

export interface PartesChave {
  /** Código IBGE da UF (35 = SP). */
  uf: string;
  /** "2026-10" */
  anoMes: string;
  cnpj: string;
  /** 65 = NFC-e. */
  modelo: string;
  serie: string;
  numero: string;
}

/** 35 2610 65897910001560 65 026 000062459 1 34295053 0 → UF, ano/mês, CNPJ, modelo, série, número. */
export function desmontarChave(chave: string): PartesChave {
  if (!chaveValida(chave)) throw new ErroCodigoNota("Chave de acesso inválida.");
  return {
    uf: chave.slice(0, 2),
    anoMes: `20${chave.slice(2, 4)}-${chave.slice(4, 6)}`,
    cnpj: chave.slice(6, 20),
    modelo: chave.slice(20, 22),
    serie: String(Number(chave.slice(22, 25))),
    numero: String(Number(chave.slice(25, 34))),
  };
}

export interface QrCodeNota {
  chave: string;
  /** Link refeito por nós, sempre no endereço da Sefaz-SP. */
  url: string;
}

/**
 * Lê o texto do QR Code (ou o link colado) e devolve a chave e um link seguro para consultar.
 * Aceita o "|" cru ou codificado (%7C). Recusa outros sites, outros estados e chaves com dígito errado.
 */
export function lerQrCode(texto: string): QrCodeNota {
  let url: URL;
  try {
    url = new URL(texto.trim());
  } catch {
    throw new ErroCodigoNota("Isso não parece o link do QR Code da nota.");
  }
  if (url.hostname.toLowerCase() !== HOST_SEFAZ_SP && url.hostname.toLowerCase() !== HOST_SEFAZ_SP.replace(/^www\./, "")) {
    throw new ErroCodigoNota("Por enquanto só lemos notas de São Paulo (Sefaz-SP).");
  }
  const p = url.searchParams.get("p") ?? "";
  const partes = p.split("|");
  const chave = partes[0] ?? "";
  if (partes.length < 5 || !/^\d{44}$/.test(chave)) throw new ErroCodigoNota("O link não traz a chave da nota.");
  if (!chaveValida(chave)) throw new ErroCodigoNota("A chave da nota está com um dígito errado. Escaneie de novo.");
  if (!chave.startsWith("35")) throw new ErroCodigoNota("Por enquanto só lemos notas de São Paulo (Sefaz-SP).");
  if (!partes.every((parte) => /^[0-9A-Za-z]+$/.test(parte))) throw new ErroCodigoNota("O link do QR Code está incompleto.");
  return { chave, url: `${URL_QR_CODE_SP}?p=${encodeURIComponent(partes.join("|"))}` };
}

/** GTIN-8, 12, 13 ou 14 com dígito verificador certo. "SEM GTIN" e lixo dão false. */
export function eanValido(codigo: string): boolean {
  if (!/^(\d{8}|\d{12,14})$/.test(codigo)) return false;
  if (/^0+$/.test(codigo)) return false;
  const digitos = codigo.split("").map(Number);
  const verificador = digitos.pop()!;
  const soma = digitos.reverse().reduce((total, d, i) => total + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (soma % 10)) % 10 === verificador;
}

/**
 * EAN no formato que usamos para casar produtos entre mercados: 13 dígitos (ou 8 para embalagens pequenas).
 * O Carrefour manda GTIN-14 com zero na frente ("07894900093001"), o Tauste manda 13 ("7894904575794").
 * Devolve undefined para "SEM GTIN" ou código inválido.
 */
export function normalizarEan(codigo: string | undefined): string | undefined {
  const digitos = (codigo ?? "").trim();
  if (!eanValido(digitos)) return undefined;
  if (digitos.length === 14 && digitos.startsWith("0")) return digitos.slice(1);
  if (digitos.length === 12) return `0${digitos}`;
  return digitos;
}
