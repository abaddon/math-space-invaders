import { Page, Locator, expect } from '@playwright/test';

/**
 * Abstract base class for all Page Objects.
 *
 * Provides common navigation, waiting, and assertion methods
 * to avoid code duplication across Page Objects.
 */
export abstract class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a path relative to baseURL.
   * @param path - Path to navigate to (default: '/')
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for page to reach networkidle state.
   * Useful after navigation or after triggering network requests.
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for an element to become visible.
   * @param locator - Playwright Locator
   * @param timeout - Optional timeout in milliseconds
   */
  async waitForVisible(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Assert that an element is visible.
   * @param locator - Playwright Locator
   */
  async expectVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Assert that an element is hidden.
   * @param locator - Playwright Locator
   */
  async expectHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  /**
   * Assert that an element contains the specified text.
   * @param locator - Playwright Locator
   * @param text - Expected text (string or RegExp)
   */
  async expectText(locator: Locator, text: string | RegExp): Promise<void> {
    await expect(locator).toHaveText(text);
  }
}
