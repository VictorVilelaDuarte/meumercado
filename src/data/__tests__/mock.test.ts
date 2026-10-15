import { describe, expect, it } from "vitest";
import { classificar } from "@/domain/categorias";
import { maioresQuedas } from "@/domain/precos";
import { repositorio } from "../repositorio";

/** Garante que os dados de exemplo continuam coerentes, para as telas não quebrarem em silêncio. */
describe("dados de exemplo", () => {
  const hoje = repositorio.hoje();

  it("toda observação aponta para produto e mercado existentes e não está no futuro", () => {
    for (const o of repositorio.observacoes()) {
      expect(repositorio.produto(o.produtoId), o.produtoId).toBeDefined();
      expect(repositorio.mercado(o.mercadoId), o.mercadoId).toBeDefined();
      expect(o.data <= hoje).toBe(true);
      expect(Number.isInteger(o.valor)).toBe(true);
    }
  });

  it("a categoria de cada produto bate com a do NCM", () => {
    for (const p of repositorio.produtos()) {
      expect(classificar({ ncm: p.ncm, descricao: p.nome }).categoria, p.id).toBe(p.categoria);
    }
  });

  it("é determinístico: a mesma chamada devolve os mesmos números", async () => {
    const { observacoes } = await import("../mock");
    expect(observacoes.length).toBe(repositorio.observacoes().length);
    expect(observacoes[0]).toEqual(repositorio.observacoes()[0]);
  });

  it("o Hub de Ofertas tem conteúdo", () => {
    expect(maioresQuedas(repositorio.observacoes(), hoje).length).toBeGreaterThanOrEqual(3);
  });

  it("notasDoUsuario só devolve notas do próprio usuário", () => {
    const notas = repositorio.notasDoUsuario("victor");
    expect(notas.length).toBeGreaterThan(0);
    expect(notas.every((n) => n.usuarioId === "victor")).toBe(true);
    const deOutro = repositorio.notasDoUsuario("ana")[0];
    expect(repositorio.nota("victor", deOutro.id)).toBeUndefined();
  });

  it("há pedidos de entrada aguardando o administrador", () => {
    expect(repositorio.usuarios().some((u) => u.status === "aguardando_aprovacao")).toBe(true);
  });
});
