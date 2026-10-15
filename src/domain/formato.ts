import type { Centavos, DataISO } from "./tipos";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 2190 → "R$ 21,90". Usa espaço comum (não o espaço especial do Intl) para facilitar testes. */
export function formatarReais(valor: Centavos): string {
  return moeda.format(Math.round(valor) / 100).replace(/ /g, " ");
}

/** 0.124 → "12%", -0.08 → "−8%". `sinal` força o + nos positivos. */
export function formatarPercentual(fracao: number, opcoes: { sinal?: boolean; casas?: number } = {}): string {
  const casas = opcoes.casas ?? 0;
  const valor = Math.abs(fracao * 100).toFixed(casas).replace(".", ",");
  if (fracao < 0) return `−${valor}%`;
  if (opcoes.sinal && fracao > 0) return `+${valor}%`;
  return `${valor}%`;
}

/** Diferença em dias inteiros entre duas datas ISO (b - a). */
export function diasEntre(a: DataISO, b: DataISO): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Soma dias a uma data ISO. */
export function somarDias(data: DataISO, dias: number): DataISO {
  const d = new Date(`${data}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** "há 2 dias", "ontem", "hoje". */
export function tempoRelativo(data: DataISO, hoje: DataISO): string {
  const dias = diasEntre(data, hoje);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

/** "2026-10" → "out". */
export function mesCurto(anoMes: string): string {
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return nomes[Number(anoMes.slice(5, 7)) - 1] ?? anoMes;
}
