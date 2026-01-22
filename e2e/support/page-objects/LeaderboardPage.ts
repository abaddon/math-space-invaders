import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Leaderboard entry data structure returned by getEntries()
 */
export interface LeaderboardEntryData {
  rank: string; // Medal emoji or "#N" format
  nickname: string;
  score: number;
  level: number;
}

/**
 * Page Object for the Leaderboard Modal.
 *
 * Provides methods for interacting with the leaderboard modal,
 * including reading entries, verifying sorting, and closing the modal.
 *
 * Supports both global and team leaderboards.
 */
export class LeaderboardPage extends BasePage {
  // Locators based on Leaderboard.tsx structure
  readonly overlay: Locator;
  readonly modal: Locator;
  readonly closeButton: Locator;
  readonly title: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly loadMoreButton: Locator;
  readonly emptyState: Locator;
  readonly statsSection: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly retryButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators based on Leaderboard.tsx CSS classes
    this.overlay = this.page.locator('.leaderboard-overlay');
    this.modal = this.page.locator('.leaderboard-modal');
    this.closeButton = this.page.locator('.close-btn');
    this.title = this.page.locator('.leaderboard-title');
    this.table = this.page.locator('.leaderboard-table');
    this.rows = this.page.locator('.leaderboard-row');
    this.loadMoreButton = this.page.locator('.load-more-btn');
    this.emptyState = this.page.locator('.leaderboard-empty');
    this.statsSection = this.page.locator('.your-stats');
    this.loadingSpinner = this.page.locator('.leaderboard-loading');
    this.errorMessage = this.page.locator('.leaderboard-error');
    this.retryButton = this.page.locator('.retry-btn');
  }

  /**
   * Wait for the leaderboard modal to become visible.
   * Waits for loading to complete.
   */
  async waitForLeaderboard(): Promise<void> {
    await this.waitForVisible(this.modal);
    // Wait for loading to complete (either entries, empty state, or error)
    await expect(this.loadingSpinner).toBeHidden({ timeout: 10000 });
  }

  /**
   * Get all leaderboard entries from the table.
   *
   * @returns Array of entry data with rank, nickname, score, and level
   */
  async getEntries(): Promise<LeaderboardEntryData[]> {
    const entries: LeaderboardEntryData[] = [];

    const rowCount = await this.rows.count();
    for (let i = 0; i < rowCount; i++) {
      const row = this.rows.nth(i);

      // Extract data from each column
      const rank = await row.locator('.col-rank').textContent() || '';
      const nickname = await row.locator('.col-player').textContent() || '';
      const scoreText = await row.locator('.col-score').textContent() || '0';
      const levelText = await row.locator('.col-level').textContent() || '0';

      entries.push({
        rank: rank.trim(),
        // Remove "YOU" badge if present
        nickname: nickname.replace('YOU', '').trim(),
        score: parseInt(scoreText, 10),
        level: parseInt(levelText, 10),
      });
    }

    return entries;
  }

  /**
   * Verify that scores are sorted in descending order (highest first).
   *
   * @returns True if scores are sorted correctly
   */
  async areScoresSorted(): Promise<boolean> {
    const entries = await this.getEntries();

    if (entries.length <= 1) {
      return true; // Single or empty list is always sorted
    }

    for (let i = 1; i < entries.length; i++) {
      if (entries[i].score > entries[i - 1].score) {
        return false; // Found out-of-order entry
      }
    }

    return true;
  }

  /**
   * Find a specific player's entry by nickname.
   *
   * @param nickname - Player nickname to find
   * @returns Entry data or null if not found
   */
  async findEntryForPlayer(
    nickname: string
  ): Promise<LeaderboardEntryData | null> {
    const entries = await this.getEntries();
    return entries.find((entry) => entry.nickname === nickname) || null;
  }

  /**
   * Close the leaderboard modal.
   * Clicks the close button and waits for modal to be hidden.
   */
  async close(): Promise<void> {
    await this.closeButton.click();
    await expect(this.modal).toBeHidden();
  }

  /**
   * Check if the leaderboard shows empty state.
   *
   * @returns True if empty state is visible
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Get the count of leaderboard entries.
   *
   * @returns Number of entries in the table
   */
  async getEntryCount(): Promise<number> {
    return await this.rows.count();
  }

  /**
   * Check if there are more entries to load.
   *
   * @returns True if "Load More" button is visible
   */
  async hasMoreEntries(): Promise<boolean> {
    return await this.loadMoreButton.isVisible();
  }

  /**
   * Click "Load More" to load additional entries.
   */
  async loadMore(): Promise<void> {
    await this.loadMoreButton.click();
    // Wait for loading to complete
    await expect(this.loadMoreButton).not.toHaveText(/Loading/);
  }

  /**
   * Get the leaderboard title text.
   *
   * @returns Title text (e.g., "Global Leaderboard" or "Team Name Leaderboard")
   */
  async getTitle(): Promise<string> {
    return (await this.title.textContent()) || '';
  }

  /**
   * Check if the current player's entry is highlighted.
   *
   * @returns True if a row has the "current-player" class
   */
  async isCurrentPlayerHighlighted(): Promise<boolean> {
    const highlightedRow = this.page.locator('.leaderboard-row.current-player');
    return await highlightedRow.isVisible();
  }

  /**
   * Check if an error state is displayed.
   *
   * @returns True if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Click retry button to reload leaderboard after error.
   */
  async retry(): Promise<void> {
    await this.retryButton.click();
    await this.waitForLeaderboard();
  }

  /**
   * Get player's stats from the stats section.
   *
   * @returns Object with highScore, bestLevel, gamesPlayed, totalCorrect
   */
  async getPlayerStats(): Promise<{
    highScore: number;
    bestLevel: number;
    gamesPlayed: number;
    totalCorrect: number;
  } | null> {
    if (!(await this.statsSection.isVisible())) {
      return null;
    }

    const statItems = this.statsSection.locator('.stat-item');
    const count = await statItems.count();

    if (count < 4) {
      return null; // Not enough stats displayed
    }

    // Global leaderboard shows: High Score, Best Level, Games, Correct
    const stats = {
      highScore: 0,
      bestLevel: 0,
      gamesPlayed: 0,
      totalCorrect: 0,
    };

    for (let i = 0; i < count; i++) {
      const item = statItems.nth(i);
      const valueText = await item.locator('.stat-value').textContent() || '0';
      const label = await item.locator('.stat-label').textContent() || '';
      const value = parseInt(valueText, 10) || 0;

      if (label.includes('High Score') || label.includes('Score')) {
        stats.highScore = value;
      } else if (label.includes('Level')) {
        stats.bestLevel = value;
      } else if (label.includes('Games')) {
        stats.gamesPlayed = value;
      } else if (label.includes('Correct')) {
        stats.totalCorrect = value;
      }
    }

    return stats;
  }
}
