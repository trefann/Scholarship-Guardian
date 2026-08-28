import { expect, test } from '@playwright/test';

const scholarshipId = 'pm_yasasvi_top_class_college';

test('review alone stays blocked and corrected demo evidence unlocks handoff', async ({ page }) => {
  await page.goto('/profile');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'See scholarship matches' }).click();
  await expect(page.getByRole('heading', { name: 'These schemes may fit your situation.' })).toBeVisible();
  await page.goto(`/scholarship/${scholarshipId}`);
  await expect(page.getByRole('heading', { name: 'Why this may match you' })).toBeVisible();
  await page.goto(`/preparation/${scholarshipId}`);
  await expect(page.getByRole('heading', { name: 'Know what each document proves.' })).toBeVisible();
  await page.goto(`/documents/${scholarshipId}`);
  await page.getByRole('button', { name: 'Run Application X-Ray' }).click();

  await expect(page.getByRole('heading', { name: 'Almost ready' })).toBeVisible();
  await page.goto(`/issue/demo-name-mismatch?scholarship=${scholarshipId}`);
  await page.getByRole('button', { name: 'I’ve reviewed this' }).click();
  await expect(page.getByRole('heading', { name: 'Reviewed—not resolved.' })).toBeVisible();

  await page.goto(`/ready/${scholarshipId}`);
  await expect(page.getByRole('heading', { name: 'A preventable issue still needs correction.' })).toBeVisible();

  await page.goto(`/issue/demo-name-mismatch?scholarship=${scholarshipId}`);
  await page.getByRole('button', { name: 'Apply corrected demo evidence' }).click();
  await expect(page.getByRole('heading', { name: 'Ready to continue', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View official handoff' })).toBeVisible();
  await page.goto(`/ready/${scholarshipId}`);
  await expect(page.getByRole('heading', { name: 'Continue outside Scholarship Guardian.' })).toBeVisible();
});
