"use client";

import { useState, type FormEvent } from "react";
import { Cartao, Numero, Selo } from "@/components/ui";
import { formatarReais } from "@/domain/formato";
import { resumirNota } from "@/nfce/resumo";
import type { NotaLida } from "@/nfce/tipos";

/**
 * Lê uma nota de verdade pelo link do QR Code (docs/06-telas.md#escanear).
 * A câmera entra na Fase 1; por enquanto a pessoa cola o link que o leitor de QR do celular mostra.
 * Nada é gravado ainda: a tela só mostra o que a Sefaz devolveu.
 */
export function LerNota() {
  const [estado, setEstado] = useState<{ tipo: "parado" } | { tipo: "lendo" } | { tipo: "erro"; mensagem: string } | { tipo: "lida"; nota: NotaLida }>({ tipo: "parado" });

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = String(new FormData(e.currentTarget).get("url") ?? "").trim();
    if (!url) return setEstado({ tipo: "erro", mensagem: "Cole o link do QR Code da nota." });
    setEstado({ tipo: "lendo" });
    try {
      const resposta = await fetch("/api/nfce", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const dados = (await resposta.json()) as { nota?: NotaLida; erro?: string };
      setEstado(dados.nota ? { tipo: "lida", nota: dados.nota } : { tipo: "erro", mensagem: dados.erro ?? "Não consegui ler a nota." });
    } catch {
      setEstado({ tipo: "erro", mensagem: "Sem conexão. Tente de novo." });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={enviar} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-texto-2">
          Link do QR Code
          <input
            name="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://www.nfce.fazenda.sp.gov.br/..."
            className="min-h-12 rounded-xl border border-borda bg-superficie px-3.5 text-[15px] text-texto"
          />
        </label>
        <button type="submit" disabled={estado.tipo === "lendo"} className="min-h-12 rounded-xl bg-roxo text-[15px] font-bold text-white disabled:opacity-60">
          {estado.tipo === "lendo" ? "Lendo a nota na Sefaz..." : "Ler nota"}
        </button>
      </form>
      {estado.tipo === "erro" && <p role="alert" className="text-[13px] text-ambar">{estado.mensagem}</p>}
      {estado.tipo === "lida" && <NotaLidaCartao nota={estado.nota} />}
    </div>
  );
}

function NotaLidaCartao({ nota }: { nota: NotaLida }) {
  const resumo = resumirNota(nota);
  const [ano, mes, dia] = nota.data.split("-");
  return (
    <Cartao destaque className="flex flex-col gap-3.5" >
      <div className="flex flex-col gap-0.5" data-testid="nota-lida">
        <span className="text-base font-bold">{nota.emitente.nomeFantasia ?? nota.emitente.razaoSocial}</span>
        <span className="text-[13px] text-muted">
          {nota.emitente.bairro} · {dia}/{mes}/{ano} {nota.hora.slice(0, 5)}
        </span>
      </div>
      <div className="flex gap-2">
        <Numero valor={nota.itens.length} rotulo="itens" tom="roxo" />
        <Numero valor={resumo.comEan} rotulo="com código de barras" tom="roxo" />
        <Numero valor={formatarReais(nota.valorPago)} rotulo="pago" />
      </div>
      {nota.descontos > 0 && <p className="text-[13px] text-texto-2">Desconto na nota: <span className="font-bold text-verde">{formatarReais(nota.descontos)}</span></p>}
      {nota.fonte === "resumida" && (
        <p role="status" className="text-[13px] text-ambar">
          A Sefaz só mostrou a versão resumida desta vez, sem código de barras e NCM. Os preços valem; tente de novo para casar os produtos.
        </p>
      )}
      <ul className="flex flex-col" aria-label="Itens da nota">
        {resumo.itens.map((item) => (
          <li key={item.numero} className="flex items-center gap-3 border-b border-superficie-2 py-2.5 last:border-b-0">
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-[14px] font-semibold">{item.descricao}</span>
              <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                <Selo tom={item.precisaRevisao ? "ambar" : "roxo"}>{item.precisaRevisao ? "revisar" : item.categoria}</Selo>
                {item.quantidade.toLocaleString("pt-BR")} {item.unidade.toLowerCase()} × {formatarReais(item.valorUnitario)}
              </span>
            </span>
            <span className="text-right text-[14px] font-bold">{formatarReais(item.valorPago)}</span>
          </li>
        ))}
      </ul>
    </Cartao>
  );
}
