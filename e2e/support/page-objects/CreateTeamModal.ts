import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Create Team Modal (HTML5 dialog element).
 *
 * Provides methods for interacting with the team creation form,
 * including filling team details, selecting privacy settings,
 * and handling form submission/cancellation.
 *
 * Based on CreateTeamModal.tsx structure.
 */
export class CreateTeamModal extends BasePage {
  // Locators
  readonly dialog: Locator;
  readonly teamNameInput: Locator;
  readonly publicRadio: Locator;
  readonly privateRadio: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly doneButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly modalTitle: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators based on CreateTeamModal.tsx structure
    this.dialog = this.page.locator('dialog.create-team-modal');
    this.teamNameInput = this.page.locator('#team-name');
    this.publicRadio = this.page.locator('input[name="isPublic"][value="true"]');
    this.privateRadio = this.page.locator('input[name="isPublic"][value="false"]');
    this.passwordInput = this.page.locator('#team-password');
    this.submitButton = this.page.locator('button[type="submit"]');
    this.cancelButton = this.page.getByRole('button', { name: 'Cancel' });
    this.doneButton = this.page.getByRole('button', { name: 'Done' });
    this.errorMessage = this.page.locator('.error-message');
    this.successMessage = this.page.locator('text=Share this link');
    this.modalTitle = this.page.locator('dialog.create-team-modal h2');
  }

  /**
   * Wait for the modal to be open and visible.
   */
  async waitForModal(): Promise<void> {
    // Wait for dialog to have open attribute or be visible
    await expect(this.dialog).toBeVisible({ timeout: 5000 });
  }

  /**
   * Check if the modal is currently open.
   * @returns True if modal is open
   */
  async isOpen(): Promise<boolean> {
    // Check for open attribute on dialog element
    const hasOpen = await this.dialog.getAttribute('open');
    const isVisible = await this.dialog.isVisible();
    return hasOpen !== null || isVisible;
  }

  /**
   * Fill the form for creating a public team.
   * @param teamName - Name for the team
   */
  async fillPublicTeam(teamName: string): Promise<void> {
    await this.teamNameInput.fill(teamName);
    // Public radio is checked by default, but click to ensure
    await this.publicRadio.check();
  }

  /**
   * Fill the form for creating a private team with password.
   * Password input only appears after selecting private option.
   * @param teamName - Name for the team
   * @param password - Password for the private team
   */
  async fillPrivateTeam(teamName: string, password: string): Promise<void> {
    await this.teamNameInput.fill(teamName);
    // Select private radio to reveal password field
    await this.privateRadio.check();
    // Wait for password input to appear
    await expect(this.passwordInput).toBeVisible({ timeout: 3000 });
    await this.passwordInput.fill(password);
  }

  /**
   * Submit the form by clicking the submit button.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Cancel and close the modal.
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Click the Done button after successful team creation.
   */
  async clickDone(): Promise<void> {
    await this.doneButton.click();
  }

  /**
   * Wait for successful team creation.
   * Success is indicated by the ShareTeamLink component appearing.
   */
  async waitForSuccess(): Promise<void> {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get the error message text if visible.
   * @returns Error message text or empty string
   */
  async getError(): Promise<string> {
    try {
      const isVisible = await this.errorMessage.isVisible();
      if (!isVisible) return '';
      return (await this.errorMessage.textContent()) || '';
    } catch {
      return '';
    }
  }

  /**
   * Check if an error message is displayed.
   * @returns True if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Wait for a specific error message to appear.
   * @param message - Expected error message (partial match)
   */
  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message, { timeout: 5000 });
  }

  /**
   * Fill team name input only.
   * @param teamName - Name for the team
   */
  async fillTeamName(teamName: string): Promise<void> {
    await this.teamNameInput.fill(teamName);
  }

  /**
   * Select public team option.
   */
  async selectPublic(): Promise<void> {
    await this.publicRadio.check();
  }

  /**
   * Select private team option.
   */
  async selectPrivate(): Promise<void> {
    await this.privateRadio.check();
  }

  /**
   * Fill password for private team.
   * Assumes private option is already selected.
   * @param password - Team password
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Check if the password input is visible.
   * Password field only shows when private option is selected.
   * @returns True if password input is visible
   */
  async isPasswordFieldVisible(): Promise<boolean> {
    return await this.passwordInput.isVisible();
  }

  /**
   * Get the current value of the team name input.
   * @returns Current team name value
   */
  async getTeamNameValue(): Promise<string> {
    return await this.teamNameInput.inputValue();
  }

  /**
   * Check if public option is selected.
   * @returns True if public radio is checked
   */
  async isPublicSelected(): Promise<boolean> {
    return await this.publicRadio.isChecked();
  }

  /**
   * Check if private option is selected.
   * @returns True if private radio is checked
   */
  async isPrivateSelected(): Promise<boolean> {
    return await this.privateRadio.isChecked();
  }

  /**
   * Create a public team in one action.
   * Fills form and submits.
   * @param teamName - Name for the team
   */
  async createPublicTeam(teamName: string): Promise<void> {
    await this.fillPublicTeam(teamName);
    await this.submit();
  }

  /**
   * Create a private team in one action.
   * Fills form with password and submits.
   * @param teamName - Name for the team
   * @param password - Password for the private team
   */
  async createPrivateTeam(teamName: string, password: string): Promise<void> {
    await this.fillPrivateTeam(teamName, password);
    await this.submit();
  }

  /**
   * Wait for the modal to be closed.
   */
  async waitForClose(): Promise<void> {
    await expect(this.dialog).toBeHidden({ timeout: 5000 });
  }

  /**
   * Get share link after successful creation.
   * @returns The share link URL if visible, empty string otherwise
   */
  async getShareLink(): Promise<string> {
    try {
      await this.waitForSuccess();
      // ShareTeamLink component contains an input with the share URL
      const linkInput = this.page.locator('dialog.create-team-modal input[readonly]');
      return await linkInput.inputValue();
    } catch {
      return '';
    }
  }
}
