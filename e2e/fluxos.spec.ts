import { expect, test } from "@playwright/test";

test("busca filtra produtos", async ({ page }) => {
  await page.goto("/busca?q=neve");
  await expect(page.getByRole("link", { name: /Papel higiênico Neve/i }).first()).toBeVisible();
  await expect(page.getByText(/Arroz/)).toHaveCount(0);
});

test("produto mostra mapa e preços por mercado", async ({ page }) => {
  await page.goto("/produto/papel-neve-12");
  await expect(page.getByRole("img", { name: /mapa/i })).toBeVisible();
  await expect(page.getByText(/R\$\s?\d/).first()).toBeVisible();
});

test("marcar item como comprado recalcula o total da lista", async ({ page }) => {
  await page.goto("/lista");
  const total = page.getByTestId("total-lista");
  const antes = await total.textContent();
  await page.getByRole("checkbox").first().check();
  await expect(total).not.toHaveText(antes!);
});

test("administrador aprova pedido de entrada", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByTestId("total-pedidos")).toHaveText("(2)");
  await page.getByRole("button", { name: "Aprovar Lucas" }).click();
  await expect(page.getByRole("status")).toContainText("Lucas foi aprovado");
  await expect(page.getByTestId("total-pedidos")).toHaveText("(1)");
});

test("membro gera convite e o código aparece", async ({ page }) => {
  await page.goto("/convites");
  const codigos = page.getByTestId("lista-codigos").getByRole("listitem");
  const antes = await codigos.count();
  await page.getByRole("button", { name: "Gerar novo convite" }).click();
  await expect(codigos).toHaveCount(antes + 1);
  await expect(codigos.first()).toContainText(/MERC-[A-Z2-9]{4}/);
});

test("entrar com convite válido deixa a pessoa aguardando o administrador", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("Seu nome").fill("Carla");
  await page.getByLabel("Código de convite").fill("merc-h8wx");
  await page.getByRole("button", { name: "Pedir para entrar" }).click();
  await expect(page.getByTestId("aguardando-aprovacao")).toBeVisible();
});

test("convite já usado é recusado com mensagem", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("Seu nome").fill("Carla");
  await page.getByLabel("Código de convite").fill("MERC-7Q4K");
  await page.getByRole("button", { name: "Pedir para entrar" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("já foi usado");
});

test("privacidade: nota de outra pessoa dá 404", async ({ page }) => {
  const resposta = await page.goto("/nota/ana-dutra-2026-10-01");
  expect(resposta?.status()).toBe(404);
});
