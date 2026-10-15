import type { ReactNode } from "react";
import type { Mercado } from "@/domain/tipos";

/**
 * Mapa ESQUEMÁTICO de São José dos Campos: as ruas são decorativas e os pinos são posicionados pela latitude/longitude
 * dos mercados, normalizadas dentro da área que contém todos eles.
 * Quando o mapa real entrar (MapLibre + OpenStreetMap, ver docs/05-roteiro.md), só este componente muda.
 */

/** Escala de cores barato → caro. Todas com texto escuro por cima (contraste ≥ 4,5:1). */
export const ESCALA_PRECO = ["#4ADE80", "#B5E07A", "#FBBF6A", "#FB8A5C"] as const;

export function corDaFaixa(posicao: number): string {
  const indice = Math.min(ESCALA_PRECO.length - 1, Math.floor(Math.max(0, Math.min(1, posicao)) * ESCALA_PRECO.length));
  return ESCALA_PRECO[indice];
}

/** Converte lat/lng em porcentagem (0–100) dentro da caixa que contém todos os mercados, com margem. */
export function projetar(mercados: Pick<Mercado, "lat" | "lng">[], ponto: Pick<Mercado, "lat" | "lng">, margem = 0.12) {
  const lats = mercados.map((m) => m.lat);
  const lngs = mercados.map((m) => m.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const normal = (v: number, min: number, max: number) => (max === min ? 0.5 : (v - min) / (max - min));
  const x = margem + normal(ponto.lng, minLng, maxLng) * (1 - 2 * margem);
  const y = margem + (1 - normal(ponto.lat, minLat, maxLat)) * (1 - 2 * margem); // norte para cima
  return { x: x * 100, y: y * 100 };
}

export interface PinoMapa {
  mercado: Mercado;
  conteudo: ReactNode;
}

export function Mapa({ mercados, pinos, altura = 270, rotulo, legenda }: { mercados: Mercado[]; pinos: PinoMapa[]; altura?: number; rotulo: string; legenda?: boolean }) {
  return (
    <div role="img" aria-label={rotulo} className="relative overflow-hidden rounded-[18px] border border-borda bg-[#17141f]" style={{ height: altura }}>
      <svg viewBox="0 0 350 270" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <path d="M290 -10 C 300 80, 330 150, 340 280" stroke="#1C2540" strokeWidth="20" fill="none" />
        <path d="M-10 190 C 80 160, 180 175, 360 120" stroke="#2E2840" strokeWidth="12" fill="none" />
        <path d="M60 -10 L 110 280" stroke="#25202F" strokeWidth="7" fill="none" />
        <path d="M230 -10 L 205 280" stroke="#25202F" strokeWidth="7" fill="none" />
        <path d="M-10 70 L 360 50" stroke="#25202F" strokeWidth="5" fill="none" />
        <path d="M-10 245 L 360 225" stroke="#25202F" strokeWidth="5" fill="none" />
      </svg>
      <span className="absolute left-4 text-[10px] font-bold tracking-wide text-apagado" style={{ top: "62%" }} aria-hidden="true">
        VIA DUTRA
      </span>
      {pinos.map(({ mercado, conteudo }) => {
        const { x, y } = projetar(mercados, mercado);
        return (
          <div key={mercado.id} className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center" style={{ left: `${x}%`, top: `${y}%` }}>
            {conteudo}
          </div>
        );
      })}
      {legenda && (
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-[10px] border border-borda bg-fundo px-2 py-1.5 text-[11px] text-muted">
          barato
          <span className="h-2 w-[60px] rounded" style={{ background: `linear-gradient(90deg, ${ESCALA_PRECO.join(", ")})` }} />
          caro
        </div>
      )}
    </div>
  );
}

/** Pino com preço, usado no mapa do produto. */
export function PinoPreco({ texto, cor, destaque }: { texto: string; cor: string; destaque?: boolean }) {
  return (
    <>
      <span className="rounded-[10px] px-2 py-1 text-[13px] font-extrabold text-fundo" style={{ background: cor, boxShadow: destaque ? `0 0 0 3px ${cor}40` : undefined }}>
        {texto}
      </span>
      <span className="-mt-1.5 h-2.5 w-2.5 rotate-45" style={{ background: cor }} />
    </>
  );
}
