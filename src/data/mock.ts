import { somarDias } from "@/domain/formato";
import type { AlertaPreco, Convite, ListaCompras, Mercado, Nota, ObservacaoPreco, Produto, Usuario } from "@/domain/tipos";

/**
 * DADOS DE EXEMPLO (mock). Nada aqui é real: nomes de mercados, CNPJs, endereços e preços são inventados
 * para desenhar e testar o front antes de existir a leitura da NFC-e e o banco (Supabase).
 *
 * Tudo é determinístico (gerador com semente fixa) e ancorado em DATA_REFERENCIA, para que telas e testes
 * mostrem sempre os mesmos números. Ver docs/04-dados-de-exemplo.md.
 */

export const DATA_REFERENCIA = "2026-10-15";
export const USUARIO_ATUAL_ID = "victor";

/** Gerador pseudoaleatório com semente (mulberry32). Mesma semente → mesma sequência. */
export function criarGerador(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const mercados: Mercado[] = [
  { id: "dutra", nome: "Atacado Dutra", cnpj: "00.000.000/0001-01", endereco: "[endereço de exemplo], 100", bairro: "Jardim Diamante", lat: -23.2005, lng: -45.8650 },
  { id: "vila-ema", nome: "Mercado Vila Ema", cnpj: "00.000.000/0001-02", endereco: "[endereço de exemplo], 200", bairro: "Vila Ema", lat: -23.1985, lng: -45.8960 },
  { id: "centro", nome: "Super Centro", cnpj: "00.000.000/0001-03", endereco: "[endereço de exemplo], 300", bairro: "Centro", lat: -23.1790, lng: -45.8870 },
  { id: "satelite", nome: "Mercado Jardim Satélite", cnpj: "00.000.000/0001-04", endereco: "[endereço de exemplo], 400", bairro: "Jardim Satélite", lat: -23.2270, lng: -45.8880 },
  { id: "aquarius", nome: "Mercado Aquarius", cnpj: "00.000.000/0001-05", endereco: "[endereço de exemplo], 500", bairro: "Jardim Aquarius", lat: -23.2120, lng: -45.9050 },
  { id: "urbanova", nome: "Mercado Urbanova", cnpj: "00.000.000/0001-06", endereco: "[endereço de exemplo], 600", bairro: "Urbanova", lat: -23.1940, lng: -45.9330 },
];

/** Fator de preço de cada mercado em relação à média (0,92 = 8% mais barato). Só para gerar os exemplos. */
const FATOR_MERCADO: Record<string, number> = {
  dutra: 0.92,
  "vila-ema": 0.97,
  centro: 1.01,
  satelite: 1.03,
  aquarius: 1.07,
  urbanova: 1.05,
};

export const produtos: Produto[] = [
  { id: "papel-neve-12", nome: "Papel higiênico Neve folha dupla 12 rolos", categoria: "Higiene", ncm: "48181000", unidadeMedida: "rolo", quantidadeEmbalagem: 12 },
  { id: "papel-neve-tripla-8", nome: "Papel higiênico Neve folha tripla 8 rolos", categoria: "Higiene", ncm: "48181000", unidadeMedida: "rolo", quantidadeEmbalagem: 8 },
  { id: "papel-personal-16", nome: "Papel higiênico Personal folha dupla 16 rolos", categoria: "Higiene", ncm: "48181000", unidadeMedida: "rolo", quantidadeEmbalagem: 16 },
  { id: "shampoo-400", nome: "Shampoo 400 ml", categoria: "Higiene", ncm: "33051000", unidadeMedida: "un", quantidadeEmbalagem: 1 },
  { id: "creme-dental", nome: "Creme dental 90 g", categoria: "Higiene", ncm: "33061000", unidadeMedida: "un", quantidadeEmbalagem: 1 },
  { id: "picanha-kg", nome: "Picanha bovina (kg)", categoria: "Açougue", ncm: "02013000", unidadeMedida: "kg", quantidadeEmbalagem: 1 },
  { id: "contrafile-kg", nome: "Contrafilé bovino (kg)", categoria: "Açougue", ncm: "02013000", unidadeMedida: "kg", quantidadeEmbalagem: 1 },
  { id: "frango-kg", nome: "Peito de frango (kg)", categoria: "Açougue", ncm: "02071400", unidadeMedida: "kg", quantidadeEmbalagem: 1 },
  { id: "banana-kg", nome: "Banana prata (kg)", categoria: "Hortifrúti", ncm: "08039000", unidadeMedida: "kg", quantidadeEmbalagem: 1 },
  { id: "tomate-kg", nome: "Tomate (kg)", categoria: "Hortifrúti", ncm: "07020000", unidadeMedida: "kg", quantidadeEmbalagem: 1 },
  { id: "leite-1l", nome: "Leite integral 1 L", categoria: "Laticínios", ncm: "04012010", unidadeMedida: "l", quantidadeEmbalagem: 1 },
  { id: "cafe-500", nome: "Café torrado 500 g", categoria: "Mercearia", ncm: "09012100", unidadeMedida: "kg", quantidadeEmbalagem: 0.5 },
  { id: "arroz-5kg", nome: "Arroz tipo 1, 5 kg", categoria: "Mercearia", ncm: "10063021", unidadeMedida: "kg", quantidadeEmbalagem: 5 },
  { id: "feijao-1kg", nome: "Feijão carioca 1 kg", categoria: "Mercearia", ncm: "07133399", unidadeMedida: "kg", quantidadeEmbalagem: 1 },
  { id: "azeite-500", nome: "Azeite 500 ml", categoria: "Mercearia", ncm: "15091000", unidadeMedida: "l", quantidadeEmbalagem: 0.5 },
  { id: "detergente-500", nome: "Detergente 500 ml", categoria: "Limpeza", ncm: "34022000", unidadeMedida: "un", quantidadeEmbalagem: 1 },
  { id: "sabao-po-16", nome: "Sabão em pó 1,6 kg", categoria: "Limpeza", ncm: "34022000", unidadeMedida: "kg", quantidadeEmbalagem: 1.6 },
  { id: "refri-2l", nome: "Refrigerante 2 L", categoria: "Bebidas", ncm: "22021000", unidadeMedida: "l", quantidadeEmbalagem: 2 },
];

/** Preço médio de referência de cada produto em outubro (centavos). */
const PRECO_BASE: Record<string, number> = {
  "papel-neve-12": 2390,
  "papel-neve-tripla-8": 2190,
  "papel-personal-16": 2690,
  "shampoo-400": 1590,
  "creme-dental": 549,
  "picanha-kg": 7490,
  "contrafile-kg": 4990,
  "frango-kg": 2190,
  "banana-kg": 699,
  "tomate-kg": 849,
  "leite-1l": 549,
  "cafe-500": 1990,
  "arroz-5kg": 2690,
  "feijao-1kg": 799,
  "azeite-500": 3590,
  "detergente-500": 279,
  "sabao-po-16": 2390,
  "refri-2l": 999,
};

/** Datas em que cada mercado "recebeu" notas: a cada ~9 dias desde maio, com um deslocamento por mercado. */
function datasDeColeta(indiceMercado: number): string[] {
  const datas: string[] = [];
  for (let d = somarDias("2026-05-03", indiceMercado); d <= DATA_REFERENCIA; d = somarDias(d, 9)) datas.push(d);
  // garante uma coleta bem recente em todos os mercados
  if (datas.at(-1)! < somarDias(DATA_REFERENCIA, -3)) datas.push(somarDias(DATA_REFERENCIA, -(indiceMercado % 3)));
  return datas;
}

function gerarObservacoes(): ObservacaoPreco[] {
  const aleatorio = criarGerador(42);
  const observacoes: ObservacaoPreco[] = [];
  mercados.forEach((mercado, indice) => {
    for (const data of datasDeColeta(indice)) {
      // inflação leve: preços de maio ~4% abaixo de outubro
      const mesesAtras = (Date.parse(DATA_REFERENCIA) - Date.parse(data)) / (30 * 86_400_000);
      const tendencia = 1 - 0.008 * mesesAtras;
      for (const produto of produtos) {
        if (aleatorio() < 0.25) continue; // nem toda nota tem todos os produtos
        const ruido = 0.95 + aleatorio() * 0.1;
        const valor = Math.round((PRECO_BASE[produto.id] * FATOR_MERCADO[mercado.id] * tendencia * ruido) / 10) * 10 - 1;
        observacoes.push({ produtoId: produto.id, mercadoId: mercado.id, valor, data });
      }
    }
  });
  // Quedas recentes conhecidas, para o Hub de Ofertas ter conteúdo estável.
  const quedas: [string, string, number][] = [
    ["picanha-kg", "dutra", 5990],
    ["sabao-po-16", "centro", 1990],
    ["papel-neve-12", "vila-ema", 2190],
    ["azeite-500", "satelite", 3290],
    ["cafe-500", "dutra", 1849],
  ];
  for (const [produtoId, mercadoId, valor] of quedas) observacoes.push({ produtoId, mercadoId, valor, data: somarDias(DATA_REFERENCIA, -1) });
  return observacoes;
}

export const observacoes: ObservacaoPreco[] = gerarObservacoes();

export const usuarios: Usuario[] = [
  { id: "victor", nome: "Victor", papel: "admin", status: "ativo", pontos: 1240, criadoEm: "2026-10-01" },
  { id: "ana", nome: "Ana", papel: "membro", status: "ativo", convidadoPor: "victor", pontos: 1580, criadoEm: "2026-10-02" },
  { id: "rafael", nome: "Rafael", papel: "membro", status: "ativo", convidadoPor: "victor", pontos: 960, criadoEm: "2026-10-05" },
  { id: "marina", nome: "Marina", papel: "membro", status: "ativo", convidadoPor: "ana", pontos: 710, criadoEm: "2026-10-06" },
  { id: "joao", nome: "João", papel: "membro", status: "ativo", convidadoPor: "rafael", pontos: 340, criadoEm: "2026-10-08" },
  { id: "lucas", nome: "Lucas", papel: "membro", status: "aguardando_aprovacao", convidadoPor: "ana", pontos: 0, criadoEm: "2026-10-15" },
  { id: "bia", nome: "Bia", papel: "membro", status: "aguardando_aprovacao", convidadoPor: "victor", pontos: 0, criadoEm: "2026-10-14" },
];

export const convites: Convite[] = [
  { codigo: "MERC-7Q4K", criadoPor: "ana", status: "usado", usadoPor: "lucas", criadoEm: "2026-10-13", expiraEm: "2026-10-20" },
  { codigo: "MERC-B2RT", criadoPor: "victor", status: "usado", usadoPor: "bia", criadoEm: "2026-10-12", expiraEm: "2026-10-19" },
  { codigo: "MERC-H8WX", criadoPor: "victor", status: "disponivel", criadoEm: "2026-10-14", expiraEm: "2026-10-21" },
];

/** Notas de cada usuário, montadas a partir das observações do mercado na mesma data. */
function gerarNotas(): Nota[] {
  const aleatorio = criarGerador(7);
  const plano: { usuarioId: string; mercadoId: string; quantidade: number }[] = [
    { usuarioId: "victor", mercadoId: "vila-ema", quantidade: 6 },
    { usuarioId: "victor", mercadoId: "dutra", quantidade: 5 },
    { usuarioId: "victor", mercadoId: "centro", quantidade: 3 },
    { usuarioId: "ana", mercadoId: "dutra", quantidade: 7 },
    { usuarioId: "rafael", mercadoId: "vila-ema", quantidade: 5 },
    { usuarioId: "marina", mercadoId: "centro", quantidade: 5 },
    { usuarioId: "joao", mercadoId: "aquarius", quantidade: 4 },
  ];
  const notas: Nota[] = [];
  for (const p of plano) {
    const datas = [...new Set(observacoes.filter((o) => o.mercadoId === p.mercadoId).map((o) => o.data))].sort().slice(-p.quantidade);
    for (const data of datas) {
      const doDia = observacoes.filter((o) => o.mercadoId === p.mercadoId && o.data === data);
      const itens = doDia
        .filter(() => aleatorio() < 0.6)
        .map((o) => {
          const produto = produtos.find((x) => x.id === o.produtoId)!;
          const quantidade = produto.unidadeMedida === "kg" && produto.quantidadeEmbalagem === 1 ? Math.round((0.6 + aleatorio()) * 1000) / 1000 : 1;
          return { descricaoOriginal: produto.nome.toUpperCase(), produtoId: o.produtoId, quantidade, valorUnitario: o.valor };
        });
      if (itens.length === 0) continue;
      notas.push({ id: `${p.usuarioId}-${p.mercadoId}-${data}`, usuarioId: p.usuarioId, mercadoId: p.mercadoId, data, itens });
    }
  }
  // um item que não casou com nenhum produto, para exercitar "sem comparação" e o painel do administrador
  const ultimaDoVictor = notas.filter((n) => n.usuarioId === "victor").sort((a, b) => b.data.localeCompare(a.data))[0];
  ultimaDoVictor?.itens.push({ descricaoOriginal: "KIT CHURR PREMIUM", quantidade: 1, valorUnitario: 3490 });
  return notas;
}

export const notas: Nota[] = gerarNotas();

export const alertas: AlertaPreco[] = [
  { id: "al-1", usuarioId: "victor", produtoId: "papel-neve-12", meta: 1990, precoInicial: 2490, ativo: true },
  { id: "al-2", usuarioId: "victor", produtoId: "picanha-kg", meta: 6490, precoInicial: 7990, ativo: true },
  { id: "al-3", usuarioId: "victor", produtoId: "cafe-500", meta: 1900, precoInicial: 2190, ativo: true },
];

export const listas: ListaCompras[] = [
  {
    id: "lista-mes",
    usuarioId: "victor",
    nome: "Compra do mês",
    itens: [
      { produtoId: "papel-neve-12", quantidade: 1, comprado: false },
      { produtoId: "cafe-500", quantidade: 2, comprado: false },
      { produtoId: "arroz-5kg", quantidade: 1, comprado: false },
      { produtoId: "feijao-1kg", quantidade: 2, comprado: false },
      { produtoId: "shampoo-400", quantidade: 1, comprado: false },
      { produtoId: "detergente-500", quantidade: 3, comprado: false },
      { produtoId: "leite-1l", quantidade: 6, comprado: false },
    ],
  },
];

/** Itens que o painel do administrador precisa revisar (casamento de produto duvidoso). */
export const revisoesProduto = [
  { id: "rev-1", descricaoNota: "PAP HIG NEVE FD 12X30", sugestaoProdutoId: "papel-neve-12", mercadoId: "centro" },
  { id: "rev-2", descricaoNota: "CAFE TORR TRAD 500G", sugestaoProdutoId: "cafe-500", mercadoId: "aquarius" },
];
