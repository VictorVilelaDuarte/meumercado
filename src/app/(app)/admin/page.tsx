import { notFound } from "next/navigation";
import { Cabecalho, Pagina } from "@/components/ui";
import { repositorio } from "@/data/repositorio";
import { AdminInterativo } from "./AdminInterativo";

/** Painel do administrador (docs/06-telas.md#admin). Quem não é admin recebe 404. */
export default function Admin() {
  const usuario = repositorio.usuarioAtual();
  if (usuario.papel !== "admin") notFound();
  const revisoes = repositorio.revisoesProduto().map((r) => ({
    ...r,
    sugestao: repositorio.produto(r.sugestaoProdutoId)?.nome ?? r.sugestaoProdutoId,
    mercado: repositorio.mercado(r.mercadoId)?.nome ?? r.mercadoId,
  }));
  const estatisticas = {
    membros: repositorio.usuarios().filter((u) => u.status === "ativo").length,
    mercados: repositorio.mercados().length,
    precos: repositorio.observacoes().length,
  };
  return (
    <Pagina>
      <Cabecalho voltarPara="/perfil" titulo="Administrador" />
      <AdminInterativo admin={usuario} usuariosIniciais={repositorio.usuarios()} revisoesIniciais={revisoes} estatisticas={estatisticas} />
    </Pagina>
  );
}
