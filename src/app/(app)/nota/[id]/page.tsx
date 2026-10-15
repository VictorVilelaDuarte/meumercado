import { notFound } from "next/navigation";
import { Icone } from "@/components/Icone";
import { Cabecalho, Cartao, Pagina, Selo } from "@/components/ui";
import { repositorio } from "@/data/repositorio";
import { formatarPercentual, formatarReais } from "@/domain/formato";
import { compararItensComMedia, totalNota } from "@/domain/gastos";

/** Detalhe de uma nota do PRÓPRIO usuário (docs/06-telas.md#nota). Nota de outra pessoa → 404. */
export default async function DetalheNota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = repositorio.usuarioAtual();
  const nota = repositorio.nota(usuario.id, decodeURIComponent(id));
  if (!nota) notFound();
  const mercado = repositorio.mercado(nota.mercadoId)!;
  const comparacao = compararItensComMedia(nota, repositorio.observacoes());
  const abaixo = comparacao.filter((c) => c.rotulo === "abaixo").length;
  const acima = comparacao.filter((c) => c.rotulo === "acima").length;

  return (
    <Pagina>
      <Cabecalho
        voltarPara="/gastos"
        titulo="Nota fiscal"
        direita={
          <span className="flex items-center gap-1 text-xs font-semibold text-roxo-suave">
            <Icone nome="cadeado" tamanho={13} /> Privada
          </span>
        }
      />

      <Cartao className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="font-display text-xl font-semibold">{mercado.nome}</h1>
            <p className="text-xs text-muted">
              {mercado.endereco} · CNPJ {mercado.cnpj}
            </p>
            <p className="text-xs text-muted">
              {nota.data.split("-").reverse().join("/")} · {nota.itens.length} itens
            </p>
          </div>
          <span className="text-xl font-extrabold">{formatarReais(totalNota(nota))}</span>
        </div>
        <div className="flex gap-2">
          <Selo tom="verde">{abaixo} abaixo da média</Selo>
          <Selo tom="ambar">{acima} acima da média</Selo>
        </div>
      </Cartao>

      <ul className="flex flex-col">
        {comparacao.map(({ item, rotulo, diferenca }, i) => {
          const produto = item.produtoId ? repositorio.produto(item.produtoId) : undefined;
          const texto =
            rotulo === "abaixo"
              ? `${formatarPercentual(Math.abs(diferenca!))} abaixo da média`
              : rotulo === "acima"
                ? `${formatarPercentual(diferenca!)} acima da média`
                : rotulo === "na_media"
                  ? "na média"
                  : "sem comparação";
          const cor = rotulo === "abaixo" ? "text-verde" : rotulo === "acima" ? "text-ambar" : "text-muted";
          return (
            <li key={i} className="flex items-center justify-between gap-3 border-b border-superficie-2 py-3 last:border-b-0">
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{produto?.nome ?? item.descricaoOriginal}</span>
                <span className="text-xs text-muted">
                  {produto?.categoria ?? "Sem categoria"} · {item.quantidade.toLocaleString("pt-BR")} {produto?.unidadeMedida === "kg" && produto.quantidadeEmbalagem === 1 ? "kg" : "un"}
                </span>
              </span>
              <span className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-bold">{formatarReais(item.valorUnitario * item.quantidade)}</span>
                <span className={`text-[11px] font-bold ${cor}`}>{texto}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-center text-xs text-muted">Os preços entram no mapa sem mostrar quem comprou.</p>
    </Pagina>
  );
}
