import type { Categoria } from "./tipos";

/**
 * Categorização automática SEM IA (ver docs/decisoes/0003-categorias-por-ncm.md).
 *
 * 1º NCM: cada item da NFC-e traz o código NCM. Usamos o prefixo mais longo que bater nesta tabela.
 * 2º Descrição: se não houver NCM (ou ele não estiver na tabela), procuramos palavras-chave na descrição da nota.
 * 3º Sem resultado: "Outros" com `precisaRevisao = true`, que vai para o painel do administrador.
 *
 * Tabela inicial, conferida com 4 notas reais de São José dos Campos em 2026-10-20 (src/nfce/__fixtures__).
 * Teste em src/nfce/__tests__/lerNota.test.ts garante que todo item dessas notas ganha categoria pelo NCM.
 */
export const TABELA_NCM: Record<string, Categoria> = {
  // Carnes e embutidos
  "0201": "Açougue", // carne bovina fresca
  "0202": "Açougue", // carne bovina congelada
  "0203": "Açougue", // carne suína
  "0207": "Açougue", // aves
  "0210": "Açougue", // carnes salgadas/defumadas
  "1601": "Açougue", // embutidos (linguiça, salsicha)
  "1602": "Açougue", // carnes preparadas (empanados, iscas). Visto no Tauste em 2026-10
  // Laticínios
  "0401": "Laticínios",
  "0402": "Laticínios",
  "0403": "Laticínios",
  "0405": "Laticínios",
  "0406": "Laticínios",
  "0407": "Laticínios", // ovos ficam junto dos laticínios (visto no Tauste em 2026-10)
  // Hortifrúti: capítulos 07 (legumes) e 08 (frutas)
  "07": "Hortifrúti",
  "08": "Hortifrúti",
  // Mercearia (prefixos mais longos vencem o capítulo 07: feijão seco é 0713)
  "0713": "Mercearia",
  "0901": "Mercearia", // café
  "1006": "Mercearia", // arroz
  "1101": "Mercearia", // farinha de trigo
  "1507": "Mercearia", // óleo de soja
  "1509": "Mercearia", // azeite
  "1701": "Mercearia", // açúcar
  "1902": "Mercearia", // massas
  "1905": "Mercearia", // pães e biscoitos
  "2005": "Mercearia", // conservas de legumes (feijão pronto em sachê). Visto no Tauste em 2026-10
  "2103": "Mercearia", // molhos, maionese, ketchup. Visto no Tauste em 2026-10
  // Bebidas
  "2201": "Bebidas", // água
  "2202": "Bebidas", // refrigerantes e sucos
  "2203": "Bebidas", // cerveja
  "2204": "Bebidas", // vinho
  // Higiene
  "3305": "Higiene", // xampu e cabelo
  "3306": "Higiene", // higiene bucal
  "3307": "Higiene", // desodorante
  "340111": "Higiene", // sabonete
  "4818": "Higiene", // papel higiênico, guardanapo
  "5601": "Higiene", // algodão e hastes flexíveis. Visto no Carrefour em 2026-10
  // Limpeza
  "3401": "Limpeza", // sabões em geral (o sabonete 340111 vence por ser mais longo)
  "3402": "Limpeza", // detergentes e sabão em pó
  "3808": "Limpeza", // desinfetantes
};

/** Palavras-chave na descrição da nota (em maiúsculas, sem acento). A primeira que bater vence. */
export const REGRAS_DESCRICAO: { padrao: RegExp; categoria: Categoria }[] = [
  { padrao: /\b(PAP(EL)? ?HIG|SHAMP|XAMPU|CONDIC|SABONETE|CR(EME)? DENT|DESOD|ABSORV|FRALDA)/, categoria: "Higiene" },
  { padrao: /\b(DETERG|SABAO|AMACIANTE|DESINF|AGUA SANIT|ALVEJ|LIMP(ADOR)?|ESPONJA)/, categoria: "Limpeza" },
  { padrao: /\b(PICANHA|ACEM|ALCATRA|CONTRA ?FILE|PATINHO|COSTELA|FRANGO|COXA|SOBRECOXA|LINGUICA|CARNE|BOV|SUIN|FILE)/, categoria: "Açougue" },
  { padrao: /\b(LEITE|QUEIJO|IOGURTE|MANTEIGA|REQUEIJAO|MUSSARELA)/, categoria: "Laticínios" },
  { padrao: /\b(BANANA|MACA|LARANJA|TOMATE|CEBOLA|BATATA|ALFACE|CENOURA|LIMAO|MAMAO)\b/, categoria: "Hortifrúti" },
  { padrao: /\b(REFRI|CERVEJA|SUCO|AGUA MIN|VINHO)/, categoria: "Bebidas" },
  { padrao: /\b(ARROZ|FEIJAO|CAFE|ACUCAR|OLEO|AZEITE|MACARRAO|FARINHA|BISCOITO|PAO)/, categoria: "Mercearia" },
];

export interface Classificacao {
  categoria: Categoria;
  origem: "ncm" | "descricao" | "nenhuma";
  precisaRevisao: boolean;
}

/** Remove acentos e passa para maiúsculas: "Feijão" → "FEIJAO". */
export function normalizarDescricao(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function categoriaPorNcm(ncm: string | undefined): Categoria | undefined {
  if (!ncm) return undefined;
  const digitos = ncm.replace(/\D/g, "");
  for (let tamanho = digitos.length; tamanho >= 2; tamanho--) {
    const categoria = TABELA_NCM[digitos.slice(0, tamanho)];
    if (categoria) return categoria;
  }
  return undefined;
}

export function categoriaPorDescricao(descricao: string): Categoria | undefined {
  const normalizada = normalizarDescricao(descricao);
  return REGRAS_DESCRICAO.find((r) => r.padrao.test(normalizada))?.categoria;
}

export function classificar(item: { ncm?: string; descricao: string }): Classificacao {
  const porNcm = categoriaPorNcm(item.ncm);
  if (porNcm) return { categoria: porNcm, origem: "ncm", precisaRevisao: false };
  const porDescricao = categoriaPorDescricao(item.descricao);
  if (porDescricao) return { categoria: porDescricao, origem: "descricao", precisaRevisao: false };
  return { categoria: "Outros", origem: "nenhuma", precisaRevisao: true };
}
