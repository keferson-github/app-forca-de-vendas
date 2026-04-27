# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: clientes-success-toast.spec.ts >> Clientes - toast de sucesso >> cadastra cliente e exibe toast de sucesso
- Location: e2e\clientes-success-toast.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Novo cliente' }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('button', { name: 'Novo cliente' }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | const E2E_EMAIL = process.env.E2E_EMAIL;
  4  | const E2E_PASSWORD = process.env.E2E_PASSWORD;
  5  | 
  6  | test.describe("Clientes - toast de sucesso", () => {
  7  |   test.skip(!E2E_EMAIL || !E2E_PASSWORD, "Defina E2E_EMAIL e E2E_PASSWORD para executar este cenário autenticado.");
  8  | 
  9  |   test("cadastra cliente e exibe toast de sucesso", async ({ page }) => {
  10 |     const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  11 |     const customerName = `Cliente E2E ${uniqueSuffix}`;
  12 | 
  13 |     await page.goto("/login");
  14 | 
  15 |     await page.locator("input#email:visible").fill(E2E_EMAIL ?? "");
  16 |     await page.locator("input#password:visible").fill(E2E_PASSWORD ?? "");
  17 |     await page.locator("button:visible", { hasText: "Entrar" }).first().click();
  18 | 
  19 |     await expect(page).toHaveURL(/\/dashboard|\/clientes/);
  20 |     await page.goto("/clientes");
  21 | 
  22 |     const newCustomerButton = page.getByRole("button", { name: "Novo cliente" }).first();
> 23 |     await expect(newCustomerButton).toBeVisible();
     |                                     ^ Error: expect(locator).toBeVisible() failed
  24 |     await newCustomerButton.click();
  25 | 
  26 |     const formDialog = page.getByRole("dialog", { name: "Novo cliente" });
  27 |     await expect(formDialog).toBeVisible();
  28 |     await formDialog.getByLabel("Nome do cliente").fill(customerName);
  29 |     await formDialog.getByRole("button", { name: "Salvar cadastro" }).click();
  30 | 
  31 |     const toastText = page.getByText("Cliente cadastrado com sucesso.");
  32 |     await expect(toastText).toBeVisible();
  33 |     await expect(page.getByText(customerName).first()).toBeVisible();
  34 | 
  35 |     await expect.poll(() => new URL(page.url()).searchParams.get("notice")).toBeNull();
  36 |     await expect.poll(() => new URL(page.url()).searchParams.get("noticeId")).toBeNull();
  37 | 
  38 |     await expect(toastText).not.toBeVisible({ timeout: 7000 });
  39 |   });
  40 | });
  41 | 
```