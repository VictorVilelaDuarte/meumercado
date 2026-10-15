import { diasEntre, somarDias } from "./formato";
import type { Convite, DataISO, Usuario } from "./tipos";

/**
 * Fluxo de convite com aprovação do administrador (decisão do Victor, ver docs/decisoes/0004-convite-com-aprovacao.md):
 *
 *   membro ativo gera convite → pessoa se cadastra com o código → status "aguardando_aprovacao"
 *   → administrador aprova ("ativo") ou recusa ("recusado").
 *
 * Só membros "ativo" usam o app. As funções são puras: recebem o estado e devolvem o novo estado,
 * ou lançam `ErroRegra` com uma mensagem pronta para mostrar ao usuário.
 */

export const LIMITE_CONVITES_POR_MEMBRO = 5;
export const VALIDADE_CONVITE_DIAS = 7;
export const PONTOS_POR_CONVITE_APROVADO = 100;

export class ErroRegra extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroRegra";
  }
}

/** Convites que contam no limite: disponíveis ou já usados (expirados devolvem a vaga). */
export function convitesEmUso(convites: Convite[], usuarioId: string): number {
  return convites.filter((c) => c.criadoPor === usuarioId && c.status !== "expirado").length;
}

export function convitesRestantes(convites: Convite[], usuario: Usuario): number {
  if (usuario.papel === "admin") return Infinity;
  return Math.max(0, LIMITE_CONVITES_POR_MEMBRO - convitesEmUso(convites, usuario.id));
}

/** Gera um código legível no formato MERC-XXXX (sem letras que confundem, como O/0 e I/1). */
export function gerarCodigo(aleatorio: () => number = Math.random): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let sufixo = "";
  for (let i = 0; i < 4; i++) sufixo += alfabeto[Math.floor(aleatorio() * alfabeto.length)];
  return `MERC-${sufixo}`;
}

export function criarConvite(
  usuario: Usuario,
  convites: Convite[],
  hoje: DataISO,
  aleatorio: () => number = Math.random,
): Convite {
  if (usuario.status !== "ativo") throw new ErroRegra("Só membros ativos podem convidar.");
  if (convitesRestantes(convites, usuario) <= 0) throw new ErroRegra("Você já usou todos os seus convites.");
  let codigo = gerarCodigo(aleatorio);
  while (convites.some((c) => c.codigo === codigo)) codigo = gerarCodigo(aleatorio);
  return {
    codigo,
    criadoPor: usuario.id,
    status: "disponivel",
    criadoEm: hoje,
    expiraEm: somarDias(hoje, VALIDADE_CONVITE_DIAS),
  };
}

/** Marca como expirados os convites disponíveis cuja validade passou. */
export function expirarConvites(convites: Convite[], hoje: DataISO): Convite[] {
  return convites.map((c) => (c.status === "disponivel" && diasEntre(c.expiraEm, hoje) > 0 ? { ...c, status: "expirado" } : c));
}

/** Cadastro com código de convite. A pessoa entra como "aguardando_aprovacao". */
export function usarConvite(
  codigo: string,
  novo: { id: string; nome: string },
  convites: Convite[],
  hoje: DataISO,
): { convite: Convite; usuario: Usuario } {
  const normalizado = codigo.trim().toUpperCase();
  const convite = expirarConvites(convites, hoje).find((c) => c.codigo === normalizado);
  if (!convite) throw new ErroRegra("Código de convite não encontrado.");
  if (convite.status === "usado") throw new ErroRegra("Este convite já foi usado.");
  if (convite.status === "expirado") throw new ErroRegra("Este convite expirou. Peça um novo a quem te convidou.");
  return {
    convite: { ...convite, status: "usado", usadoPor: novo.id },
    usuario: {
      id: novo.id,
      nome: novo.nome,
      papel: "membro",
      status: "aguardando_aprovacao",
      convidadoPor: convite.criadoPor,
      pontos: 0,
      criadoEm: hoje,
    },
  };
}

function exigirAdmin(admin: Usuario) {
  if (admin.papel !== "admin" || admin.status !== "ativo") throw new ErroRegra("Só o administrador pode fazer isso.");
}

/** Aprova a entrada. Quem convidou ganha pontos. Retorna os usuários atualizados. */
export function aprovarEntrada(admin: Usuario, usuarioId: string, usuarios: Usuario[]): Usuario[] {
  exigirAdmin(admin);
  const alvo = usuarios.find((u) => u.id === usuarioId);
  if (!alvo) throw new ErroRegra("Pessoa não encontrada.");
  if (alvo.status !== "aguardando_aprovacao") throw new ErroRegra("Esta pessoa não está aguardando aprovação.");
  return usuarios.map((u) => {
    if (u.id === usuarioId) return { ...u, status: "ativo" };
    if (u.id === alvo.convidadoPor) return { ...u, pontos: u.pontos + PONTOS_POR_CONVITE_APROVADO };
    return u;
  });
}

export function recusarEntrada(admin: Usuario, usuarioId: string, usuarios: Usuario[]): Usuario[] {
  exigirAdmin(admin);
  const alvo = usuarios.find((u) => u.id === usuarioId);
  if (!alvo) throw new ErroRegra("Pessoa não encontrada.");
  if (alvo.status !== "aguardando_aprovacao") throw new ErroRegra("Esta pessoa não está aguardando aprovação.");
  return usuarios.map((u) => (u.id === usuarioId ? { ...u, status: "recusado" } : u));
}

export function pedidosPendentes(usuarios: Usuario[]): Usuario[] {
  return usuarios.filter((u) => u.status === "aguardando_aprovacao").sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
}
