import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buscarNota } from "../sefaz";

const fixture = (nome: string) => readFileSync(join(__dirname, "..", "__fixtures__", `${nome}.html`), "utf-8");
const QR = "https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=35261000776574068117653070001660511852732291%7C2%7C1%7C1%7C0";
// As fixtures não guardam o __VIEWSTATE (é dado de sessão); os testes devolvem um falso.
const RESUMIDA = fixture("americanas-aquarius-resumida").replace(
  "<body",
  '<input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="vs" /><input type="hidden" name="__EVENTVALIDATION" id="__EVENTVALIDATION" value="ev" /><body',
);
const COMPLETA = fixture("americanas-aquarius-completa");
const CAPTCHA = "<html>Consulta Pública Digite os caracteres da imagem ao lado</html>";

interface Pedido {
  url: string;
  metodo: string;
  corpo?: string;
  cookie?: string;
}

/** Sefaz de mentira: responde pela URL e guarda os pedidos para conferir. */
function sefazFalsa(paginaCompleta: () => string) {
  const pedidos: Pedido[] = [];
  const falso = (async (url: string, init: RequestInit = {}) => {
    const headers = (init.headers ?? {}) as Record<string, string>;
    pedidos.push({ url, metodo: init.method ?? "GET", corpo: init.body as string | undefined, cookie: headers.Cookie });
    if (url.includes("ConsultaQRCode")) return new Response(RESUMIDA, { headers: { "Set-Cookie": "ASP.NET_SessionId=abc; path=/; HttpOnly" } });
    if (url.includes("ConsultaResumidaRJFrame")) return new Response("", { status: 302, headers: { Location: "/NFCeConsultaPublica/Paginas/ConsultaPublica.aspx" } });
    if (url.includes("ConsultaPublica.aspx")) return new Response(paginaCompleta());
    return new Response("", { status: 404 });
  }) as typeof fetch;
  return { falso, pedidos };
}

describe("buscarNota", () => {
  it("abre o QR Code, aperta 'Visualizar em Abas' e lê a página completa com os cookies da sessão", async () => {
    const { falso, pedidos } = sefazFalsa(() => COMPLETA);
    const nota = await buscarNota(QR, { fetch: falso, espera: 0 });
    expect(nota.fonte).toBe("completa");
    expect(nota.itens[0].ean).toBe("9002490297855");
    expect(pedidos.map((p) => p.metodo)).toEqual(["GET", "POST", "GET"]);
    expect(pedidos[1].corpo).toContain("__EVENTTARGET=btnVisualizarAbas");
    expect(pedidos[1].corpo).toContain("__VIEWSTATE=vs");
    expect(pedidos[1].cookie).toBe("ASP.NET_SessionId=abc");
    expect(pedidos[2].cookie).toBe("ASP.NET_SessionId=abc");
  });

  it("tenta de novo quando vem captcha", async () => {
    let vez = 0;
    const { falso, pedidos } = sefazFalsa(() => (++vez < 2 ? CAPTCHA : COMPLETA));
    const nota = await buscarNota(QR, { fetch: falso, espera: 0 });
    expect(nota.fonte).toBe("completa");
    expect(pedidos).toHaveLength(6);
  });

  it("se a completa nunca vier, fica com a resumida (preços sem EAN/NCM)", async () => {
    const { falso } = sefazFalsa(() => CAPTCHA);
    const nota = await buscarNota(QR, { fetch: falso, espera: 0, tentativas: 2 });
    expect(nota.fonte).toBe("resumida");
    expect(nota.valorPago).toBe(1599);
  });

  it("nunca consulta endereço fora da Sefaz-SP", async () => {
    const { falso, pedidos } = sefazFalsa(() => COMPLETA);
    await expect(buscarNota("https://exemplo.com/x", { fetch: falso })).rejects.toThrow(/Sefaz-SP/);
    expect(pedidos).toHaveLength(0);
  });
});
