import * as mock from "./mock";
import type { AlertaPreco, Convite, ListaCompras, Mercado, Nota, ObservacaoPreco, Produto, Usuario } from "@/domain/tipos";

/**
 * Ponto ÚNICO de acesso a dados do app. As telas nunca importam `./mock` direto: sempre usam `repositorio`.
 *
 * Hoje a implementação é o mock em memória. Quando o Supabase entrar (Fase 1, ver docs/05-roteiro.md),
 * basta criar outra implementação desta interface e trocar a exportação no fim do arquivo.
 *
 * Regra de privacidade: métodos de notas recebem o id do usuário e só devolvem as notas DELE.
 */
export interface Repositorio {
  hoje(): string;
  usuarioAtual(): Usuario;
  mercados(): Mercado[];
  mercado(id: string): Mercado | undefined;
  produtos(): Produto[];
  produto(id: string): Produto | undefined;
  /** Preços compartilhados (sem dizer quem comprou). */
  observacoes(): ObservacaoPreco[];
  notasDoUsuario(usuarioId: string): Nota[];
  nota(usuarioId: string, notaId: string): Nota | undefined;
  usuarios(): Usuario[];
  convites(): Convite[];
  alertasDoUsuario(usuarioId: string): AlertaPreco[];
  listasDoUsuario(usuarioId: string): ListaCompras[];
  revisoesProduto(): typeof mock.revisoesProduto;
  /** Notas de todos, SÓ para cálculos agregados que não expõem itens (ranking do desafio). */
  notasParaRanking(): Nota[];
}

export const repositorioMock: Repositorio = {
  hoje: () => mock.DATA_REFERENCIA,
  usuarioAtual: () => mock.usuarios.find((u) => u.id === mock.USUARIO_ATUAL_ID)!,
  mercados: () => mock.mercados,
  mercado: (id) => mock.mercados.find((m) => m.id === id),
  produtos: () => mock.produtos,
  produto: (id) => mock.produtos.find((p) => p.id === id),
  observacoes: () => mock.observacoes,
  notasDoUsuario: (usuarioId) => mock.notas.filter((n) => n.usuarioId === usuarioId).sort((a, b) => b.data.localeCompare(a.data)),
  nota: (usuarioId, notaId) => mock.notas.find((n) => n.id === notaId && n.usuarioId === usuarioId),
  usuarios: () => mock.usuarios,
  convites: () => mock.convites,
  alertasDoUsuario: (usuarioId) => mock.alertas.filter((a) => a.usuarioId === usuarioId),
  listasDoUsuario: (usuarioId) => mock.listas.filter((l) => l.usuarioId === usuarioId),
  revisoesProduto: () => mock.revisoesProduto,
  notasParaRanking: () => mock.notas,
};

export const repositorio: Repositorio = repositorioMock;
