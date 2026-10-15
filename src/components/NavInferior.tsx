"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone, type NomeIcone } from "./Icone";

export const ITENS_NAV: { href: string; rotulo: string; icone: NomeIcone }[] = [
  { href: "/", rotulo: "Início", icone: "inicio" },
  { href: "/mercados", rotulo: "Mapa", icone: "mapa" },
  { href: "/escanear", rotulo: "Escanear", icone: "escanear" },
  { href: "/lista", rotulo: "Lista", icone: "lista" },
  { href: "/gastos", rotulo: "Gastos", icone: "grafico" },
];

export function NavInferior() {
  const caminho = usePathname();
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-10 border-t border-borda bg-fundo-nav">
      <ul className="mx-auto flex h-[72px] max-w-md items-center justify-around pb-2">
        {ITENS_NAV.map((item) => {
          const ativo = item.href === "/" ? caminho === "/" : caminho.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`flex min-h-11 min-w-16 flex-col items-center justify-center gap-0.5 text-[11px] no-underline ${ativo ? "font-bold text-roxo-claro" : "font-semibold text-muted"}`}
              >
                <Icone nome={item.icone} />
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
