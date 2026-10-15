import { Avatar, BarraProgresso, Cartao, LinhaMenu, Numero, Pagina, Selo } from "@/components/ui";
import { repositorio } from "@/data/repositorio";
import { nivelPorPontos } from "@/domain/engajamento";
import { economiaPerdida, totalNota } from "@/domain/gastos";
import { formatarReais } from "@/domain/formato";

/** Perfil, nível e conquistas (docs/06-telas.md#perfil). */
export default function Perfil() {
  const usuario = repositorio.usuarioAtual();
  const notas = repositorio.notasDoUsuario(usuario.id);
  const nivel = nivelPorPontos(usuario.pontos);
  const precos = notas.reduce((s, n) => s + n.itens.filter((i) => i.produtoId).length, 0);
  const gasto = notas.reduce((s, n) => s + totalNota(n), 0);
  const perdida = economiaPerdida(notas, repositorio.observacoes());
  const conquistas = [
    { nome: "Primeira nota", feito: notas.length >= 1 },
    { nome: "10 notas", feito: notas.length >= 10 },
    { nome: "100 preços", feito: precos >= 100 },
    { nome: "Convidou um amigo", feito: repositorio.usuarios().some((u) => u.convidadoPor === usuario.id && u.status === "ativo") },
  ];

  return (
    <Pagina>
      <div className="flex items-center gap-3.5">
        <Avatar nome={usuario.nome} destaque tamanho={60} />
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[22px] font-extrabold">{usuario.nome}</h1>
          <div className="flex gap-1.5">
            <Selo>Nível {nivel.nivel} · {nivel.nome}</Selo>
            {usuario.papel === "admin" && <Selo tom="ambar">Administrador</Selo>}
          </div>
        </div>
      </div>

      <Cartao className="flex flex-col gap-2.5">
        <div className="flex justify-between text-sm">
          <span className="font-bold" data-testid="pontos">{usuario.pontos.toLocaleString("pt-BR")} pontos</span>
          <span className="text-muted">{nivel.proximo ? `faltam ${nivel.faltam} para ${nivel.proximo.nome}` : "nível máximo"}</span>
        </div>
        <BarraProgresso fracao={nivel.progresso} rotulo="Progresso até o próximo nível" />
      </Cartao>

      <div className="grid grid-cols-3 gap-2.5">
        <Numero valor={notas.length} rotulo="notas" />
        <Numero valor={precos} rotulo="preços" />
        <Numero valor={formatarReais(gasto)} rotulo="gasto total" />
      </div>
      {perdida > 0 && <p className="text-[13px] text-muted">Você poderia ter economizado <span className="font-bold text-verde">{formatarReais(perdida)}</span> comprando cada item no mercado mais barato.</p>}

      <section aria-labelledby="conquistas" className="flex flex-col gap-2.5">
        <h2 id="conquistas" className="text-base font-bold">Conquistas</h2>
        <ul className="grid grid-cols-2 gap-2">
          {conquistas.map((c) => (
            <li key={c.nome} className={`rounded-xl border p-3 text-[13px] font-semibold ${c.feito ? "border-roxo bg-roxo-fundo" : "border-borda bg-superficie text-muted"}`}>
              {c.feito ? "✓ " : ""}{c.nome}
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Mais opções" className="flex flex-col">
        <LinhaMenu href="/convites" icone="convidar">Convidar amigos</LinhaMenu>
        <LinhaMenu href="/desafio" icone="trofeu">Desafio do mês</LinhaMenu>
        <LinhaMenu href="/alertas" icone="sino">Alertas de preço</LinhaMenu>
        <LinhaMenu href="/despensa" icone="despensa">Despensa</LinhaMenu>
        {usuario.papel === "admin" && <LinhaMenu href="/admin" icone="escudo">Painel do administrador</LinhaMenu>}
      </nav>
      <p className="flex items-center gap-2 text-xs text-muted">Seus gastos e suas notas são só seus. Os preços entram no mapa sem o seu nome.</p>
    </Pagina>
  );
}
