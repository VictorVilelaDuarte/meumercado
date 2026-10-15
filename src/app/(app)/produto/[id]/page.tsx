import Link from "next/link";
import { notFound } from "next/navigation";
import { Icone } from "@/components/Icone";
import { Mapa, PinoPreco, corDaFaixa } from "@/components/Mapa";
import { Cabecalho, Cartao, FotoProduto, Pagina, Selo } from "@/components/ui";
import { resumoDoProduto } from "@/data/consultas";
import { repositorio } from "@/data/repositorio";
import { formatarReais, tempoRelativo } from "@/domain/formato";
import { posicaoNaFaixa } from "@/domain/precos";

const UNIDADE: Record<string, string> = { rolo: "por rolo", kg: "por kg", l: "por litro", un: "por unidade" };

/** Produto com mapa de preços (docs/06-telas.md#produto). */
export default async function PaginaProduto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const produto = repositorio.produto(id);
  if (!produto) notFound();
  const { atuais, resumo, porUnidadeMenor } = resumoDoProduto(produto);
  const hoje = repositorio.hoje();
  const mercados = repositorio.mercados();

  return (
    <Pagina>
      <Cabecalho
        voltarPara="/busca"
        titulo="Produto"
        direita={
          <Link href="/alertas" aria-label="Criar alerta de preço" className="flex h-11 w-11 items-center justify-center text-roxo-claro">
            <Icone nome="sino" />
          </Link>
        }
      />

      <div className="flex items-center gap-3.5">
        <FotoProduto tamanho={72} />
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-[22px] font-semibold leading-tight">{produto.nome}</h1>
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <Selo>{produto.categoria}</Selo>
            {produto.ean ? `EAN ${produto.ean}` : "código de barras ainda não lido"}
          </div>
        </div>
      </div>

      {!resumo ? (
        <Cartao>
          <p className="text-sm text-texto-2">Ninguém do grupo viu este produto nos últimos 30 dias.</p>
        </Cartao>
      ) : (
        <>
          <div className="flex gap-2.5">
            <div className="flex flex-1 flex-col gap-0.5 rounded-[14px] bg-roxo p-3 text-white">
              <span className="text-xs opacity-90">Mais barato</span>
              <span className="text-xl font-bold">{formatarReais(resumo.menor.valor)}</span>
              {porUnidadeMenor !== undefined && (
                <span className="text-xs opacity-90">
                  {formatarReais(porUnidadeMenor)} {UNIDADE[produto.unidadeMedida]}
                </span>
              )}
            </div>
            <Cartao className="flex flex-1 flex-col gap-0.5 !p-3">
              <span className="text-xs text-muted">Você economiza até</span>
              <span className="text-xl font-bold text-verde">{formatarReais(resumo.economiaMaxima)}</span>
              <span className="text-xs text-muted">contra o mais caro</span>
            </Cartao>
          </div>

          <Mapa
            mercados={mercados}
            legenda
            rotulo={`Mapa de São José dos Campos com o preço de ${produto.nome} em ${resumo.quantidadeMercados} mercados`}
            pinos={atuais.map((o, i) => ({
              mercado: repositorio.mercado(o.mercadoId)!,
              conteudo: <PinoPreco texto={formatarReais(o.valor)} cor={corDaFaixa(posicaoNaFaixa(o.valor, resumo.menor.valor, resumo.maior.valor))} destaque={i === 0} />,
            }))}
          />

          <section className="flex flex-col gap-2" aria-labelledby="lista-mercados">
            <div className="flex items-baseline justify-between">
              <h2 id="lista-mercados" className="text-base font-bold">
                {resumo.quantidadeMercados} mercados com preço
              </h2>
              <Link href={`/produto/${produto.id}/historico`} className="text-[13px] font-semibold text-roxo-claro no-underline">
                Ver histórico
              </Link>
            </div>
            <ol className="flex flex-col gap-2">
              {atuais.map((o, i) => {
                const mercado = repositorio.mercado(o.mercadoId)!;
                return (
                  <li key={o.mercadoId} className={`flex items-center gap-3 rounded-xl border bg-superficie px-3 py-2.5 ${i === 0 ? "border-roxo" : "border-borda"}`}>
                    <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-roxo text-white" : "bg-roxo-chip text-roxo-suave"}`}>{i + 1}</span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold">{mercado.nome}</span>
                      <span className="text-xs text-muted">
                        {mercado.bairro} · visto {tempoRelativo(o.data, hoje)}
                      </span>
                    </span>
                    <span className={`text-[15px] font-bold ${i === 0 ? "text-verde" : ""}`}>{formatarReais(o.valor)}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      )}
    </Pagina>
  );
}
