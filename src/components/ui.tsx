import Link from "next/link";
import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "./Icone";

/*
 * Peças visuais reutilizáveis. Toda tela deve montar com estas peças em vez de repetir classes,
 * para o visual ficar igual em todo o app (ver docs/03-design.md).
 */

export function Logo({ tamanho = "md" }: { tamanho?: "md" | "lg" }) {
  const grande = tamanho === "lg";
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center justify-center rounded-[10px] bg-roxo ${grande ? "h-16 w-16 rounded-[20px]" : "h-8 w-8"}`}>
        <Icone nome="sacola" tamanho={grande ? 34 : 18} className="text-white" />
      </div>
      {!grande && (
        <span className="font-display text-2xl font-extrabold tracking-tight">
          meu<span className="text-roxo-claro">mercado</span>
        </span>
      )}
    </div>
  );
}

export function Cartao({ children, destaque = false, className = "" }: { children: ReactNode; destaque?: boolean; className?: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${destaque ? "border-roxo bg-roxo-fundo" : "border-borda bg-superficie"} ${className}`}>{children}</div>
  );
}

export function Titulo({ children, sobre }: { children: ReactNode; sobre?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {sobre && <p className="text-[13px] text-muted">{sobre}</p>}
      <h1 className="font-display text-[26px] font-extrabold leading-tight">{children}</h1>
    </div>
  );
}

export function SecaoTitulo({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-[17px] font-bold">{children}</h2>
      {acao}
    </div>
  );
}

/** Barra superior com botão de voltar. */
export function Cabecalho({ voltarPara, titulo, direita }: { voltarPara: string; titulo: string; direita?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <Link href={voltarPara} aria-label="Voltar" className="-ml-2.5 flex h-11 w-11 items-center justify-center rounded-xl">
        <Icone nome="voltar" />
      </Link>
      <span className="text-[15px] font-semibold text-muted">{titulo}</span>
      <div className="flex h-11 w-11 items-center justify-center">{direita}</div>
    </div>
  );
}

export function Chip({ children, ativo = false }: { children: ReactNode; ativo?: boolean }) {
  return (
    <span
      className={`rounded-full px-3.5 py-2 text-[13px] ${ativo ? "bg-roxo font-bold text-white" : "border border-borda bg-superficie font-semibold text-texto-2"}`}
    >
      {children}
    </span>
  );
}

export function Selo({ children, tom = "roxo" }: { children: ReactNode; tom?: "roxo" | "verde" | "ambar" }) {
  const cores = { roxo: "bg-roxo-chip text-roxo-suave", verde: "bg-verde/12 text-verde", ambar: "bg-ambar/12 text-ambar" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cores[tom]}`}>{children}</span>;
}

export function BarraProgresso({ fracao, cor = "roxo", rotulo }: { fracao: number; cor?: "roxo" | "verde" | "ambar" | "roxo-claro"; rotulo: string }) {
  const cores = { roxo: "bg-roxo", verde: "bg-verde", ambar: "bg-ambar", "roxo-claro": "bg-roxo-claro" };
  const pct = Math.round(Math.max(0, Math.min(1, fracao)) * 100);
  return (
    <div role="progressbar" aria-label={rotulo} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-2 rounded bg-superficie-2">
      <div className={`h-2 rounded ${cores[cor]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Numero({ valor, rotulo, tom }: { valor: ReactNode; rotulo: string; tom?: "verde" | "ambar" | "roxo" }) {
  const cor = tom === "verde" ? "text-verde" : tom === "ambar" ? "text-ambar" : tom === "roxo" ? "text-roxo-suave" : "";
  return (
    <div className="flex flex-1 flex-col gap-0.5 rounded-xl bg-superficie-2 p-2.5">
      <span className={`text-lg font-extrabold ${cor}`}>{valor}</span>
      <span className="text-xs text-muted">{rotulo}</span>
    </div>
  );
}

export function BotaoLink({ href, children, variante = "primario", className = "" }: { href: string; children: ReactNode; variante?: "primario" | "secundario"; className?: string }) {
  const estilo = variante === "primario" ? "bg-roxo text-white" : "border border-borda-forte text-texto";
  return (
    <Link href={href} className={`flex h-[50px] items-center justify-center rounded-[14px] text-[15px] font-bold no-underline ${estilo} ${className}`}>
      {children}
    </Link>
  );
}

export function FotoProduto({ tamanho = 44 }: { tamanho?: number }) {
  return (
    <div className="flex shrink-0 items-center justify-center rounded-[10px] bg-superficie-2 text-[11px] text-muted" style={{ width: tamanho, height: tamanho }}>
      foto
    </div>
  );
}

export function Avatar({ nome, destaque = false, tamanho = 40 }: { nome: string; destaque?: boolean; tamanho?: number }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-extrabold ${destaque ? "bg-roxo text-white" : "bg-roxo-chip text-roxo-suave"}`}
      style={{ width: tamanho, height: tamanho }}
      aria-hidden="true"
    >
      {nome.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function LinhaMenu({ href, icone, children, detalhe }: { href: string; icone?: NomeIcone; children: ReactNode; detalhe?: ReactNode }) {
  return (
    <Link href={href} className="flex min-h-12 items-center gap-3 border-b border-superficie-2 text-[15px] font-semibold no-underline last:border-b-0">
      {icone && <Icone nome={icone} tamanho={20} className="text-roxo-claro" />}
      <span className="flex-1">{children}</span>
      {detalhe}
      <Icone nome="avancar" tamanho={18} className="text-muted" />
    </Link>
  );
}

export function Pagina({ children, comNav = true }: { children: ReactNode; comNav?: boolean }) {
  return <main className={`flex flex-col gap-5 px-5 pt-6 ${comNav ? "pb-28" : "pb-8"}`}>{children}</main>;
}
