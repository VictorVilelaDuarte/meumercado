import { HOST_SEFAZ_SP } from "./codigos";
import { ErroLeituraNota, lerNota } from "./lerNota";
import type { NotaLida } from "./tipos";

/**
 * Busca a nota na Sefaz-SP (I/O; roda SÓ no servidor, em src/app/api/nfce/route.ts).
 * O passo a passo foi descoberto com notas reais em 2026-10-20 (docs/08-nfce.md, ADR 0006):
 *
 * 1. GET no link do QR Code → página resumida (sem EAN/NCM) + cookies de sessão.
 * 2. POST simulando o botão "Visualizar em Abas" (ASP.NET: __VIEWSTATE e __EVENTVALIDATION da página) → 302.
 * 3. GET em ConsultaPublica.aspx com os mesmos cookies → página completa (com EAN e NCM).
 *
 * O passo 3 às vezes devolve a tela de captcha. Tentamos algumas vezes com sessão nova e,
 * se não der, ficamos com a resumida (que ainda dá preços, só não dá EAN e NCM).
 */

const BASE = `https://${HOST_SEFAZ_SP}/NFCeConsultaPublica/Paginas`;
const URL_ABAS = `${BASE}/ConsultaResponsiva/ConsultaResumidaRJFrame_v400.aspx`;
const URL_COMPLETA = `${BASE}/ConsultaPublica.aspx`;

export interface OpcoesBusca {
  /** Para testes: troca o fetch de verdade por um falso. */
  fetch?: typeof fetch;
  tentativas?: number;
  /** Espera entre tentativas, em ms. */
  espera?: number;
}

export async function buscarNota(urlQrCode: string, opcoes: OpcoesBusca = {}): Promise<NotaLida> {
  const { fetch: buscar = fetch, tentativas = 3, espera = 1500 } = opcoes;
  if (new URL(urlQrCode).hostname !== HOST_SEFAZ_SP) throw new ErroLeituraNota("Endereço fora da Sefaz-SP.");

  let resumida: string | undefined;
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const sessao = new Sessao(buscar);
    const pagina = await sessao.pedir(urlQrCode);
    resumida ??= pagina;
    const campos = camposAspNet(pagina);
    if (!campos) break; // não veio a nota (chave inexistente, nota cancelada...): não adianta insistir
    await sessao.pedir(URL_ABAS, { "__EVENTTARGET": "btnVisualizarAbas", "__EVENTARGUMENT": "", ...campos }, urlQrCode);
    const completa = await sessao.pedir(URL_COMPLETA, undefined, urlQrCode);
    if (completa.includes("Dados dos Produtos e Serviços")) return lerNota(completa);
    if (tentativa < tentativas && espera > 0) await new Promise((r) => setTimeout(r, espera));
  }
  return lerNota(resumida ?? "");
}

/** Campos escondidos que o ASP.NET exige de volta no POST. */
function camposAspNet(html: string): Record<string, string> | undefined {
  const valor = (id: string) => html.match(new RegExp(`id="${id}" value="([^"]*)"`))?.[1];
  const viewState = valor("__VIEWSTATE");
  const validacao = valor("__EVENTVALIDATION");
  if (!viewState || !validacao || !html.includes("btnVisualizarAbas")) return undefined;
  return { "__VIEWSTATE": viewState, "__VIEWSTATEGENERATOR": valor("__VIEWSTATEGENERATOR") ?? "", "__EVENTVALIDATION": validacao };
}

/** Guarda os cookies entre os pedidos, como o navegador faria. Não segue redirecionamentos para fora da Sefaz. */
class Sessao {
  private cookies = new Map<string, string>();
  constructor(private buscar: typeof fetch) {}

  async pedir(url: string, formulario?: Record<string, string>, referer?: string): Promise<string> {
    const resposta = await this.buscar(url, {
      method: formulario ? "POST" : "GET",
      body: formulario ? new URLSearchParams(formulario).toString() : undefined,
      headers: {
        ...(formulario ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        ...(referer ? { Referer: referer } : {}),
        ...(this.cookies.size ? { Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ") } : {}),
        "User-Agent": "Mozilla/5.0 (meumercado)",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    for (const linha of resposta.headers.getSetCookie?.() ?? []) {
      const [par] = linha.split(";");
      const igual = par.indexOf("=");
      if (igual > 0) this.cookies.set(par.slice(0, igual).trim(), par.slice(igual + 1).trim());
    }
    return resposta.text();
  }
}
