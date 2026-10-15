import { describe, expect, it } from "vitest";
import {
  ErroRegra,
  LIMITE_CONVITES_POR_MEMBRO,
  PONTOS_POR_CONVITE_APROVADO,
  aprovarEntrada,
  convitesRestantes,
  criarConvite,
  gerarCodigo,
  pedidosPendentes,
  recusarEntrada,
  usarConvite,
} from "../convites";
import type { Convite, Usuario } from "../tipos";

const HOJE = "2026-10-15";
const usuario = (id: string, extra: Partial<Usuario> = {}): Usuario => ({
  id,
  nome: id,
  papel: "membro",
  status: "ativo",
  pontos: 0,
  criadoEm: "2026-10-01",
  ...extra,
});
const admin = usuario("victor", { papel: "admin" });
const ana = usuario("ana");

// gerador previsível para os testes
const sequencia = (...valores: number[]) => {
  let i = 0;
  return () => valores[i++ % valores.length];
};

describe("gerarCodigo", () => {
  it("usa o formato MERC-XXXX sem caracteres ambíguos", () => {
    const codigo = gerarCodigo(sequencia(0, 0.5, 0.99, 0.1));
    expect(codigo).toMatch(/^MERC-[A-HJ-NP-Z2-9]{4}$/);
  });
});

describe("criarConvite", () => {
  it("cria convite disponível com validade de 7 dias", () => {
    const c = criarConvite(ana, [], HOJE, sequencia(0.1));
    expect(c).toMatchObject({ criadoPor: "ana", status: "disponivel", criadoEm: HOJE, expiraEm: "2026-10-22" });
  });
  it("respeita o limite por membro", () => {
    const convites: Convite[] = Array.from({ length: LIMITE_CONVITES_POR_MEMBRO }, (_, i) => ({
      codigo: `MERC-000${i}`,
      criadoPor: "ana",
      status: "usado",
      criadoEm: HOJE,
      expiraEm: HOJE,
    }));
    expect(convitesRestantes(convites, ana)).toBe(0);
    expect(() => criarConvite(ana, convites, HOJE)).toThrow(ErroRegra);
  });
  it("admin não tem limite", () => {
    expect(convitesRestantes([], admin)).toBe(Infinity);
  });
  it("quem está aguardando aprovação não pode convidar", () => {
    expect(() => criarConvite(usuario("x", { status: "aguardando_aprovacao" }), [], HOJE)).toThrow("Só membros ativos");
  });
});

describe("fluxo convite → aprovação do administrador", () => {
  const convite: Convite = { codigo: "MERC-7Q4K", criadoPor: "ana", status: "disponivel", criadoEm: "2026-10-14", expiraEm: "2026-10-21" };

  it("quem usa o convite entra AGUARDANDO aprovação, não ativo", () => {
    const r = usarConvite(" merc-7q4k ", { id: "lucas", nome: "Lucas" }, [convite], HOJE);
    expect(r.usuario).toMatchObject({ id: "lucas", status: "aguardando_aprovacao", convidadoPor: "ana", papel: "membro" });
    expect(r.convite).toMatchObject({ status: "usado", usadoPor: "lucas" });
  });

  it("convite usado, expirado ou inexistente é recusado", () => {
    expect(() => usarConvite("MERC-7Q4K", { id: "x", nome: "x" }, [{ ...convite, status: "usado" }], HOJE)).toThrow("já foi usado");
    expect(() => usarConvite("MERC-7Q4K", { id: "x", nome: "x" }, [convite], "2026-10-30")).toThrow("expirou");
    expect(() => usarConvite("MERC-0000", { id: "x", nome: "x" }, [convite], HOJE)).toThrow("não encontrado");
  });

  it("administrador aprova: pessoa fica ativa e quem convidou ganha pontos", () => {
    const { usuario: lucas } = usarConvite("MERC-7Q4K", { id: "lucas", nome: "Lucas" }, [convite], HOJE);
    const usuarios = aprovarEntrada(admin, "lucas", [admin, ana, lucas]);
    expect(usuarios.find((u) => u.id === "lucas")?.status).toBe("ativo");
    expect(usuarios.find((u) => u.id === "ana")?.pontos).toBe(PONTOS_POR_CONVITE_APROVADO);
  });

  it("administrador recusa: pessoa fica recusada e ninguém ganha pontos", () => {
    const { usuario: lucas } = usarConvite("MERC-7Q4K", { id: "lucas", nome: "Lucas" }, [convite], HOJE);
    const usuarios = recusarEntrada(admin, "lucas", [admin, ana, lucas]);
    expect(usuarios.find((u) => u.id === "lucas")?.status).toBe("recusado");
    expect(usuarios.find((u) => u.id === "ana")?.pontos).toBe(0);
  });

  it("só o administrador aprova ou recusa", () => {
    const lucas = usuario("lucas", { status: "aguardando_aprovacao", convidadoPor: "ana" });
    expect(() => aprovarEntrada(ana, "lucas", [ana, lucas])).toThrow("Só o administrador");
    expect(() => recusarEntrada(ana, "lucas", [ana, lucas])).toThrow("Só o administrador");
  });

  it("não aprova quem já está ativo", () => {
    expect(() => aprovarEntrada(admin, "ana", [admin, ana])).toThrow("não está aguardando");
  });

  it("pedidosPendentes lista só quem aguarda, do mais antigo para o mais novo", () => {
    const a = usuario("a", { status: "aguardando_aprovacao", criadoEm: "2026-10-14" });
    const b = usuario("b", { status: "aguardando_aprovacao", criadoEm: "2026-10-12" });
    expect(pedidosPendentes([ana, a, b]).map((u) => u.id)).toEqual(["b", "a"]);
  });
});
