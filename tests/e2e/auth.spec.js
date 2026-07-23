const { test, expect } = require('@playwright/test');
const { loginAs, logout, mainNav } = require('./helpers/auth');

test.describe('authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/patients');
    await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nobody@hospital.local');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('.form-error')).toHaveText(/invalid email or password/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test('logs in and logs out as doctor', async ({ page }) => {
    await loginAs(page, 'doctor');
    await expect(page.locator('.navbar-meta').getByText('Grace Chen')).toBeVisible();
    await expect(page.locator('.navbar-meta').getByText('Doctor')).toBeVisible();

    await logout(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('nurse cannot open Add patient', async ({ page }) => {
    await loginAs(page, 'nurse');
    await mainNav(page).getByRole('link', { name: 'Patients', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add patient' })).toHaveCount(0);

    await mainNav(page).getByRole('link', { name: 'Appointments', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Appointments' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Book appointment' })).toHaveCount(0);
  });
});
