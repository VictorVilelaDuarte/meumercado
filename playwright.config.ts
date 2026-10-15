import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de navegador (docs/07-testes.md). Sobem o app em modo produção na porta 3100.
 * Rode `npm run build` antes de `npm run test:e2e` (o script `verificar` já faz isso).
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    ...devices["Pixel 7"],
    viewport: { width: 390, height: 844 },
    locale: "pt-BR",
  },
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
