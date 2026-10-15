import { NavInferior } from "@/components/NavInferior";

/** Telas de quem já está dentro do app: todas têm a navegação inferior. */
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <NavInferior />
    </>
  );
}
