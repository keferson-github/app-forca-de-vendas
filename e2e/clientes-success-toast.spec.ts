import { expect, test } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

test.describe("Clientes - toast de sucesso", () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, "Defina E2E_EMAIL e E2E_PASSWORD para executar este cenário autenticado.");

  test("cadastra cliente e exibe toast de sucesso", async ({ page }) => {
    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const customerName = `Cliente E2E ${uniqueSuffix}`;

    await page.goto("/login");

    await page.locator("input#email:visible").fill(E2E_EMAIL ?? "");
    await page.locator("input#password:visible").fill(E2E_PASSWORD ?? "");
    await page.locator("button:visible", { hasText: "Entrar" }).first().click();

    await expect(page).toHaveURL(/\/dashboard|\/clientes/);
    await page.goto("/clientes");

    const newCustomerButton = page.getByRole("button", { name: "Novo cliente" }).first();
    await expect(newCustomerButton).toBeVisible();
    await newCustomerButton.click();

    const formDialog = page.getByRole("dialog", { name: "Novo cliente" });
    await expect(formDialog).toBeVisible();
    await formDialog.getByLabel("Nome do cliente").fill(customerName);
    await formDialog.getByRole("button", { name: "Salvar cadastro" }).click();

    const toastText = page.getByText("Cliente cadastrado com sucesso.");
    await expect(toastText).toBeVisible();
    await expect(page.getByText(customerName).first()).toBeVisible();

    await expect.poll(() => new URL(page.url()).searchParams.get("notice")).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get("noticeId")).toBeNull();

    await expect(toastText).not.toBeVisible({ timeout: 7000 });
  });
});
