import { mesCurto } from "@/domain/formato";

/** Barras verticais por mês (aba Meus gastos). O último mês fica em destaque. */
export function GraficoBarrasMes({ dados, rotulo }: { dados: { mes: string; total: number }[]; rotulo: string }) {
  const maximo = Math.max(1, ...dados.map((d) => d.total));
  return (
    <div role="img" aria-label={rotulo} className="flex h-24 items-end gap-2.5">
      {dados.map((d, i) => {
        const ultimo = i === dados.length - 1;
        return (
          <div key={d.mes} className="flex flex-1 flex-col items-center gap-1.5">
            <div className={`w-full rounded-md ${ultimo ? "bg-verde" : "bg-verde-fundo"}`} style={{ height: `${Math.max(6, (d.total / maximo) * 76)}px` }} />
            <span className={`text-[11px] ${ultimo ? "font-bold text-texto" : "text-muted"}`}>{mesCurto(d.mes)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Duas linhas no tempo (menor preço e média da cidade), para o histórico de preço. */
export function GraficoLinhas({
  series,
  rotulo,
  formatar,
}: {
  series: { nome: string; cor: string; pontos: { mes: string; valor: number }[] }[];
  rotulo: string;
  formatar: (v: number) => string;
}) {
  const largura = 318;
  const altura = 180;
  const esquerda = 44;
  const todos = series.flatMap((s) => s.pontos.map((p) => p.valor));
  const min = Math.min(...todos);
  const max = Math.max(...todos);
  const folga = (max - min) * 0.1 || 100;
  const [lo, hi] = [min - folga, max + folga];
  const meses = [...new Set(series.flatMap((s) => s.pontos.map((p) => p.mes)))].sort();
  const x = (mes: string) => esquerda + (meses.indexOf(mes) / Math.max(1, meses.length - 1)) * (largura - esquerda - 8);
  const y = (v: number) => 10 + (1 - (v - lo) / (hi - lo)) * (altura - 20);
  const marcas = [hi, (hi + lo) / 2, lo];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4 text-xs text-texto-2">
        {series.map((s) => (
          <span key={s.nome} className="flex items-center gap-1.5">
            <span className="block h-[3px] w-3.5 rounded" style={{ background: s.cor }} />
            {s.nome}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label={rotulo} className="w-full">
        {marcas.map((m) => (
          <g key={m}>
            <line x1={esquerda} x2={largura} y1={y(m)} y2={y(m)} stroke="#241F33" />
            <text x={0} y={y(m) + 4} fill="#A39DB8" fontSize="11">
              {formatar(m)}
            </text>
          </g>
        ))}
        {series.map((s) => (
          <polyline
            key={s.nome}
            points={s.pontos.map((p) => `${x(p.mes)},${y(p.valor)}`).join(" ")}
            fill="none"
            stroke={s.cor}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="flex justify-between text-[11px] text-muted" style={{ paddingLeft: esquerda }}>
        {meses.map((m) => (
          <span key={m}>{mesCurto(m)}</span>
        ))}
      </div>
    </div>
  );
}
