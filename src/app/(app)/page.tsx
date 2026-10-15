import Link from "next/link";
import { Icone } from "@/components/Icone";
import { Cartao, FotoProduto, Logo, Pagina, SecaoTitulo } from "@/components/ui";
import { ofertasDaSemana, rankingMercados } from "@/data/consultas";
import { repositorio } from "@/data/repositorio";
import { formatarPercentual, formatarReais, tempoRelativo } from "@/domain/formato";

/** Tela Início (docs/06-telas.md#inicio). */
export default function Inicio() {
  const usuario = repositorio.usuarioAtual();
  const hoje = repositorio.hoje();
  const ofertas = ofertasDaSemana().slice(0, 2);
  const ranking = rankingMercados().slice(0, 3);

  return (
    <Pagina>
      <header className="flex items-center justify-between">
        <Logo />
        <Link href="/perfil" className="flex items-center gap-1.5 rounded-full border border-borda bg-superficie px-2.5 py-1.5 text-[13px] font-bold no-underline">
          <Icone nome="estrela" tamanho={14} preenchido className="text-roxo-claro" />
          {usuario.pontos.toLocaleString("pt-BR")} pts
        </Link>
      </header>

      <div className="flex flex-col gap-1.5">
        <p className="flex items-center gap-1.5 text-[13px] text-muted">
          <Icone nome="local" tamanho={14} /> São José dos Campos
        </p>
        <h1 className="font-display text-[28px] font-semibold leading-tight">Olá, {usuario.nome}. Onde está mais barato hoje?</h1>
      </div>

      <form action="/busca" role="search">
        <label className="flex h-[52px] items-center gap-2.5 rounded-[14px] border border-borda bg-superficie px-3.5">
          <Icone nome="busca" tamanho={20} className="text-muted" />
          <span className="sr-only">Buscar produto</span>
          <input name="q" type="search" placeholder="Buscar produto, ex.: papel higiênico" className="flex-1 bg-transparent text-[15px] outline-none" />
        </label>
      </form>

      <Link href="/escanear" className="flex items-center gap-3.5 rounded-[18px] bg-roxo p-[18px] text-white no-underline shadow-[0_10px_30px_rgba(124,58,237,0.35)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
          <Icone nome="escanear" tamanho={26} />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[17px] font-bold">Escanear nota</span>
          <span className="text-[13px] opacity-90">Aponte para o QR code do cupom · +50 pts</span>
        </span>
        <Icone nome="avancar" tamanho={20} />
      </Link>

      <section className="flex flex-col gap-2.5" aria-labelledby="baixou">
        <SecaoTitulo
          acao={
            <Link href="/ofertas" className="text-[13px] font-semibold text-roxo-claro no-underline">
              Ver ofertas
            </Link>
          }
        >
          <span id="baixou">Baixou de preço</span>
        </SecaoTitulo>
        {ofertas.map((o) => (
          <Link key={`${o.produtoId}-${o.mercadoId}`} href={`/produto/${o.produtoId}`} className="flex items-center gap-3 rounded-[14px] border border-borda bg-superficie px-3.5 py-3 no-underline">
            <FotoProduto />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{o.produto.nome}</span>
              <span className="text-[13px] text-muted">
                {o.mercado.nome} · {tempoRelativo(o.data, hoje)}
              </span>
            </span>
            <span className="flex flex-col items-end gap-0.5">
              <span className="text-base font-bold">{formatarReais(o.valorAtual)}</span>
              <span className="text-xs font-bold text-verde">{formatarPercentual(o.variacao)}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-2.5" aria-labelledby="ranking">
        <SecaoTitulo>
          <span id="ranking">Mercados mais baratos da cidade</span>
        </SecaoTitulo>
        <ol className="grid grid-cols-3 gap-2.5">
          {ranking.map((r, i) => (
            <li key={r.mercado.id}>
              <Link href={`/mercados?m=${r.mercado.id}`} className="no-underline">
                <Cartao className={`flex h-full flex-col gap-1 !p-3 ${i === 0 ? "!border-roxo" : ""}`}>
                  <span className={`text-xs font-bold ${i === 0 ? "text-roxo-claro" : "text-muted"}`}>{i + 1}º</span>
                  <span className="text-sm font-semibold">{r.mercado.nome}</span>
                  <span className={`text-xs font-semibold ${(r.indice ?? 100) < 100 ? "text-verde" : "text-muted"}`}>índice {r.indice ?? "—"}</span>
                </Cartao>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <nav aria-label="Atalhos" className="grid grid-cols-2 gap-2.5">
        {[
          { href: "/alertas", rotulo: "Alertas", icone: "sino" as const },
          { href: "/despensa", rotulo: "Despensa", icone: "despensa" as const },
          { href: "/desafio", rotulo: "Desafio", icone: "trofeu" as const },
          { href: "/convites", rotulo: "Convidar", icone: "convidar" as const },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="flex min-h-12 items-center gap-2.5 rounded-[14px] border border-borda bg-superficie px-3.5 text-sm font-semibold no-underline">
            <Icone nome={a.icone} tamanho={20} className="text-roxo-claro" />
            {a.rotulo}
          </Link>
        ))}
      </nav>
    </Pagina>
  );
}
