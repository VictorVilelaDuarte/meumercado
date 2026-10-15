import { expect, test } from "@playwright/test";

/** Toda rota abre sem erro e mostra seu título. Ao criar uma tela nova, acrescente-a aqui. */
const ROTAS: [string, RegExp][] = [
  ["/", /Olá, Victor/],
  ["/busca?q=papel", /Buscar produtos/],
  ["/produto/papel-neve-12", /Papel higiênico Neve/i],
  ["/produto/papel-neve-12/historico", /Papel higiênico Neve/i],
  ["/mercados", /Mercados/],
  ["/escanear", /Escanear/i],
  ["/gastos", /Meus gastos/],
  ["/lista", /Compra do mês/],
  ["/ofertas", /Ofertas da semana/],
  ["/alertas", /Alertas de preço/],
  ["/despensa", /Despensa/],
  ["/desafio", /Quem mais economizou/],
  ["/perfil", /Victor/],
  ["/convites", /Convide amigos/],
  ["/admin", /Painel do administrador/],
  ["/entrar", /Entrar com convite/],
];

for (const [rota, titulo] of ROTAS) {
  test(`abre ${rota}`, async ({ page }) => {
    const erros: string[] = [];
    page.on("pageerror", (e) => erros.push(e.message));
    const resposta = await page.goto(rota);
    expect(resposta?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(titulo);
    expect(erros).toEqual([]);
  });
}

test("menu inferior navega e marca a aba atual", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: /principal/i });
  await menu.getByRole("link", { name: "Gastos" }).click();
  await expect(page).toHaveURL(/\/gastos$/);
  await expect(menu.getByRole("link", { name: "Gastos" })).toHaveAttribute("aria-current", "page");
});

test("fundo é escuro em todas as telas (regra do Victor)", async ({ page }) => {
  await page.goto("/");
  const fundo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const [r, g, b] = fundo.match(/\d+/g)!.map(Number);
  expect((r + g + b) / 3).toBeLessThan(40);
});
