import { defineConfig, devices } from "@playwright/test";

// Portas próprias para não conflitar com o `npm run dev` (5173 / 3002)
const API_PORT = 3997;
const WEB_PORT = 5174;

// Modo interativo (--ui) e navegador visível (--headed) rodam devagar para dar para acompanhar.
// Definido no processo principal para os workers herdarem. Ajuste com SLOWMO=<ms>.
if (process.argv.includes("--ui") || process.argv.includes("--headed")) {
  process.env.SLOWMO ??= "600";
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: process.env.SLOWMO ? 300_000 : 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Para acompanhar visualmente: SLOWMO=800 npx playwright test --headed
    launchOptions: { slowMo: Number(process.env.SLOWMO || 0) },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Backend real, lendo o backend/.env (PocketBase de dev)
      command: "node node_modules/tsx/dist/cli.mjs src/server.ts",
      cwd: "../backend",
      url: `http://localhost:${API_PORT}/api/calculos/budgets`,
      // RESEND_API_KEY vazia: o EmailService não envia nada (o dotenv não sobrescreve variável já definida)
      env: { PORT: String(API_PORT), NODE_ENV: "development", RESEND_API_KEY: "" },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { VITE_API_URL: `http://localhost:${API_PORT}/api/calculos` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
