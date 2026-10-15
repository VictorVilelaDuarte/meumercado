import { Icone } from "@/components/Icone";
import { Avatar, Cabecalho, Pagina } from "@/components/ui";
import { repositorio } from "@/data/repositorio";
import { rankingDesafio } from "@/domain/engajamento";
import { diasEntre, formatarPercentual } from "@/domain/formato";

/**
 * Desafio de Economia do mês (docs/06-telas.md#desafio).
 * O ranking mostra só nome e percentual: nunca itens ou valores das notas dos outros.
 */
export default function Desafio() {
  const hoje = repositorio.hoje();
  const mes = hoje.slice(0, 7);
  const usuario = repositorio.usuarioAtual();
  const ativos = repositorio.usuarios().filter((u) => u.status === "ativo");
  const notas = repositorio.notasParaRanking().filter((n) => n.data.startsWith(mes));
  const ranking = rankingDesafio(
    ativos.map((u) => ({ usuarioId: u.id, nome: u.nome, notas: notas.filter((n) => n.usuarioId === u.id) })).filter((p) => p.notas.length > 0),
    repositorio.observacoes(),
  );
  const eu = ranking.find((r) => r.usuarioId === usuario.id);
  const mediaGrupo = ranking.length ? ranking.reduce((s, r) => s + r.economia, 0) / ranking.length : 0;
  const [ano, m] = mes.split("-").map(Number);
  const fimDoMes = new Date(Date.UTC(ano, m, 0)).toISOString().slice(0, 10);

  return (
    <Pagina>
      <Cabecalho voltarPara="/" titulo="Desafio" />
      <div className="flex flex-col gap-1">
        <p className="text-[13px] text-muted">Desafio do mês</p>
        <h1 className="font-display text-[26px] font-extrabold">Quem mais economizou</h1>
      </div>

      {eu && (
        <div className="flex flex-col gap-3 rounded-[20px] bg-roxo p-[18px]">
          <div className="flex justify-between text-[13px] text-[#EDE6FF]">
            <span>Você está em</span>
            <span>faltam {diasEntre(hoje, fimDoMes)} dias</span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-5xl font-extrabold leading-none">{eu.posicao}º</span>
            <span className="text-[15px] font-semibold">de {ranking.length} no grupo</span>
          </div>
          <div className="flex gap-2.5">
            <div className="flex flex-1 flex-col gap-0.5 rounded-xl bg-black/25 p-2.5">
              <span className="text-xs text-[#EDE6FF]">Sua economia</span>
              <span className="text-lg font-extrabold">{formatarPercentual(eu.economia, { casas: 1 })}</span>
            </div>
            <div className="flex flex-1 flex-col gap-0.5 rounded-xl bg-black/25 p-2.5">
              <span className="text-xs text-[#EDE6FF]">Média do grupo</span>
              <span className="text-lg font-extrabold">{formatarPercentual(mediaGrupo, { casas: 1 })}</span>
            </div>
          </div>
        </div>
      )}

      <p className="text-[13px] leading-snug text-muted">Economia = quanto você pagou abaixo da média da cidade nos mesmos produtos.</p>

      <ol className="flex flex-col gap-2">
        {ranking.map((r) => {
          const souEu = r.usuarioId === usuario.id;
          return (
            <li key={r.usuarioId} className={`flex items-center gap-3 rounded-[14px] border p-3 ${souEu ? "border-roxo bg-roxo-fundo" : "border-borda bg-superficie"}`}>
              <span className={`w-7 text-[15px] font-extrabold ${r.posicao === 1 ? "text-ambar" : souEu ? "text-roxo-suave" : "text-texto-2"}`}>{r.posicao}</span>
              <Avatar nome={r.nome} destaque={souEu} tamanho={36} />
              <span className={`flex-1 text-[15px] ${souEu ? "font-bold" : "font-semibold"}`}>{souEu ? "Você" : r.nome}</span>
              <span className="text-[15px] font-extrabold text-verde">{formatarPercentual(r.economia, { casas: 1 })}</span>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#4B3F6B] bg-superficie p-3.5">
        <Icone nome="estrela" preenchido className="shrink-0 text-roxo-claro" />
        <p className="text-[13px] leading-snug text-texto-2">Os 3 primeiros do mês ganham 300 pontos e a conquista &quot;Caçador de ofertas&quot;.</p>
      </div>
    </Pagina>
  );
}
