import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lerNota } from "../lerNota";
import { notaParaRegistro } from "../registro";

const nota = lerNota(readFileSync(join(__dirname, "..", "__fixtures__", "tauste-colinas-completa.html"), "utf-8"));

describe("notaParaRegistro", () => {
  it("acrescenta a categoria de cada item e mantém o resto da nota", () => {
    const registro = notaParaRegistro(nota);
    expect(registro.chave).toBe(nota.chave);
    expect(registro.itens).toHaveLength(22);
    expect(registro.itens[0]).toMatchObject({ descricao: "FILE FG TEMP BD", categoria: "Açougue" });
    expect(registro.itens[12]).toMatchObject({ descricao: "AGUA MIN LIND VER CG", categoria: "Bebidas", desconto: 720 });
  });

  it("vira JSON com os nomes de campo que registrar_nota lê", () => {
    const json = JSON.parse(JSON.stringify(notaParaRegistro(nota)));
    for (const campo of ["fonte", "chave", "numero", "serie", "data", "hora", "valorProdutos", "descontos", "valorPago"]) expect(json).toHaveProperty(campo);
    for (const campo of ["cnpj", "razaoSocial", "endereco", "bairro", "municipio", "uf", "cep"]) expect(json.emitente).toHaveProperty(campo);
    for (const campo of ["numero", "descricao", "codigo", "ncm", "quantidade", "unidade", "valorUnitario", "valorTotal", "desconto", "categoria"])
      expect(json.itens[0]).toHaveProperty(campo);
    expect(json.itens[2].ean).toBe("7894904575794");
  });
});

describe("supabase/testes/notas-reais.json (usado por npm run test:db)", () => {
  it("é exatamente o que notaParaRegistro gera para as 4 notas reais", () => {
    // Se este teste falhar depois de mudar o leitor, gere o arquivo de novo: GERAR_NOTAS_REAIS=1 npx vitest run registro
    const fixtures = ["tauste-colinas", "americanas-aquarius", "carrefour-serimbura-1", "carrefour-serimbura-2"];
    const esperado = fixtures.map((n) => notaParaRegistro(lerNota(readFileSync(join(__dirname, "..", "__fixtures__", `${n}-completa.html`), "utf-8"))));
    const caminho = join(__dirname, "..", "..", "..", "supabase", "testes", "notas-reais.json");
    if (process.env.GERAR_NOTAS_REAIS) writeFileSync(caminho, JSON.stringify(esperado, null, 1) + "\n");
    const arquivo = JSON.parse(readFileSync(caminho, "utf-8"));
    expect(arquivo).toEqual(JSON.parse(JSON.stringify(esperado)));
  });
});
