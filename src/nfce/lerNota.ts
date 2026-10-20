import type { Centavos } from "@/domain/tipos";
import { chaveValida, normalizarEan } from "./codigos";
import type { EmitenteLido, ItemLido, NotaLida } from "./tipos";

/**
 * Leitor da página da Sefaz-SP → `NotaLida`. Função PURA: recebe o HTML, não acessa a internet.
 * Quem baixa o HTML é `sefaz.ts`. Formatos e exemplos reais: docs/08-nfce.md e src/nfce/__fixtures__/.
 *
 * Entende os dois formatos:
 * - "completa" (botão "Visualizar em Abas"): traz EAN, NCM, CEP e desconto por item. É o que queremos.
 * - "resumida" (o que o QR Code abre): sem EAN e sem NCM. Usada quando a completa falha.
 *
 * Usa expressões regulares em vez de DOM para rodar igual no servidor (Node) e nos testes.
 */

export class ErroLeituraNota extends Error {}

export function lerNota(html: string): NotaLida {
  if (html.includes("Dados dos Produtos e Serviços")) return lerCompleta(html);
  if (html.includes('id="tabResult"')) return lerResumida(html);
  if (/Digite os caracteres da imagem/i.test(html)) throw new ErroLeituraNota("A Sefaz pediu captcha em vez de mostrar a nota.");
  throw new ErroLeituraNota("Esta página não parece uma NFC-e da Sefaz-SP.");
}

// ---------- texto e números ----------

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Tira as tags, decodifica entidades HTML e junta os espaços. */
export function texto(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (inteiro, nome: string) => {
      if (nome[0] === "#") return String.fromCodePoint(nome[1].toLowerCase() === "x" ? parseInt(nome.slice(2), 16) : Number(nome.slice(1)));
      return ENTIDADES[nome.toLowerCase()] ?? inteiro;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/** "1.234,5" → 1234.5. "0,3560" → 0.356. Vazio → 0. */
export function numeroBr(valor: string): number {
  const limpo = valor.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(limpo);
  return limpo && Number.isFinite(n) ? n : 0;
}

/** "32,8800000000" → 3288. "16,6" → 1660. Arredonda meio centavo para cima. Sem float no meio do caminho. */
export function centavosBr(valor: string): Centavos {
  const limpo = valor.replace(/[^\d,]/g, "");
  if (!limpo) return 0;
  const [inteiro = "0", fracao = ""] = limpo.split(",");
  const tres = (fracao + "000").slice(0, 3);
  const milesimos = Number(inteiro || "0") * 1000 + Number(tres);
  return Math.floor((milesimos + 5) / 10);
}

/** "15/10/2026 17:33:39-03:00" → ["2026-10-15", "17:33:39"]. */
function dataHora(valor: string): [string, string] {
  const m = valor.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})/);
  if (!m) throw new ErroLeituraNota("Não achei a data de emissão.");
  return [`${m[3]}-${m[2]}-${m[1]}`, m[4]];
}

const soDigitos = (valor: string) => valor.replace(/\D/g, "");

function exigir<T>(valor: T | undefined, oQue: string): T {
  if (valor === undefined || valor === "") throw new ErroLeituraNota(`Não achei ${oQue} na nota.`);
  return valor;
}

/** Trecho do HTML entre dois marcadores (o fim é opcional). */
function trecho(html: string, inicio: string, fim?: string): string {
  const a = html.indexOf(inicio);
  if (a < 0) return "";
  const b = fim ? html.indexOf(fim, a) : -1;
  return html.slice(a, b < 0 ? undefined : b);
}

// ---------- página completa ----------

/** Pares rótulo → valor no formato `<label>Rótulo</label><span>valor</span>` das abas. O primeiro de cada rótulo vence. */
function pares(html: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const m of html.matchAll(/<label>([\s\S]*?)<\/label>\s*<span>([\s\S]*?)<\/span>/g)) {
    const rotulo = texto(m[1]);
    if (!mapa.has(rotulo)) mapa.set(rotulo, texto(m[2]));
  }
  return mapa;
}

function lerCompleta(html: string): NotaLida {
  const abaNfe = trecho(html, 'id="Conteudo_pnlNFe_tabNFe"', 'id="Conteudo_pnlNFe_tabEmitente"');
  const abaEmitente = trecho(html, 'id="Conteudo_pnlNFe_tabEmitente"', 'id="Conteudo_pnlNFe_tabDestinatario"');
  const abaProdutos = trecho(html, 'id="Conteudo_pnlNFe_tabProdServ"', 'id="Conteudo_pnlNFe_tabTotais"');
  const abaTotais = trecho(html, 'id="Conteudo_pnlNFe_tabTotais"', 'id="Conteudo_pnlNFe_tabTransporte"');

  const nfe = pares(abaNfe);
  const chave = exigir(abaNfe.match(/Dados da NF-e:\s*(\d{44})/)?.[1], "a chave de acesso");
  const [data, hora] = dataHora(exigir(nfe.get("Data de Emissão"), "a data de emissão"));

  const em = pares(abaEmitente);
  const municipio = (em.get("Município") ?? "").replace(/^\d+\s*-\s*/, "");
  const emitente: EmitenteLido = {
    cnpj: soDigitos(exigir(em.get("CNPJ"), "o CNPJ do mercado")),
    razaoSocial: exigir(em.get("Nome / Razão Social"), "o nome do mercado"),
    nomeFantasia: em.get("Nome Fantasia") || undefined,
    endereco: em.get("Endereço") ?? "",
    bairro: em.get("Bairro / Distrito") ?? "",
    municipio,
    uf: em.get("UF") ?? "",
    cep: soDigitos(em.get("CEP") ?? "") || undefined,
  };

  const itens = abaProdutos
    .split('<table class="toggle box">')
    .slice(1)
    .map((bloco): ItemLido => {
      const coluna = (classe: string) => texto(bloco.match(new RegExp(`class="fixo-prod-serv-${classe}">\\s*<span>([\\s\\S]*?)</span>`))?.[1] ?? "");
      const det = pares(bloco);
      const ncm = soDigitos(det.get("Código NCM") ?? "");
      return {
        numero: Number(coluna("numero")),
        descricao: coluna("descricao"),
        codigo: det.get("Código do Produto") ?? "",
        ean: normalizarEan(det.get("Código EAN Comercial")),
        ncm: ncm.length === 8 ? ncm : undefined,
        quantidade: numeroBr(coluna("qtd")),
        unidade: coluna("uc"),
        valorUnitario: centavosBr(det.get("Valor unitário de comercialização") ?? ""),
        valorTotal: centavosBr(coluna("vb")),
        desconto: centavosBr(det.get("Valor do Desconto") ?? ""),
      };
    });
  if (!itens.length) throw new ErroLeituraNota("A nota não tem itens.");

  const tot = pares(abaTotais);
  return {
    fonte: "completa",
    chave,
    numero: nfe.get("Número") ?? String(Number(chave.slice(25, 34))),
    serie: nfe.get("Série") ?? String(Number(chave.slice(22, 25))),
    data,
    hora,
    emitente,
    itens,
    valorProdutos: centavosBr(tot.get("Valor Total dos Produtos") ?? ""),
    descontos: centavosBr(tot.get("Valor Total dos Descontos") ?? ""),
    valorPago: centavosBr(exigir(tot.get("Valor Total da NFe"), "o valor total")),
  };
}

// ---------- página resumida ----------

function lerResumida(html: string): NotaLida {
  const chave = soDigitos(exigir(html.match(/<span class="chave">([\s\S]*?)<\/span>/)?.[1], "a chave de acesso"));
  if (!chaveValida(chave)) throw new ErroLeituraNota("A chave de acesso da nota está errada.");

  const topo = trecho(html, 'class="txtCenter"', 'id="tabResult"');
  const linhas = [...topo.matchAll(/<div class="text">([\s\S]*?)<\/div>/g)].map((m) => texto(m[1]));
  const partesEndereco = (linhas[1] ?? "").split(",").map((p) => p.trim());
  // "AV. SAO JOAO , 2555 , , JARDIM DAS COLINAS , SAO JOSE DOS CAMPOS , SP" (o 3º é o complemento)
  const [rua = "", numero = "", , bairro = "", municipio = "", uf = ""] = partesEndereco;
  const emitente: EmitenteLido = {
    cnpj: soDigitos(exigir(linhas[0], "o CNPJ do mercado")),
    razaoSocial: exigir(texto(topo.match(/class="txtTopo">([\s\S]*?)<\/div>/)?.[1] ?? ""), "o nome do mercado"),
    endereco: numero ? `${rua}, ${numero}` : rua,
    bairro,
    municipio,
    uf,
  };

  const itens = [...html.matchAll(/<tr id="Item \+ (\d+)">([\s\S]*?)<\/tr>/g)].map(([, n, linha]): ItemLido => {
    const campo = (classe: string) => texto((linha.match(new RegExp(`<span class="${classe}">([\\s\\S]*?)</span>`))?.[1] ?? "").replace(/<strong>[\s\S]*?<\/strong>/g, ""));
    return {
      numero: Number(n),
      descricao: campo("txtTit"),
      codigo: campo("RCod").match(/Código:\s*([^\s)]+)/)?.[1] ?? "",
      quantidade: numeroBr(campo("Rqtd")),
      unidade: campo("RUN"),
      valorUnitario: centavosBr(campo("RvlUnit")),
      valorTotal: centavosBr(campo("valor")),
      desconto: 0,
    };
  });
  if (!itens.length) throw new ErroLeituraNota("A nota não tem itens.");

  const totais = new Map(
    [...html.matchAll(/<label>([\s\S]*?)<\/label>\s*<span class="totalNumb[^"]*">([\s\S]*?)<\/span>/g)].map((m) => [texto(m[1]), texto(m[2])]),
  );
  const valorPago = centavosBr(exigir(totais.get("Valor a pagar R$:"), "o valor a pagar"));
  const descontos = centavosBr(totais.get("Descontos R$:") ?? "");
  const [data, hora] = dataHora(texto(html.match(/Emissão:\s*<\/strong>([^<]*)/)?.[1] ?? ""));

  return {
    fonte: "resumida",
    chave,
    numero: texto(html.match(/Número:\s*<\/strong>([^<]*)/)?.[1] ?? "") || String(Number(chave.slice(25, 34))),
    serie: texto(html.match(/Série:\s*<\/strong>([^<]*)/)?.[1] ?? "") || String(Number(chave.slice(22, 25))),
    data,
    hora,
    emitente,
    itens,
    valorProdutos: totais.has("Valor total R$:") ? centavosBr(totais.get("Valor total R$:")!) : valorPago + descontos,
    descontos,
    valorPago,
  };
}
