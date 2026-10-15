/**
 * Tipos centrais do domínio do meumercado.
 *
 * Regras gerais (ver docs/02-dominio.md):
 * - Todo valor em dinheiro é um inteiro em CENTAVOS (R$ 21,90 = 2190). Nunca use float para dinheiro.
 * - Datas são strings ISO 8601 (AAAA-MM-DD) para facilitar comparação, serialização e testes.
 */

export type Centavos = number;
export type DataISO = string;

export type Categoria =
  | "Açougue"
  | "Hortifrúti"
  | "Laticínios"
  | "Mercearia"
  | "Bebidas"
  | "Higiene"
  | "Limpeza"
  | "Outros";

export const CATEGORIAS: Categoria[] = [
  "Açougue",
  "Hortifrúti",
  "Laticínios",
  "Mercearia",
  "Bebidas",
  "Higiene",
  "Limpeza",
  "Outros",
];

/** Unidade usada para comparar embalagens diferentes (preço por rolo, por kg, por litro...). */
export type UnidadeMedida = "un" | "kg" | "l" | "rolo";

export interface Mercado {
  id: string;
  nome: string;
  /** CNPJ identifica a loja: cada filial tem o seu. */
  cnpj: string;
  endereco: string;
  bairro: string;
  lat: number;
  lng: number;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: Categoria;
  /** Código de barras, quando a nota trouxer. */
  ean?: string;
  /** Código fiscal NCM (8 dígitos), usado para categorizar sem IA. */
  ncm?: string;
  unidadeMedida: UnidadeMedida;
  /** Quantas unidades de medida há na embalagem (12 rolos, 0,5 kg...). */
  quantidadeEmbalagem: number;
}

/** Um preço visto em uma nota: produto, mercado, valor e data. É o dado compartilhado entre todos. */
export interface ObservacaoPreco {
  produtoId: string;
  mercadoId: string;
  valor: Centavos;
  data: DataISO;
}

export interface ItemNota {
  descricaoOriginal: string;
  produtoId?: string;
  quantidade: number;
  valorUnitario: Centavos;
}

/** Nota fiscal escaneada. É PRIVADA: só o dono vê. */
export interface Nota {
  id: string;
  usuarioId: string;
  mercadoId: string;
  data: DataISO;
  itens: ItemNota[];
}

export type PapelUsuario = "membro" | "admin";
export type StatusMembro = "aguardando_aprovacao" | "ativo" | "recusado" | "removido";

export interface Usuario {
  id: string;
  nome: string;
  papel: PapelUsuario;
  status: StatusMembro;
  convidadoPor?: string;
  pontos: number;
  criadoEm: DataISO;
}

export type StatusConvite = "disponivel" | "usado" | "expirado";

export interface Convite {
  codigo: string;
  criadoPor: string;
  status: StatusConvite;
  usadoPor?: string;
  criadoEm: DataISO;
  expiraEm: DataISO;
}

export interface AlertaPreco {
  id: string;
  usuarioId: string;
  produtoId: string;
  /** Preço-alvo: avisar quando o menor preço da cidade chegar nele ou abaixo. */
  meta: Centavos;
  /** Menor preço no dia em que o alerta foi criado, para medir o progresso. */
  precoInicial: Centavos;
  ativo: boolean;
}

export interface ItemLista {
  produtoId: string;
  quantidade: number;
  comprado: boolean;
}

export interface ListaCompras {
  id: string;
  usuarioId: string;
  nome: string;
  itens: ItemLista[];
}
