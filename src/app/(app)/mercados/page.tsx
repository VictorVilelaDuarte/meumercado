import Link from "next/link";
import { Mapa } from "@/components/Mapa";
import { BotaoLink, Cartao, Numero, Pagina, Titulo } from "@/components/ui";
import { rankingMercados } from "@/data/consultas";
import { repositorio } from "@/data/repositorio";
import { tempoRelativo } from "@/domain/formato";

/** Mapa dos mercados com índice de preço (docs/06-telas.md#mercados). ?m=<id> escolhe o mercado em destaque. */
export default async function Mercados({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const ranking = rankingMercados();
  const selecionado = ranking.find((r) => r.mercado.id === m) ?? ranking[0];
  const hoje = repositorio.hoje();
  const corIndice = (i?: number) => (i === undefined ? "text-texto" : i < 100 ? "text-verde" : i > 104 ? "text-ambar" : "text-texto");

  return (
    <Pagina>
      <Titulo sobre="Índice 100 = média de São José">Mercados da cidade</Titulo>

      <Mapa
        mercados={repositorio.mercados()}
        altura={300}
        rotulo={`Mapa com ${ranking.length} mercados e seus índices de preço`}
        pinos={ranking.map((r) => {
          const ativo = r.mercado.id === selecionado.mercado.id;
          return {
            mercado: r.mercado,
            conteudo: (
              <Link href={`/mercados?m=${r.mercado.id}`} aria-label={`${r.mercado.nome}, índice ${r.indice ?? "sem dados"}`} className="flex flex-col items-center gap-1 no-underline">
                <span
                  className={`flex items-center justify-center rounded-full font-extrabold ${ativo ? "h-[52px] w-[52px] border-[3px] border-white bg-roxo text-[15px] text-white shadow-[0_0_0_8px_rgba(124,58,237,0.3)]" : `h-[42px] w-[42px] border-2 border-[#4B3F6B] bg-roxo-chip text-[13px] ${corIndice(r.indice)}`}`}
                >
                  {r.indice ?? "—"}
                </span>
                <span className="rounded-md bg-fundo px-1.5 py-0.5 text-[11px] font-semibold">{r.mercado.nome.replace(/^Mercado /, "")}</span>
              </Link>
            ),
          };
        })}
      />

      <Cartao className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-display text-[22px] font-semibold">{selecionado.mercado.nome}</h2>
            <p className="text-[13px] text-muted">
              {selecionado.mercado.bairro} · {selecionado.mercado.endereco}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-2xl font-extrabold ${corIndice(selecionado.indice)}`}>{selecionado.indice ?? "—"}</span>
            <span className="text-[11px] text-muted">índice</span>
          </div>
        </div>
        {selecionado.indice !== undefined && (
          <p className="text-[13px] leading-snug text-texto-2">
            {selecionado.indice < 100
              ? `Em média ${100 - selecionado.indice}% mais barato que a cidade.`
              : selecionado.indice > 100
                ? `Em média ${selecionado.indice - 100}% mais caro que a cidade.`
                : "Na média da cidade."}
          </p>
        )}
        <div className="flex gap-2">
          <Numero valor={selecionado.produtosComPreco} rotulo="produtos com preço" />
          <Numero valor={selecionado.coletas} rotulo="dias com notas" />
          <Numero valor={selecionado.ultimaColeta ? tempoRelativo(selecionado.ultimaColeta, hoje) : "—"} rotulo="última nota" />
        </div>
        <BotaoLink href="/busca">Ver produtos</BotaoLink>
      </Cartao>

      <section aria-labelledby="todos" className="flex flex-col gap-2">
        <h2 id="todos" className="text-base font-bold">
          Todos os mercados
        </h2>
        <ol className="flex flex-col gap-2">
          {ranking.map((r, i) => (
            <li key={r.mercado.id}>
              <Link href={`/mercados?m=${r.mercado.id}`} className="flex items-center gap-3 rounded-xl border border-borda bg-superficie px-3 py-2.5 no-underline">
                <span className="w-5 text-sm font-bold text-muted">{i + 1}</span>
                <span className="flex-1 text-sm font-semibold">{r.mercado.nome}</span>
                <span className={`text-sm font-extrabold ${corIndice(r.indice)}`}>{r.indice ?? "—"}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </Pagina>
  );
}
