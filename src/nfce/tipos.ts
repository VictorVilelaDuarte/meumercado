import type { Centavos, DataISO } from "@/domain/tipos";

/**
 * Nota fiscal como a Sefaz-SP mostra, ANTES de virar `Nota` do domínio (que precisa de usuário e mercado cadastrados).
 * Ver docs/08-nfce.md para o que cada campo significa e de onde vem.
 */
export interface NotaLida {
  /** "completa" = página "Visualizar em Abas" (tem EAN e NCM). "resumida" = página que o QR Code abre (não tem). */
  fonte: "completa" | "resumida";
  /** Chave de acesso, 44 dígitos. */
  chave: string;
  numero: string;
  serie: string;
  /** Data de emissão AAAA-MM-DD. */
  data: DataISO;
  /** Hora de emissão HH:MM:SS (horário de Brasília). */
  hora: string;
  emitente: EmitenteLido;
  itens: ItemLido[];
  /** Soma dos itens antes dos descontos. */
  valorProdutos: Centavos;
  descontos: Centavos;
  /** O que a pessoa pagou. */
  valorPago: Centavos;
}

export interface EmitenteLido {
  /** Só dígitos, 14. Identifica a loja (cada filial tem o seu). */
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  /** "AV. SAO JOAO, 2555" */
  endereco: string;
  bairro: string;
  municipio: string;
  uf: string;
  /** Só dígitos, 8. Só a página completa traz. */
  cep?: string;
}

export interface ItemLido {
  /** Posição na nota, começando em 1. */
  numero: number;
  descricao: string;
  /** Código interno do produto no mercado. */
  codigo: string;
  /** Código de barras (GTIN). Ausente quando a nota diz "SEM GTIN", é inválido, ou a fonte é a resumida. */
  ean?: string;
  /** NCM com 8 dígitos. Ausente na fonte resumida. */
  ncm?: string;
  quantidade: number;
  /** Unidade como veio na nota ("KG", "UN", "un9"...). */
  unidade: string;
  valorUnitario: Centavos;
  /** Valor do item antes do desconto (quantidade × unitário, como o mercado arredondou). */
  valorTotal: Centavos;
  /** Desconto do item. A página resumida só mostra o desconto total, então ali é 0. */
  desconto: Centavos;
}
