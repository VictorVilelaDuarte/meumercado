import { ErroCodigoNota, lerQrCode } from "@/nfce/codigos";
import { ErroLeituraNota } from "@/nfce/lerNota";
import { buscarNota } from "@/nfce/sefaz";

/**
 * POST /api/nfce  { url: "<texto do QR Code>" } → { nota: NotaLida } ou { erro: "mensagem" }.
 * Roda no servidor porque o navegador não pode falar direto com a Sefaz (CORS) e porque
 * o passo a passo precisa dos cookies da sessão (src/nfce/sefaz.ts).
 * Só consulta o endereço da Sefaz-SP: o link é refeito por `lerQrCode` antes de qualquer pedido.
 * Ainda NÃO grava nada: gravar nota e preços é da Fase 1 (Supabase).
 */
export async function POST(pedido: Request) {
  const corpo = (await pedido.json().catch(() => ({}))) as { url?: unknown };
  let url: string;
  try {
    url = lerQrCode(String(corpo.url ?? "")).url;
  } catch (erro) {
    return Response.json({ erro: erro instanceof ErroCodigoNota ? erro.message : "Link inválido." }, { status: 400 });
  }
  try {
    return Response.json({ nota: await buscarNota(url) });
  } catch (erro) {
    const mensagem = erro instanceof ErroLeituraNota ? erro.message : "Não consegui falar com a Sefaz agora. Tente de novo em instantes.";
    return Response.json({ erro: mensagem }, { status: 502 });
  }
}
