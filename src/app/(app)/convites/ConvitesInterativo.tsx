"use client";

import { useState } from "react";
import { Avatar, Cartao, Selo } from "@/components/ui";
import { convitesRestantes, criarConvite, ErroRegra, expirarConvites, LIMITE_CONVITES_POR_MEMBRO } from "@/domain/convites";
import type { Convite, Usuario } from "@/domain/tipos";

const ROTULO_STATUS: Record<Usuario["status"], { texto: string; tom: "roxo" | "verde" | "ambar" }> = {
  aguardando_aprovacao: { texto: "Aguardando o administrador", tom: "ambar" },
  ativo: { texto: "Aprovado", tom: "verde" },
  recusado: { texto: "Recusado", tom: "roxo" },
  removido: { texto: "Removido", tom: "roxo" },
};

/** Estado só no navegador até o Supabase entrar (docs/05-roteiro.md, Fase 1). */
export function ConvitesInterativo({ usuario, convitesIniciais, usuarios, hoje }: { usuario: Usuario; convitesIniciais: Convite[]; usuarios: Usuario[]; hoje: string }) {
  const [convites, setConvites] = useState(() => expirarConvites(convitesIniciais, hoje));
  const [erro, setErro] = useState<string>();
  const meus = convites.filter((c) => c.criadoPor === usuario.id);
  const restantes = convitesRestantes(convites, usuario);
  const convidados = usuarios.filter((u) => u.convidadoPor === usuario.id);

  const gerar = () => {
    try {
      setConvites((atual) => [criarConvite(usuario, atual, hoje), ...atual]);
      setErro(undefined);
    } catch (e) {
      setErro(e instanceof ErroRegra ? e.message : "Não foi possível gerar o convite.");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] font-extrabold">Convide amigos</h1>
        <p className="text-[13px] leading-snug text-muted">
          O meumercado é só para convidados. Quem usar seu código entra numa fila e o administrador aprova a entrada. Você ganha 100 pontos por amigo aprovado.
        </p>
      </div>

      <Cartao destaque className="flex flex-col gap-3">
        <span className="text-[13px] text-texto-2" data-testid="convites-restantes">
          {restantes === Infinity ? "Convites ilimitados (administrador)" : `${restantes} de ${LIMITE_CONVITES_POR_MEMBRO} convites disponíveis`}
        </span>
        <button type="button" onClick={gerar} disabled={restantes <= 0} className="min-h-12 rounded-xl bg-roxo text-[15px] font-bold text-white disabled:opacity-40">
          Gerar novo convite
        </button>
        {erro && <p role="alert" className="text-[13px] text-ambar">{erro}</p>}
      </Cartao>

      <section aria-labelledby="codigos" className="flex flex-col gap-2">
        <h2 id="codigos" className="text-base font-bold">Seus códigos</h2>
        <ul className="flex flex-col gap-2" data-testid="lista-codigos">
          {meus.map((c) => (
            <li key={c.codigo} className="flex items-center justify-between rounded-xl border border-borda bg-superficie p-3">
              <span className="font-mono text-base font-bold tracking-wider">{c.codigo}</span>
              <span className="text-xs text-muted">{c.status === "disponivel" ? `vale até ${c.expiraEm.split("-").reverse().join("/")}` : c.status === "usado" ? "usado" : "expirou"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="convidados" className="flex flex-col gap-2">
        <h2 id="convidados" className="text-base font-bold">Quem você convidou</h2>
        {convidados.length === 0 && <p className="text-sm text-muted">Ninguém ainda.</p>}
        {convidados.map((u) => (
          <div key={u.id} className="flex items-center gap-3">
            <Avatar nome={u.nome} tamanho={36} />
            <span className="flex-1 text-[15px] font-semibold">{u.nome}</span>
            <Selo tom={ROTULO_STATUS[u.status].tom}>{ROTULO_STATUS[u.status].texto}</Selo>
          </div>
        ))}
      </section>
    </>
  );
}
