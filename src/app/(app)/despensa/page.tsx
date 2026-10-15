import { BarraProgresso, BotaoLink, Cabecalho, Cartao, Pagina } from "@/components/ui";
import { repositorio } from "@/data/repositorio";
import { estimarDespensa } from "@/domain/engajamento";

/** Despensa Digital: o que está acabando, pelo ritmo de compra do próprio usuário (docs/06-telas.md#despensa). */
export default function Despensa() {
  const usuario = repositorio.usuarioAtual();
  const itens = estimarDespensa(repositorio.notasDoUsuario(usuario.id), repositorio.hoje());
  const acabando = itens.filter((i) => i.acabando);
  const emCasa = itens.filter((i) => !i.acabando);

  const Linha = ({ item }: { item: (typeof itens)[number] }) => {
    const produto = repositorio.produto(item.produtoId)!;
    return (
      <Cartao className="flex flex-col gap-2 !p-3.5">
        <div className="flex justify-between gap-3">
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold">{produto.nome}</span>
            <span className="text-xs text-muted">Compra a cada {item.intervaloDias} dias</span>
          </span>
          <span className={`text-xs font-semibold ${item.acabando ? "text-ambar" : "text-muted"}`}>
            {item.diasRestantes === 0 ? "deve ter acabado" : `~${item.diasRestantes} dias`}
          </span>
        </div>
        <BarraProgresso fracao={item.nivel} cor={item.acabando ? "ambar" : "verde"} rotulo={`Quanto resta de ${produto.nome}`} />
      </Cartao>
    );
  };

  return (
    <Pagina>
      <Cabecalho voltarPara="/" titulo="Despensa" />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] font-extrabold">Despensa</h1>
        <p className="text-[13px] leading-snug text-muted">Calculada pelas suas notas: o app aprende de quanto em quanto tempo você compra cada item.</p>
      </div>

      {itens.length === 0 && <p className="text-sm text-texto-2">Precisamos de pelo menos duas compras do mesmo produto para estimar.</p>}

      {acabando.length > 0 && (
        <section aria-labelledby="acabando" className="flex flex-col gap-2.5">
          <h2 id="acabando" className="text-xs font-bold tracking-wide text-ambar">
            ACABANDO
          </h2>
          {acabando.map((i) => (
            <Linha key={i.produtoId} item={i} />
          ))}
        </section>
      )}

      {emCasa.length > 0 && (
        <section aria-labelledby="em-casa" className="flex flex-col gap-2.5">
          <h2 id="em-casa" className="text-xs font-bold tracking-wide text-muted">
            EM CASA
          </h2>
          {emCasa.map((i) => (
            <Linha key={i.produtoId} item={i} />
          ))}
        </section>
      )}

      <BotaoLink href="/lista">Ir para a lista de compras</BotaoLink>
    </Pagina>
  );
}
