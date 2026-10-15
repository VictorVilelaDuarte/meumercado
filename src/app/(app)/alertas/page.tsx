import Link from "next/link";
import { Icone } from "@/components/Icone";
import { BarraProgresso, Cabecalho, Cartao, Pagina } from "@/components/ui";
import { nomeMercado } from "@/data/consultas";
import { repositorio } from "@/data/repositorio";
import { avaliarAlerta } from "@/domain/engajamento";
import { formatarReais } from "@/domain/formato";

/** Alertas de preço-alvo (docs/06-telas.md#alertas). */
export default function Alertas() {
  const usuario = repositorio.usuarioAtual();
  const hoje = repositorio.hoje();
  const estados = repositorio.alertasDoUsuario(usuario.id).map((a) => avaliarAlerta(a, repositorio.observacoes(), hoje));
  const atingidos = estados.filter((e) => e.atingiu);
  const pendentes = estados.filter((e) => !e.atingiu);

  return (
    <Pagina>
      <Cabecalho voltarPara="/" titulo="Alertas" />
      <h1 className="font-display text-[26px] font-extrabold">Alertas de preço</h1>

      {atingidos.map((e) => (
        <Cartao key={e.alerta.id} destaque className="flex items-center gap-3 !p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-verde/15 text-verde">
            <Icone nome="check" />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-bold">{repositorio.produto(e.alerta.produtoId)?.nome} chegou ao seu preço</span>
            <span className="text-[13px] text-texto-2">
              {formatarReais(e.menorAtual!.valor)} no {nomeMercado(e.menorAtual!.mercadoId)} · meta {formatarReais(e.alerta.meta)}
            </span>
          </span>
        </Cartao>
      ))}

      <section aria-labelledby="meus" className="flex flex-col gap-2.5">
        <h2 id="meus" className="text-base font-bold">
          Esperando baixar
        </h2>
        {pendentes.map((e) => {
          const produto = repositorio.produto(e.alerta.produtoId)!;
          return (
            <Link key={e.alerta.id} href={`/produto/${produto.id}`} className="no-underline">
              <Cartao className="flex flex-col gap-2.5 !p-3.5">
                <span className="text-[15px] font-semibold">{produto.nome}</span>
                <span className="flex justify-between text-[13px]">
                  <span className="text-muted">Hoje: {e.menorAtual ? formatarReais(e.menorAtual.valor) : "sem preço"}</span>
                  <span className="font-bold">Meta: {formatarReais(e.alerta.meta)}</span>
                </span>
                <BarraProgresso fracao={e.progresso} cor="roxo-claro" rotulo={`Progresso até a meta de ${produto.nome}`} />
                <span className="text-xs text-muted">Faltam {formatarReais(e.faltam)} para a meta</span>
              </Cartao>
            </Link>
          );
        })}
      </section>

      <section aria-labelledby="auto" className="flex flex-col gap-1">
        <h2 id="auto" className="text-base font-bold">
          Avisos automáticos
        </h2>
        {[
          { id: "suspeito", titulo: "Preço suspeito na nota", detalhe: "Muito acima da média da cidade", ligado: true },
          { id: "promo", titulo: "Promoção nos meus produtos", detalhe: "Itens que você compra sempre", ligado: false },
        ].map((a) => (
          <label key={a.id} className="flex min-h-14 items-center justify-between gap-3">
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{a.titulo}</span>
              <span className="text-xs text-muted">{a.detalhe}</span>
            </span>
            <input type="checkbox" role="switch" defaultChecked={a.ligado} className="h-6 w-6" />
          </label>
        ))}
      </section>
    </Pagina>
  );
}
