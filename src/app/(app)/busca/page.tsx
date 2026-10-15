import Link from "next/link";
import { Icone } from "@/components/Icone";
import { Cabecalho, FotoProduto, Pagina } from "@/components/ui";
import { resumoDoProduto } from "@/data/consultas";
import { repositorio } from "@/data/repositorio";
import { normalizarDescricao } from "@/domain/categorias";
import { formatarReais } from "@/domain/formato";
import { CATEGORIAS, type Categoria } from "@/domain/tipos";

const UNIDADE: Record<string, string> = { rolo: "por rolo", kg: "por kg", l: "por litro", un: "por unidade" };

/** Busca de produtos (docs/06-telas.md#busca). Filtros vão na URL: ?q=papel&c=Higiene&ordem=unidade */
export default async function Busca({ searchParams }: { searchParams: Promise<{ q?: string; c?: string; ordem?: string }> }) {
  const { q = "", c, ordem } = await searchParams;
  const termo = normalizarDescricao(q);
  const categoria = CATEGORIAS.includes(c as Categoria) ? (c as Categoria) : undefined;

  let resultados = repositorio
    .produtos()
    .filter((p) => !termo || normalizarDescricao(p.nome).includes(termo))
    .filter((p) => !categoria || p.categoria === categoria)
    .map(resumoDoProduto);
  if (ordem === "unidade") resultados = [...resultados].sort((a, b) => (a.porUnidadeMenor ?? Infinity) - (b.porUnidadeMenor ?? Infinity));

  const categoriasComResultado = [...new Set(repositorio.produtos().filter((p) => !termo || normalizarDescricao(p.nome).includes(termo)).map((p) => p.categoria))];
  const link = (extra: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const valores = { q: q || undefined, c: categoria, ordem, ...extra };
    for (const [k, v] of Object.entries(valores)) if (v) params.set(k, v);
    return `/busca?${params.toString()}`;
  };

  return (
    <Pagina>
      <Cabecalho voltarPara="/" titulo="Buscar" />
      <h1 className="sr-only">Buscar produtos</h1>
      <form role="search" action="/busca">
        <label className="flex h-12 items-center gap-2.5 rounded-[14px] border border-roxo bg-superficie px-3.5">
          <Icone nome="busca" tamanho={18} className="text-roxo-claro" />
          <span className="sr-only">Buscar produto</span>
          <input name="q" type="search" defaultValue={q} placeholder="Buscar produto" className="flex-1 bg-transparent text-[15px] outline-none" />
        </label>
        {categoria && <input type="hidden" name="c" value={categoria} />}
      </form>

      <nav aria-label="Filtros" className="flex flex-wrap gap-2">
        <FiltroLink href={link({ c: undefined })} ativo={!categoria}>
          Todos
        </FiltroLink>
        {categoriasComResultado.map((cat) => (
          <FiltroLink key={cat} href={link({ c: cat })} ativo={categoria === cat}>
            {cat}
          </FiltroLink>
        ))}
        <FiltroLink href={link({ ordem: ordem === "unidade" ? undefined : "unidade" })} ativo={ordem === "unidade"}>
          Menor preço por unidade
        </FiltroLink>
      </nav>

      <p className="text-[13px] text-muted" aria-live="polite">
        {resultados.length === 1 ? "1 produto encontrado" : `${resultados.length} produtos encontrados`}
      </p>

      <ul className="flex flex-col gap-2.5">
        {resultados.map(({ produto, resumo, porUnidadeMenor }) => (
          <li key={produto.id}>
            <Link href={`/produto/${produto.id}`} className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-3 no-underline">
              <FotoProduto tamanho={56} />
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{produto.nome}</span>
                {resumo ? (
                  <>
                    <span className="text-xs text-muted">
                      {resumo.quantidadeMercados} mercados · de {formatarReais(resumo.menor.valor)} a {formatarReais(resumo.maior.valor)}
                    </span>
                    {porUnidadeMenor !== undefined && (
                      <span className="text-xs font-bold text-verde">
                        {formatarReais(porUnidadeMenor)} {UNIDADE[produto.unidadeMedida]}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted">Sem preço nos últimos 30 dias</span>
                )}
              </span>
              <Icone nome="avancar" tamanho={18} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#4B3F6B] bg-[#1F1A2E] p-3.5">
        <Icone nome="info" className="shrink-0 text-roxo-claro" />
        <p className="text-[13px] leading-snug text-texto-2">Não achou o que queria? Quando alguém escanear uma nota com o produto, ele aparece aqui.</p>
      </div>
    </Pagina>
  );
}

function FiltroLink({ href, ativo, children }: { href: string; ativo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "true" : undefined}
      className={`rounded-full px-3.5 py-2 text-[13px] no-underline ${ativo ? "bg-roxo font-bold text-white" : "border border-borda bg-superficie font-semibold text-texto-2"}`}
    >
      {children}
    </Link>
  );
}
