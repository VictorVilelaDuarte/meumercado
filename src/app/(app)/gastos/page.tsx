import Link from "next/link";
import { GraficoBarrasMes } from "@/components/Graficos";
import { Icone } from "@/components/Icone";
import { BarraProgresso, Cartao, Pagina, Selo } from "@/components/ui";
import { nomeMercado } from "@/data/consultas";
import { repositorio } from "@/data/repositorio";
import { formatarPercentual, formatarReais, mesCurto } from "@/domain/formato";
import { economiaPerdida, inflacaoPessoal, totalNota, totalPorCategoria, totalPorMes } from "@/domain/gastos";
import { variacaoPercentual } from "@/domain/precos";

const NOMES_MES: Record<string, string> = { jan: "Janeiro", fev: "Fevereiro", mar: "Março", abr: "Abril", mai: "Maio", jun: "Junho", jul: "Julho", ago: "Agosto", set: "Setembro", out: "Outubro", nov: "Novembro", dez: "Dezembro" };

/** Meus gastos — PRIVADO (docs/06-telas.md#gastos). Só usa notas do usuário atual. */
export default function Gastos() {
  const usuario = repositorio.usuarioAtual();
  const notas = repositorio.notasDoUsuario(usuario.id);
  const meses = totalPorMes(notas).slice(-6);
  const atual = meses.at(-1);
  const anterior = meses.at(-2);
  const notasDoMes = atual ? notas.filter((n) => n.data.startsWith(atual.mes)) : [];
  const categorias = totalPorCategoria(notasDoMes, repositorio.produtos());
  const economia = economiaPerdida(notasDoMes, repositorio.observacoes());
  const primeiroMes = meses[0]?.mes;
  const inflacao =
    primeiroMes && atual
      ? inflacaoPessoal(notas, { de: `${primeiroMes}-01`, ate: `${primeiroMes}-31` }, { de: `${meses.at(-2)?.mes ?? atual.mes}-01`, ate: `${atual.mes}-31` })
      : undefined;

  return (
    <Pagina>
      <header className="flex items-center justify-between">
        <h1 className="font-display text-[26px] font-extrabold">Meus gastos</h1>
        <Selo>
          <span className="flex items-center gap-1.5">
            <Icone nome="cadeado" tamanho={13} /> Só você vê
          </span>
        </Selo>
      </header>

      {!atual ? (
        <Cartao>
          <p className="text-sm text-texto-2">Escaneie sua primeira nota para ver seus gastos aqui.</p>
        </Cartao>
      ) : (
        <>
          <Cartao className="flex flex-col gap-3.5">
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] text-muted">{NOMES_MES[mesCurto(atual.mes)]}</span>
                <span className="text-[30px] font-extrabold tracking-tight">{formatarReais(atual.total)}</span>
              </div>
              {anterior && (
                <span className={`text-[13px] font-bold ${atual.total <= anterior.total ? "text-verde" : "text-ambar"}`}>
                  {formatarPercentual(variacaoPercentual(anterior.total, atual.total), { sinal: true })} vs. {mesCurto(anterior.mes)}
                </span>
              )}
            </div>
            <GraficoBarrasMes dados={meses} rotulo={`Gasto por mês: ${meses.map((m) => `${mesCurto(m.mes)} ${formatarReais(m.total)}`).join(", ")}`} />
          </Cartao>

          <div className="flex gap-2.5">
            <div className="flex flex-1 flex-col gap-1 rounded-2xl bg-roxo p-3.5">
              <span className="text-xs text-[#EDE6FF]">Você teria economizado</span>
              <span className="text-xl font-extrabold">{formatarReais(economia)}</span>
              <span className="text-xs text-[#EDE6FF]">no mercado mais barato</span>
            </div>
            <Cartao className="flex flex-1 flex-col gap-1 !p-3.5">
              <span className="text-xs text-muted">Sua inflação</span>
              <span className={`text-xl font-extrabold ${inflacao !== undefined && inflacao > 0 ? "text-ambar" : "text-verde"}`}>
                {inflacao === undefined ? "—" : formatarPercentual(inflacao, { sinal: true, casas: 1 })}
              </span>
              <span className="text-xs text-muted">desde {primeiroMes ? mesCurto(primeiroMes) : "—"}</span>
            </Cartao>
          </div>

          <section aria-labelledby="cats" className="flex flex-col gap-2.5">
            <h2 id="cats" className="text-base font-bold">
              Por categoria
            </h2>
            {categorias.map((c) => (
              <div key={c.categoria} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span>{c.categoria}</span>
                  <span className="font-bold">{formatarReais(c.total)}</span>
                </div>
                <BarraProgresso fracao={c.fracao} cor="verde" rotulo={`${c.categoria}: ${formatarPercentual(c.fracao)} do mês`} />
              </div>
            ))}
          </section>

          <section aria-labelledby="notas" className="flex flex-col gap-2">
            <h2 id="notas" className="text-base font-bold">
              Notas do mês
            </h2>
            {notasDoMes.map((n) => (
              <Link key={n.id} href={`/nota/${encodeURIComponent(n.id)}`} className="flex items-center gap-3 rounded-xl border border-borda bg-superficie px-3 py-2.5 no-underline">
                <span className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold">{nomeMercado(n.mercadoId)}</span>
                  <span className="text-xs text-muted">
                    {n.data.split("-").reverse().join("/")} · {n.itens.length} itens
                  </span>
                </span>
                <span className="text-sm font-bold">{formatarReais(totalNota(n))}</span>
                <Icone nome="avancar" tamanho={18} className="text-muted" />
              </Link>
            ))}
          </section>
        </>
      )}
    </Pagina>
  );
}
