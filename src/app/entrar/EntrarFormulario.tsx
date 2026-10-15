"use client";

import { useState, type FormEvent } from "react";
import { Cartao } from "@/components/ui";
import { ErroRegra, usarConvite } from "@/domain/convites";
import type { Convite } from "@/domain/tipos";

/** Sem autenticação real ainda: o cadastro só demonstra o fluxo (docs/05-roteiro.md, Fase 1). */
export function EntrarFormulario({ convites, hoje }: { convites: Convite[]; hoje: string }) {
  const [erro, setErro] = useState<string>();
  const [pendente, setPendente] = useState<string>();

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const nome = String(dados.get("nome") ?? "").trim();
    if (!nome) return setErro("Diga seu nome.");
    try {
      const { usuario } = usarConvite(String(dados.get("codigo") ?? ""), { id: `novo-${Date.now()}`, nome }, convites, hoje);
      setPendente(usuario.nome);
      setErro(undefined);
    } catch (err) {
      setErro(err instanceof ErroRegra ? err.message : "Não foi possível entrar.");
    }
  };

  if (pendente) {
    return (
      <Cartao destaque className="flex flex-col gap-2 text-center" >
        <h1 className="font-display text-xl font-extrabold">Pedido enviado, {pendente}!</h1>
        <p className="text-sm text-texto-2" data-testid="aguardando-aprovacao">
          Seu convite é válido. Agora o administrador precisa aprovar sua entrada. Você recebe um aviso assim que for liberado.
        </p>
      </Cartao>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <h1 className="font-display text-xl font-extrabold">Entrar com convite</h1>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-texto-2">
        Seu nome
        <input name="nome" autoComplete="name" className="min-h-12 rounded-xl border border-borda bg-superficie px-3.5 text-[15px] text-texto" />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-texto-2">
        Código de convite
        <input name="codigo" placeholder="MERC-XXXX" autoCapitalize="characters" className="min-h-12 rounded-xl border border-borda bg-superficie px-3.5 font-mono text-[15px] uppercase text-texto" />
      </label>
      {erro && <p role="alert" className="text-[13px] text-ambar">{erro}</p>}
      <button type="submit" className="min-h-12 rounded-xl bg-roxo text-[15px] font-bold text-white">Pedir para entrar</button>
      <p className="text-center text-xs text-muted">Não tem código? Peça a um amigo que já usa o meumercado.</p>
    </form>
  );
}
