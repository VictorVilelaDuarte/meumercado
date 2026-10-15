import Link from "next/link";
import { Cabecalho, FotoProduto, Pagina } from "@/components/ui";
import { ofertasDaSemana } from "@/data/consultas";
import { repositorio } from "@/data/repositorio";
import { formatarPercentual, formatarReais, tempoRelativo } from "@/domain/formato";
import { CATEGORIAS, type Categoria } from "@/domain/tipos";

/** Hub de Ofertas: maiores quedas dos últimos 7 dias (docs/06-telas.md#ofertas). ?c=<categoria> filtra. */
export default async function Ofertas({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const categoria = CATEGORIAS.includes(c as Categoria) ? (c as Categoria) : undefined;
  const todas = ofertasDaSemana();
  const ofertas = todas.filter((o) => !categoria || o.produto.categoria === categoria);
  const categorias = [...new Set(todas.map((o) => o.produto.categoria))];
  const [principal, ...resto] = ofertas;
  const hoje = repositorio.hoje();

  return (
    <Pagina>
      <Cabecalho voltarPara="/" titulo="Ofertas" />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] font-extrabold">Ofertas da semana</h1>
        <p className="text-[13px] text-muted">Maiores quedas de preço em São José, vistas nas notas dos últimos 7 dias</p>
      </div>

      <nav aria-label="Categorias" className="flex flex-wrap gap-2">
        {[undefined, ...categorias].map((cat) => (
          <Link
            key={cat ?? "todas"}
            href={cat ? `/ofertas?c=${encodeURIComponent(cat)}` : "/ofertas"}
            aria-current={categoria === cat ? "true" : undefined}
            className={`rounded-full px-3.5 py-2 text-[13px] no-underline ${categoria === cat ? "bg-roxo font-bold text-white" : "border border-borda bg-superficie font-semibold text-texto-2"}`}
          >
            {cat ?? "Todas"}
          </Link>
        ))}
      </nav>

      {!principal ? (
        <p className="text-sm text-texto-2">Nenhuma queda de preço nesta categoria esta semana.</p>
      ) : (
        <>
          <Link href={`/produto/${principal.produtoId}`} className="flex flex-col gap-2.5 rounded-[20px] bg-roxo p-[18px] text-white no-underline">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">Maior queda</span>
              <span className="text-[22px] font-extrabold">{formatarPercentual(principal.variacao)}</span>
            </div>
            <span className="font-display text-[22px] font-semibold">{principal.produto.nome}</span>
            <div className="flex items-end justify-between">
              <span className="text-[13px] text-[#EDE6FF]">
                {principal.mercado.nome} · {tempoRelativo(principal.data, hoje)}
              </span>
              <span className="flex flex-col items-end">
                <s className="text-xs text-[#EDE6FF]">{formatarReais(principal.valorAnterior)}</s>
                <span className="text-[22px] font-extrabold">{formatarReais(principal.valorAtual)}</span>
              </span>
            </div>
          </Link>
          <ul className="grid grid-cols-2 gap-2.5">
            {resto.map((o) => (
              <li key={`${o.produtoId}-${o.mercadoId}`}>
                <Link href={`/produto/${o.produtoId}`} className="flex h-full flex-col gap-1.5 rounded-2xl border border-borda bg-superficie p-3 no-underline">
                  <FotoProduto tamanho={72} />
                  <span className="text-sm font-semibold">{o.produto.nome}</span>
                  <span className="text-xs text-muted">{o.mercado.nome}</span>
                  <span className="mt-auto flex items-baseline justify-between">
                    <span className="text-base font-extrabold">{formatarReais(o.valorAtual)}</span>
                    <span className="text-xs font-bold text-verde">{formatarPercentual(o.variacao)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Pagina>
  );
}
