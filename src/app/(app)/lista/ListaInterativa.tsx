"use client";

import { useMemo, useState } from "react";
import { BotaoLink, Cartao, Pagina } from "@/components/ui";
import { formatarReais } from "@/domain/formato";
import { calcularLista } from "@/domain/lista";
import { precosAtuais } from "@/domain/precos";
import type { ListaCompras, Mercado, ObservacaoPreco, Produto } from "@/domain/tipos";

/**
 * Estado só no navegador: marcar itens não é salvo ainda (sem banco). Ver docs/05-roteiro.md, Fase 1.
 */
export function ListaInterativa({
  lista,
  produtos,
  mercados,
  observacoes,
  hoje,
}: {
  lista: ListaCompras;
  produtos: Produto[];
  mercados: Mercado[];
  observacoes: ObservacaoPreco[];
  hoje: string;
}) {
  const [itens, setItens] = useState(lista.itens);
  const resultado = useMemo(() => calcularLista(itens, observacoes, hoje), [itens, observacoes, hoje]);
  const nome = (id: string) => mercados.find((m) => m.id === id)?.nome ?? id;
  const melhor = resultado.melhorCombinacao ?? resultado.melhorUnico;
  const economia = melhor ? resultado.totalMedioCidade - melhor.total : 0;
  const pendentes = itens.filter((i) => !i.comprado).length;

  const alternar = (produtoId: string) => setItens((atual) => atual.map((i) => (i.produtoId === produtoId ? { ...i, comprado: !i.comprado } : i)));

  return (
    <Pagina>
      <div className="flex flex-col gap-0.5">
        <p className="text-[13px] text-muted">Lista de compras</p>
        <h1 className="font-display text-[26px] font-extrabold">{lista.nome}</h1>
      </div>

      {melhor ? (
        <Cartao destaque className="flex flex-col gap-3" >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-roxo-suave">MELHOR OPÇÃO</span>
            <span className="text-xs text-muted">{pendentes} itens</span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-bold" data-testid="melhor-opcao">
                {melhor.mercadoIds.map(nome).join(" + ")}
              </span>
              {melhor.mercadoIds.length === 2 && (
                <span className="text-[13px] text-muted">
                  {melhor.mercadoIds
                    .map((id) => `${Object.values(melhor.atribuicao).filter((m) => m === id).length} itens no ${nome(id).replace(/^Mercado /, "")}`)
                    .join(", ")}
                </span>
              )}
            </div>
            <span className="text-[22px] font-extrabold" data-testid="total-lista">
              {formatarReais(melhor.total)}
            </span>
          </div>
          {economia > 0 && <p className="text-[13px] font-bold text-verde">Economia de {formatarReais(economia)} contra a média da cidade</p>}
          {resultado.porMercado.length > 0 && <div className="h-px bg-borda" />}
          {resultado.porMercado.slice(0, 2).map((o) => (
            <div key={o.mercadoIds[0]} className="flex justify-between text-[13px]">
              <span className="text-texto-2">Só no {nome(o.mercadoIds[0]).replace(/^Mercado /, "")}</span>
              <span className="font-bold">{formatarReais(o.total)}</span>
            </div>
          ))}
        </Cartao>
      ) : (
        <Cartao>
          <p className="text-sm text-texto-2">{pendentes === 0 ? "Tudo comprado!" : "Nenhum mercado tem preço para todos os itens ainda."}</p>
        </Cartao>
      )}

      <ul className="flex flex-col">
        {itens.map((item) => {
          const produto = produtos.find((p) => p.id === item.produtoId)!;
          const atribuido = melhor?.atribuicao[item.produtoId];
          const preco = atribuido ? precosAtuais(observacoes, item.produtoId, hoje).find((o) => o.mercadoId === atribuido)?.valor : undefined;
          return (
            <li key={item.produtoId} className="border-b border-superficie-2 last:border-b-0">
              <label className="flex min-h-14 items-center gap-3 py-3">
                <input type="checkbox" checked={item.comprado} onChange={() => alternar(item.produtoId)} className="h-[22px] w-[22px]" />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className={`text-sm font-semibold ${item.comprado ? "text-muted line-through" : ""}`}>
                    {item.quantidade > 1 ? `${item.quantidade}× ` : ""}
                    {produto.nome}
                  </span>
                  <span className="text-xs text-muted">{item.comprado ? "comprado" : atribuido ? nome(atribuido) : "sem preço"}</span>
                </span>
                {!item.comprado && preco !== undefined && <span className="text-sm font-bold">{formatarReais(preco * item.quantidade)}</span>}
              </label>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2.5">
        <BotaoLink href="/busca" variante="secundario" className="flex-1">
          Adicionar item
        </BotaoLink>
        <BotaoLink href="/mercados" className="flex-1">
          Ver no mapa
        </BotaoLink>
      </div>
    </Pagina>
  );
}
