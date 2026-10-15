import { repositorio } from "@/data/repositorio";
import { ListaInterativa } from "./ListaInterativa";

/** Lista de compras (docs/06-telas.md#lista). O cálculo roda no navegador a cada item marcado. */
export default function Lista() {
  const usuario = repositorio.usuarioAtual();
  const lista = repositorio.listasDoUsuario(usuario.id)[0];
  return (
    <ListaInterativa
      lista={lista}
      produtos={repositorio.produtos()}
      mercados={repositorio.mercados()}
      observacoes={repositorio.observacoes()}
      hoje={repositorio.hoje()}
    />
  );
}
