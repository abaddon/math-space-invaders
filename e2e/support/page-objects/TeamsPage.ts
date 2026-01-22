import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Team Page interactions (/team/:slug routes).
 *
 * Provides methods for navigating to team pages, joining teams (public and private),
 * leaving teams, and verifying membership status.
 *
 * Based on TeamPage.tsx structure and DOM elements.
 */
export class TeamsPage extends BasePage {
  // Locators
  readonly title: Locator;
  readonly memberCount: Locator;
  readonly playButton: Locator;
  readonly leaderboardButton: Locator;
  readonly joinButton: Locator;
  readonly passwordInput: Locator;
  readonly joinError: Locator;
  readonly leaveButton: Locator;
  readonly homeLink: Locator;
  readonly joinSuccessTitle: Locator;
  readonly continueButton: Locator;
  readonly signUpPrompt: Locator;
  readonly loadingScreen: Locator;
  readonly notFoundTitle: Locator;
  readonly manageButton: Locator;
  readonly settingsButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators based on TeamPage.tsx structure
    this.title = this.page.locator('.title');
    this.memberCount = this.page.locator('text=Members:');
    this.playButton = this.page.getByRole('button', { name: /Play for/i });
    this.leaderboardButton = this.page.getByRole('button', { name: /View Leaderboard/i });
    this.joinButton = this.page.getByRole('button', { name: /Join Team/i });
    this.passwordInput = this.page.locator('#team-password');
    this.joinError = this.page.locator('div').filter({ hasText: /^.+$/ }).locator('[style*="color: #ff4757"]').first();
    this.leaveButton = this.page.getByRole('button', { name: /Leave Team/i });
    this.homeLink = this.page.getByRole('link', { name: /Home|Go Home/i });
    this.joinSuccessTitle = this.page.locator('.title', { hasText: 'Joined!' });
    this.continueButton = this.page.getByRole('button', { name: /Continue/i });
    this.signUpPrompt = this.page.getByRole('link', { name: /Sign up to join/i });
    this.loadingScreen = this.page.locator('.loading-screen');
    this.notFoundTitle = this.page.locator('.title', { hasText: 'Team Not Found' });
    this.manageButton = this.page.getByRole('button', { name: /Manage Members/i });
    this.settingsButton = this.page.getByRole('button', { name: /Settings/i });
  }

  /**
   * Navigate to a specific team page by slug.
   * @param slug - Team URL slug
   */
  async gotoTeam(slug: string): Promise<void> {
    await super.goto(`/team/${slug}`);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to a private team with password in URL hash.
   * @param slug - Team URL slug
   * @param password - Password to include in hash
   */
  async gotoTeamWithPassword(slug: string, password: string): Promise<void> {
    await super.goto(`/team/${slug}#${password}`);
    await this.waitForPageLoad();
  }

  /**
   * Get the team name from the title element.
   * @returns Team name text
   */
  async getTeamName(): Promise<string> {
    const text = await this.title.textContent();
    return text?.trim() || '';
  }

  /**
   * Get the member count from the page.
   * Parses "Members: X" text to extract the count.
   * @returns Number of members
   */
  async getMemberCount(): Promise<number> {
    const text = await this.memberCount.textContent();
    const match = text?.match(/Members:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Join a public team (no password required).
   * Clicks the join button and waits for response.
   */
  async joinPublicTeam(): Promise<void> {
    await this.joinButton.click();
  }

  /**
   * Join a private team with a password.
   * Fills the password field and clicks join button.
   * @param password - Team password
   */
  async joinPrivateTeam(password: string): Promise<void> {
    await this.passwordInput.fill(password);
    await this.joinButton.click();
  }

  /**
   * Verify that joining was successful.
   * Checks for "Joined!" success message.
   */
  async expectJoinSuccess(): Promise<void> {
    await expect(this.joinSuccessTitle).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify that a specific join error message is displayed.
   * @param message - Expected error message (partial match)
   */
  async expectJoinError(message: string): Promise<void> {
    const errorElement = this.page.locator(`text=${message}`);
    await expect(errorElement).toBeVisible({ timeout: 5000 });
  }

  /**
   * Check if any error message is visible.
   * @returns True if an error is displayed
   */
  async hasJoinError(): Promise<boolean> {
    // Look for the styled error div
    const errorDiv = this.page.locator('[style*="#ff4757"]');
    return await errorDiv.isVisible();
  }

  /**
   * Leave the current team.
   * Handles the confirm dialog automatically.
   */
  async leaveTeam(): Promise<void> {
    // Set up dialog handler to accept the confirm
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await this.leaveButton.click();
  }

  /**
   * Attempt to leave team but cancel the confirmation.
   */
  async leaveTeamCancel(): Promise<void> {
    // Set up dialog handler to dismiss the confirm
    this.page.once('dialog', async (dialog) => {
      await dialog.dismiss();
    });
    await this.leaveButton.click();
  }

  /**
   * Check if user is a member of the current team.
   * Members see "Play for [team]" button; non-members see "Join Team" button.
   * @returns True if the user is a member
   */
  async isMember(): Promise<boolean> {
    // Wait a moment for page state to settle
    await this.page.waitForTimeout(500);

    // If Play button is visible, user is a member
    const playVisible = await this.playButton.isVisible();
    if (playVisible) return true;

    // If Join button is visible, user is not a member
    const joinVisible = await this.joinButton.isVisible();
    if (joinVisible) return false;

    // Check for join success screen (still counts as member)
    const successVisible = await this.joinSuccessTitle.isVisible();
    return successVisible;
  }

  /**
   * Check if the team was not found (404 state).
   * @returns True if team not found message is displayed
   */
  async isTeamNotFound(): Promise<boolean> {
    return await this.notFoundTitle.isVisible();
  }

  /**
   * Check if the page is still loading.
   * @returns True if loading indicator is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingScreen.isVisible();
  }

  /**
   * Wait for loading to complete.
   */
  async waitForLoaded(): Promise<void> {
    await expect(this.loadingScreen).toBeHidden({ timeout: 10000 });
  }

  /**
   * Click the play button to start game for the team.
   */
  async clickPlay(): Promise<void> {
    await this.playButton.click();
  }

  /**
   * Click the leaderboard button to view team leaderboard.
   */
  async clickLeaderboard(): Promise<void> {
    await this.leaderboardButton.click();
  }

  /**
   * Click the continue button after successful join.
   */
  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Navigate home from team page.
   */
  async clickHome(): Promise<void> {
    await this.homeLink.click();
  }

  /**
   * Check if user is prompted to sign up (unauthenticated view).
   * @returns True if sign up prompt is visible
   */
  async isSignUpPromptVisible(): Promise<boolean> {
    return await this.signUpPrompt.isVisible();
  }

  /**
   * Check if user can manage members (creator only).
   * @returns True if manage members button is visible
   */
  async canManageMembers(): Promise<boolean> {
    return await this.manageButton.isVisible();
  }

  /**
   * Check if user can access settings (creator only).
   * @returns True if settings button is visible
   */
  async canAccessSettings(): Promise<boolean> {
    return await this.settingsButton.isVisible();
  }
}
