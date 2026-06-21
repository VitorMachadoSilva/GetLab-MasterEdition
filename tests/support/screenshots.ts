import type { Page } from '@playwright/test';
import { appEnv } from './env';

export async function saveEvidence(page: Page, flow: string, name: string) {
  await page.screenshot({
    path: `${appEnv.screenshotRoot}/${flow}/${name}.png`,
    fullPage: true,
  });
}
