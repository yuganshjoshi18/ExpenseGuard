import { test, expect } from '@playwright/test';

test.describe('ExpenseGuard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Application loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/ExpenseGuard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('Navigation works between all pages', async ({ page }) => {
    const pages = [
      { name: 'Dashboard', url: '/' },
      { name: 'Transactions', url: '/transactions' },
      { name: 'Categories', url: '/categories' },
      { name: 'Budgets', url: '/budgets' },
      { name: 'Recurring Expenses', url: '/recurring-expenses' },
      { name: 'Reports', url: '/reports' },
      { name: 'Import / Export', url: '/import-export' },
      { name: 'Settings', url: '/settings' },
    ];

    for (const p of pages) {
      await page.click(`nav a[href="${p.url}"]`);
      await page.waitForURL(`**${p.url}`);
      await expect(page.locator('h1')).toContainText(p.name);
    }
  });

  test('Create a transaction', async ({ page }) => {
    await page.click('nav a[href="/transactions"]');
    await page.waitForURL('**/transactions');

    await page.click('button:has-text("Add Transaction")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.fill('input[placeholder="Enter transaction title"]', 'E2E Test Transaction');
    await page.fill('input[placeholder="0.00"]', '123.45');
    await page.selectOption('select', 'EXPENSE');
    await page.selectOption('select >> nth=1', { label: 'Food' });
    await page.fill('input[type="date"]', '2024-01-15');

    await page.click('button:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    await expect(page.locator('text=E2E Test Transaction')).toBeVisible();
  });

  test('Edit a transaction', async ({ page }) => {
    await page.click('nav a[href="/transactions"]');
    await page.waitForURL('**/transactions');

    // First create a transaction to edit
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="Enter transaction title"]', 'To Edit');
    await page.fill('input[placeholder="0.00"]', '100.00');
    await page.selectOption('select', 'EXPENSE');
    await page.selectOption('select >> nth=1', { label: 'Food' });
    await page.fill('input[type="date"]', '2024-01-15');
    await page.click('button:has-text("Create")');

    // Now edit it
    await page.click('button:has-text("Edit") >> nth=0');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.fill('input[placeholder="Enter transaction title"]', 'Edited Transaction');
    await page.click('button:has-text("Update")');

    await expect(page.locator('text=Edited Transaction')).toBeVisible();
  });

  test('Delete a transaction', async ({ page }) => {
    await page.click('nav a[href="/transactions"]');
    await page.waitForURL('**/transactions');

    // Create a transaction to delete
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="Enter transaction title"]', 'To Delete');
    await page.fill('input[placeholder="0.00"]', '50.00');
    await page.selectOption('select', 'EXPENSE');
    await page.selectOption('select >> nth=1', { label: 'Food' });
    await page.fill('input[type="date"]', '2024-01-15');
    await page.click('button:has-text("Create")');

    // Delete it
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Delete") >> nth=0');

    await expect(page.locator('text=To Delete')).not.toBeVisible();
  });

  test('Create a budget', async ({ page }) => {
    await page.click('nav a[href="/budgets"]');
    await page.waitForURL('**/budgets');

    await page.click('button:has-text("Add Budget")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.selectOption('select', { label: 'Food' });
    await page.fill('input[placeholder="0.00"]', '500.00');
    await page.selectOption('select >> nth=1', '1');
    await page.selectOption('select >> nth=2', '2024');

    await page.click('button:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    await expect(page.locator('text=Food')).toBeVisible();
    await expect(page.locator('text=₹500.00')).toBeVisible();
  });

  test('Import CSV', async ({ page }) => {
    await page.click('nav a[href="/import-export"]');
    await page.waitForURL('**/import-export');

    // Create a test CSV file
    const csvContent = `title,amount,type,category,date,description,paymentMethod
E2E Import Test,99.99,EXPENSE,Food,2024-01-20,Test import,CARD`;

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    await page.click('button:has-text("Import Transactions")');
    await expect(page.locator('text=Imported')).toBeVisible({ timeout: 10000 });
  });

  test('Export CSV', async ({ page }) => {
    await page.click('nav a[href="/import-export"]');
    await page.waitForURL('**/import-export');

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export All Transactions")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('transactions_export');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('View monthly summary on dashboard', async ({ page }) => {
    await page.click('nav a[href="/"]');
    await page.waitForURL('**/');

    // Check for stat cards
    await expect(page.locator('text=Total Income')).toBeVisible();
    await expect(page.locator('text=Total Expenses')).toBeVisible();
    await expect(page.locator('text=Available Balance')).toBeVisible();
    await expect(page.locator('text=Monthly Savings')).toBeVisible();
  });

  test('Create a category', async ({ page }) => {
    await page.click('nav a[href="/categories"]');
    await page.waitForURL('**/categories');

    await page.click('button:has-text("Add Category")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.fill('input[placeholder="Enter category name"]', 'E2E Test Category');
    await page.fill('input[type="color"]', '#ff0000');
    await page.click('button:has-text("Create")');

    await expect(page.locator('text=E2E Test Category')).toBeVisible();
  });

  test('Create recurring expense', async ({ page }) => {
    await page.click('nav a[href="/recurring-expenses"]');
    await page.waitForURL('**/recurring-expenses');

    await page.click('button:has-text("Add Recurring Expense")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.fill('input[placeholder="Enter title"]', 'E2E Recurring');
    await page.fill('input[placeholder="0.00"]', '200.00');
    await page.selectOption('select', { label: 'Food' });
    await page.selectOption('select >> nth=1', 'MONTHLY');
    await page.fill('input[type="date"] >> nth=0', '2024-01-01');

    await page.click('button:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    await expect(page.locator('text=E2E Recurring')).toBeVisible();
  });

  test('Settings page tabs work', async ({ page }) => {
    await page.click('nav a[href="/settings"]');
    await page.waitForURL('**/settings');

    await expect(page.locator('button[role="tab"]:has-text("Appearance")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Notifications")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Data & Privacy")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Advanced")')).toBeVisible();

    await page.click('button[role="tab"]:has-text("Notifications")');
    await expect(page.locator('text=Email Notifications')).toBeVisible();

    await page.click('button[role="tab"]:has-text("Data & Privacy")');
    await expect(page.locator('text=Export All Data')).toBeVisible();
  });
});