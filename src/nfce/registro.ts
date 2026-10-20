import { classificar } from "@/domain/categorias";
import type { Categoria } from "@/domain/tipos";
import type { ItemLido, NotaLida } from "./tipos";

/**
 * O que o servidor manda para a função `registrar_nota` do banco (supabase/migrations, docs/09-banco.md):
 * a nota lida mais a categoria de cada item. A categoria é calculada aqui, em TypeScript, para existir
 * uma tabela de NCM só (src/domain/categorias.ts) em vez de uma cópia em SQL.
 */
export type NotaParaRegistro = Omit<NotaLida, "itens"> & { itens: (ItemLido & { categoria: Categoria })[] };

export function notaParaRegistro(nota: NotaLida): NotaParaRegistro {
  return { ...nota, itens: nota.itens.map((item) => ({ ...item, categoria: classificar(item).categoria })) };
}
