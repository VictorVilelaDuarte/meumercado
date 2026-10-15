import { Cabecalho, Pagina } from "@/components/ui";
import { repositorio } from "@/data/repositorio";
import { ConvitesInterativo } from "./ConvitesInterativo";

/** Convidar amigos (docs/06-telas.md#convites). A entrada só vale depois que o administrador aprova. */
export default function Convites() {
  return (
    <Pagina>
      <Cabecalho voltarPara="/perfil" titulo="Convites" />
      <ConvitesInterativo usuario={repositorio.usuarioAtual()} convitesIniciais={repositorio.convites()} usuarios={repositorio.usuarios()} hoje={repositorio.hoje()} />
    </Pagina>
  );
}
