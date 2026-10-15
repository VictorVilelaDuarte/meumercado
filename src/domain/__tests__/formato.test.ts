import { describe, expect, it } from "vitest";
import { diasEntre, formatarPercentual, formatarReais, mesCurto, somarDias, tempoRelativo } from "../formato";

describe("formato", () => {
  it("formata reais a partir de centavos", () => {
    expect(formatarReais(2190)).toBe("R$ 21,90");
    expect(formatarReais(128460)).toBe("R$ 1.284,60");
    expect(formatarReais(182.5)).toBe("R$ 1,83");
  });
  it("formata percentual com o sinal de menos tipográfico", () => {
    expect(formatarPercentual(-0.12)).toBe("−12%");
    expect(formatarPercentual(0.041, { sinal: true, casas: 1 })).toBe("+4,1%");
  });
  it("conta dias e soma dias", () => {
    expect(diasEntre("2026-10-01", "2026-10-15")).toBe(14);
    expect(somarDias("2026-10-28", 7)).toBe("2026-11-04");
  });
  it("tempo relativo", () => {
    expect(tempoRelativo("2026-10-15", "2026-10-15")).toBe("hoje");
    expect(tempoRelativo("2026-10-14", "2026-10-15")).toBe("ontem");
    expect(tempoRelativo("2026-10-13", "2026-10-15")).toBe("há 2 dias");
  });
  it("mês curto", () => {
    expect(mesCurto("2026-10")).toBe("out");
  });
});
