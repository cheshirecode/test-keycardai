import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage without redirecting', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Verify we're still on the homepage (not redirected)
    expect(page.url()).toBe('http://localhost:3000/')

    // Verify key homepage elements are present
    await expect(page.locator('h1')).toContainText('Project Scaffolder')
    await expect(page.locator('text=Create GitHub projects with natural language')).toBeVisible()

    // Verify the welcome message is displayed
    await expect(page.locator('text=Welcome to Project Scaffolder')).toBeVisible()

    // Verify the New Project button is present
    await expect(page.locator('button:has-text("+ New Project")')).toBeVisible()

    // Verify the chat input is present
    await expect(page.locator('input[type="text"]')).toBeVisible()

    // Verify the sidebar is present
    await expect(page.locator('text=Projects')).toBeVisible()
  })

  test('should not auto-select any repository on homepage load', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')

    // Wait for the page to load and any potential redirects
    await page.waitForTimeout(2000)

    // Verify we're still on the homepage
    expect(page.url()).toBe('http://localhost:3000/')

    // Verify no repository is selected (no repository mode indicators)
    await expect(page.locator('text=Modifying:')).not.toBeVisible()

    // Verify we see the welcome message instead of repository content
    await expect(page.locator('text=Welcome to Project Scaffolder')).toBeVisible()
  })

  test('should display sidebar with repositories', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')

    // Wait for the sidebar to load
    await page.waitForSelector('text=Projects')

    // Verify the sidebar is visible
    await expect(page.locator('text=Projects')).toBeVisible()

    // Wait for repositories to load (or show loading state)
    await page.waitForTimeout(1000)

    // Should see either repositories or a loading/empty state
    const hasRepositories = await page.locator('[data-testid="repository-item"]').count() > 0
    const hasLoadingState = await page.locator('text=Loading repositories').isVisible()
    const hasEmptyState = await page.locator('text=No repositories found').isVisible()

    // At least one of these should be true
    expect(hasRepositories || hasLoadingState || hasEmptyState).toBeTruthy()
  })

  test('should allow creating a new project', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Click the New Project button
    await page.click('button:has-text("+ New Project")')

    // Verify the input field gets focus
    await expect(page.locator('input[type="text"]')).toBeFocused()

    // Type a project request
    await page.fill('input[type="text"]', 'Create a simple React app')

    // Verify the send button is enabled
    await expect(page.locator('button:has-text("Send")')).toBeEnabled()
  })

  test('should handle navigation between home and repositories', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify we're on homepage
    expect(page.url()).toBe('http://localhost:3000/')

    // If there are repositories, try clicking one
    const repositoryItems = page.locator('[data-testid="repository-item"]')
    const repositoryCount = await repositoryItems.count()

    if (repositoryCount > 0) {
      // Click the first repository
      await repositoryItems.first().click()

      // Wait for navigation
      await page.waitForLoadState('networkidle')

      // Verify we navigated to a project page
      expect(page.url()).toMatch(/\/project\/[^\/]+\/[^\/]+/)

      // Navigate back to home by clicking the home button or logo
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Verify we're back on homepage
      expect(page.url()).toBe('http://localhost:3000/')
      await expect(page.locator('text=Welcome to Project Scaffolder')).toBeVisible()
    }
  })
})
