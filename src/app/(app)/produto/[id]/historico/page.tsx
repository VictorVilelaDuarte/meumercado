import { notFound } from "next/navigation";
import { GraficoLinhas } from "@/components/Graficos";
import { Icone } from "@/components/Icone";
import { BotaoLink, Cabecalho, Cartao, Pagina } from "@/components/ui";
import { repositorio } from "@/data/repositorio";
import { formatarPercentual, formatarReais } from "@/domain/formato";
import { mediaPorMes, menorPrecoPorMes, variacaoPercentual } from "@/domain/precos";

/** Histórico de preço de um produto (docs/06-telas.md#historico). */
export default async function Historico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const produto = repositorio.produto(id);
  if (!produto) notFound();
  const menor = menorPrecoPorMes(repositorio.observacoes(), id).slice(-6);
  const media = mediaPorMes(repositorio.observacoes(), id).slice(-6);
  const variacao = menor.length >= 2 ? variacaoPercentual(menor[0].valor, menor.at(-1)!.valor) : undefined;
  const minimo = menor.length ? Math.min(...menor.map((m) => m.valor)) : undefined;

  return (
    <Pagina>
      <Cabecalho voltarPara={`/produto/${id}`} titulo="Histórico de preço" />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[22px] font-semibold leading-tight">{produto.nome}</h1>
        <p className="text-[13px] text-muted">Menor preço e média da cidade nos últimos 6 meses</p>
      </div>

      {menor.length < 2 ? (
        <Cartao>
          <p className="text-sm text-texto-2">Ainda não há meses suficientes para mostrar o histórico.</p>
        </Cartao>
      ) : (
        <>
          <Cartao>
            <GraficoLinhas
              rotulo={`Menor preço de ${formatarReais(menor[0].valor)} para ${formatarReais(menor.at(-1)!.valor)} em 6 meses`}
              formatar={(v) => formatarReais(v).replace(/,\d\d$/, "")}
              series={[
                { nome: "Menor preço", cor: "#4ADE80", pontos: menor },
                { nome: "Média da cidade", cor: "#6F6888", pontos: media },
              ]}
            />
          </Cartao>
          <div className="flex gap-2.5">
            <Cartao className="flex flex-1 flex-col gap-0.5 !p-3">
              <span className="text-xs text-muted">Variação em 6 meses</span>
              <span className={`text-xl font-extrabold ${variacao! <= 0 ? "text-verde" : "text-ambar"}`}>{formatarPercentual(variacao!, { sinal: true })}</span>
            </Cartao>
            <Cartao className="flex flex-1 flex-col gap-0.5 !p-3">
              <span className="text-xs text-muted">Mais barato no período</span>
              <span className="text-xl font-extrabold">{formatarReais(minimo!)}</span>
            </Cartao>
          </div>
        </>
      )}

      <Cartao destaque className="flex items-center gap-3 !p-3.5">
        <Icone nome="sino" className="text-roxo-suave" />
        <span className="flex-1 text-sm font-semibold">Quer saber quando baixar?</span>
        <BotaoLink href="/alertas" className="!h-10 px-4 text-sm">
          Criar alerta
        </BotaoLink>
      </Cartao>
    </Pagina>
  );
}
