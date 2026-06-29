import { expect, type Page } from '@playwright/test';
import type { TestUser } from '../fixtures/test-users';
import { appPaths } from './paths';

export async function loginAs(page: Page, user: TestUser) {
  await page.goto(appPaths.login);
  await page.getByPlaceholder(/seu\.nome@fmpsc\.edu\.br/i).fill(user.email);
  await page.getByPlaceholder(/seu cpf/i).fill(user.password);
  await page.getByRole('button', { name: /entrar no sistema/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: /sair|logout/i }).click();
  await expect(page).toHaveURL(/\/login/);
}

export async function expectProtectedRouteRedirect(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login/);
}
