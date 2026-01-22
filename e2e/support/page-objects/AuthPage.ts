import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Authentication Screen.
 *
 * Provides methods for interacting with the sign-in and sign-up forms,
 * including navigation, form filling, submission, and error detection.
 */
export class AuthPage extends BasePage {
  // Locators
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signInTab: Locator;
  readonly signUpTab: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly gameTitle: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators based on AuthScreen.tsx selectors
    this.usernameInput = this.page.locator('#username');
    this.passwordInput = this.page.locator('#password');
    this.confirmPasswordInput = this.page.locator('#confirmPassword');
    this.signInTab = this.page.locator('.auth-tab', { hasText: 'Sign In' });
    this.signUpTab = this.page.locator('.auth-tab', { hasText: 'Sign Up' });
    this.submitButton = this.page.locator('.auth-submit-btn');
    this.errorMessage = this.page.locator('.auth-error');
    this.gameTitle = this.page.locator('.auth-title');
  }

  /**
   * Navigate to the authentication screen (root path).
   */
  async goto(): Promise<void> {
    await super.goto('/');
  }

  /**
   * Switch to the Sign Up tab.
   */
  async switchToSignUp(): Promise<void> {
    await this.signUpTab.click();
  }

  /**
   * Switch to the Sign In tab.
   */
  async switchToSignIn(): Promise<void> {
    await this.signInTab.click();
  }

  /**
   * Fill username and password fields.
   * @param username - Username to enter
   * @param password - Password to enter
   */
  async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  /**
   * Switch to Sign Up mode and fill all form fields including confirm password.
   * @param username - Username to enter
   * @param password - Password to enter
   */
  async fillSignUpForm(username: string, password: string): Promise<void> {
    await this.switchToSignUp();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
  }

  /**
   * Click the submit button to submit the form.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Get the error message text if visible.
   * @returns Error message text or empty string if not visible
   */
  async getErrorText(): Promise<string> {
    try {
      return await this.errorMessage.textContent() || '';
    } catch {
      return '';
    }
  }

  /**
   * Check if error message is visible.
   * @returns True if error message is visible, false otherwise
   */
  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Wait for the authentication screen to be visible.
   * Waits for the game title to appear.
   */
  async waitForAuthScreen(): Promise<void> {
    await this.waitForVisible(this.gameTitle);
  }
}
