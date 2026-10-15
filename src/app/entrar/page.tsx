import { Logo, Pagina } from "@/components/ui";
import { repositorio } from "@/data/repositorio";
import { EntrarFormulario } from "./EntrarFormulario";

/** Entrada com código de convite (docs/06-telas.md#entrar). Fora do layout do app: sem menu inferior. */
export default function Entrar() {
  return (
    <Pagina comNav={false}>
      <div className="flex flex-col items-center gap-3 pt-8 text-center">
        <Logo tamanho="lg" />
        <p className="text-[15px] text-texto-2">Preços reais dos mercados de São José dos Campos, compartilhados entre amigos.</p>
      </div>
      <EntrarFormulario convites={repositorio.convites()} hoje={repositorio.hoje()} />
    </Pagina>
  );
}
