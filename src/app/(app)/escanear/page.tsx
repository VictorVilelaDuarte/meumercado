import Link from "next/link";
import { Icone } from "@/components/Icone";
import { BotaoLink, Cartao, Numero, Pagina } from "@/components/ui";
import { nomeMercado } from "@/data/consultas";
import { repositorio } from "@/data/repositorio";
import { formatarReais } from "@/domain/formato";
import { compararItensComMedia, totalNota } from "@/domain/gastos";

/**
 * Escanear nota (docs/06-telas.md#escanear).
 * A LEITURA REAL do QR code ainda não existe: depende do teste com notas reais (Fase 0, docs/05-roteiro.md).
 * Por enquanto a tela mostra o visor e o resumo da última nota de exemplo.
 */
export default function Escanear() {
  const usuario = repositorio.usuarioAtual();
  const ultima = repositorio.notasDoUsuario(usuario.id)[0];
  const comparacao = ultima ? compararItensComMedia(ultima, repositorio.observacoes()) : [];

  return (
    <Pagina>
      <div className="flex items-center justify-between">
        <Link href="/" aria-label="Fechar" className="-ml-2.5 flex h-11 w-11 items-center justify-center">
          <Icone nome="fechar" />
        </Link>
        <h1 className="text-base font-bold">Escanear nota</h1>
        <span className="h-11 w-11" />
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative h-[250px] w-[250px] rounded-3xl bg-superficie" aria-hidden="true">
          {["left-0 top-0 border-l-4 border-t-4 rounded-tl-3xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-3xl", "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-3xl", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-3xl"].map((c) => (
            <span key={c} className={`absolute h-11 w-11 border-roxo ${c}`} />
          ))}
          <span className="absolute inset-x-6 top-[124px] h-0.5 bg-roxo-claro shadow-[0_0_16px_2px_rgba(183,156,255,0.7)]" />
          <Icone nome="qr" tamanho={80} className="absolute left-[85px] top-[85px] text-borda-forte" />
        </div>
        <p className="max-w-[280px] text-center text-[15px] leading-snug text-texto-2">Aponte a câmera para o QR code no fim do cupom fiscal</p>
        <p role="status" className="rounded-full border border-borda bg-superficie px-3.5 py-1.5 text-xs text-muted">
          Leitura real da nota chega depois do teste com notas reais
        </p>
      </div>

      {ultima && (
        <Cartao className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-verde/15 text-verde">
              <Icone nome="check" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-base font-bold">Última nota lida</span>
              <span className="text-[13px] text-muted">
                {nomeMercado(ultima.mercadoId)} · {ultima.itens.length} itens
              </span>
            </span>
            <span className="text-lg font-extrabold">{formatarReais(totalNota(ultima))}</span>
          </div>
          <div className="flex gap-2">
            <Numero valor={comparacao.filter((c) => c.rotulo === "abaixo").length} rotulo="abaixo da média" tom="verde" />
            <Numero valor={comparacao.filter((c) => c.rotulo === "acima").length} rotulo="acima da média" tom="ambar" />
            <Numero valor="+50" rotulo="pontos" tom="roxo" />
          </div>
          <BotaoLink href={`/nota/${ultima.id}`} variante="secundario">
            Ver nota
          </BotaoLink>
        </Cartao>
      )}
    </Pagina>
  );
}
