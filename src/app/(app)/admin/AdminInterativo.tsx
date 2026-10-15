"use client";

import { useState } from "react";
import { Avatar, Cartao, Numero } from "@/components/ui";
import { aprovarEntrada, ErroRegra, pedidosPendentes, recusarEntrada } from "@/domain/convites";
import type { Usuario } from "@/domain/tipos";

interface Revisao {
  id: string;
  descricaoNota: string;
  sugestao: string;
  mercado: string;
}

/** Aprovação de entradas e revisão de produtos. Estado só no navegador até o Supabase (docs/05-roteiro.md). */
export function AdminInterativo({
  admin,
  usuariosIniciais,
  revisoesIniciais,
  estatisticas,
}: {
  admin: Usuario;
  usuariosIniciais: Usuario[];
  revisoesIniciais: Revisao[];
  estatisticas: { membros: number; mercados: number; precos: number };
}) {
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [revisoes, setRevisoes] = useState(revisoesIniciais);
  const [aviso, setAviso] = useState<string>();
  const pendentes = pedidosPendentes(usuarios);
  const nome = (id?: string) => usuarios.find((u) => u.id === id)?.nome ?? "?";
  const membros = usuarios.filter((u) => u.status === "ativo").length;

  const decidir = (usuarioId: string, aprovar: boolean) => {
    try {
      setUsuarios((atual) => (aprovar ? aprovarEntrada : recusarEntrada)(admin, usuarioId, atual));
      setAviso(`${nome(usuarioId)} ${aprovar ? "foi aprovado(a) e já pode usar o app" : "foi recusado(a)"}.`);
    } catch (e) {
      setAviso(e instanceof ErroRegra ? e.message : "Algo deu errado.");
    }
  };

  return (
    <>
      <h1 className="font-display text-[26px] font-extrabold">Painel do administrador</h1>

      <div className="grid grid-cols-3 gap-2.5">
        <Numero valor={membros} rotulo="membros" />
        <Numero valor={estatisticas.mercados} rotulo="mercados" />
        <Numero valor={estatisticas.precos.toLocaleString("pt-BR")} rotulo="preços" />
      </div>

      {aviso && <p role="status" className="rounded-xl bg-roxo-fundo p-3 text-[13px] font-semibold">{aviso}</p>}

      <section aria-labelledby="pedidos" className="flex flex-col gap-2.5">
        <h2 id="pedidos" className="text-base font-bold">
          Pedidos de entrada <span className="text-roxo-suave" data-testid="total-pedidos">({pendentes.length})</span>
        </h2>
        {pendentes.length === 0 && <p className="text-sm text-muted">Nenhum pedido esperando.</p>}
        {pendentes.map((u) => (
          <Cartao key={u.id} className="flex flex-col gap-3 !p-3.5" >
            <div className="flex items-center gap-3">
              <Avatar nome={u.nome} tamanho={40} />
              <span className="flex flex-col">
                <span className="text-[15px] font-bold">{u.nome}</span>
                <span className="text-xs text-muted">convidado(a) por {nome(u.convidadoPor)}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => decidir(u.id, false)} className="min-h-11 flex-1 rounded-xl border border-borda-forte text-sm font-bold">
                Recusar {u.nome}
              </button>
              <button type="button" onClick={() => decidir(u.id, true)} className="min-h-11 flex-1 rounded-xl bg-roxo text-sm font-bold text-white">
                Aprovar {u.nome}
              </button>
            </div>
          </Cartao>
        ))}
      </section>

      <section aria-labelledby="revisao" className="flex flex-col gap-2.5">
        <h2 id="revisao" className="text-base font-bold">Produtos para revisar</h2>
        <p className="text-[13px] text-muted">Descrições de nota que o sistema não ligou sozinho a um produto.</p>
        {revisoes.length === 0 && <p className="text-sm text-muted">Tudo revisado.</p>}
        {revisoes.map((r) => (
          <Cartao key={r.id} className="flex flex-col gap-2 !p-3.5">
            <span className="font-mono text-[13px]">{r.descricaoNota}</span>
            <span className="text-xs text-muted">{r.mercado} · sugestão: <span className="font-semibold text-texto">{r.sugestao}</span></span>
            <button type="button" onClick={() => setRevisoes((a) => a.filter((x) => x.id !== r.id))} className="min-h-10 self-start rounded-lg bg-roxo-chip px-3 text-[13px] font-bold text-roxo-suave">
              Confirmar sugestão
            </button>
          </Cartao>
        ))}
      </section>
    </>
  );
}
