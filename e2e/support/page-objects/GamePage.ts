import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CanvasInteractor } from './components/CanvasInteractor';
import { HUDComponent } from './components/HUDComponent';

/**
 * GamePage represents the main game screen.
 *
 * Composes BasePage, CanvasInteractor, and HUDComponent to provide
 * a high-level API for E2E tests that interact with the game.
 *
 * Usage:
 * ```typescript
 * const gamePage = new GamePage(page);
 * await gamePage.goto();
 * await gamePage.waitForGameReady();
 * await gamePage.clickAnswerBlock('center');
 * const score = await gamePage.getScore();
 * ```
 */
export class GamePage extends BasePage {
  readonly canvas: CanvasInteractor;
  readonly hud: HUDComponent;

  constructor(page: Page) {
    super(page);
    this.canvas = new CanvasInteractor(page);
    this.hud = new HUDComponent(page);
  }

  /**
   * Navigate to game page and wait for load.
   */
  async goto(): Promise<void> {
    await super.goto('/');
    await this.waitForPageLoad();
  }

  /**
   * Wait for game canvas to be visible and ready.
   */
  async waitForGameReady(): Promise<void> {
    const canvasLocator = this.page.locator('[data-testid="game-canvas"]');
    await this.waitForVisible(canvasLocator);
  }

  /**
   * Click answer block by position (convenience wrapper).
   * @param position - Which answer block to click: 'left', 'center', or 'right'
   */
  async clickAnswerBlock(position: 'left' | 'center' | 'right'): Promise<void> {
    await this.canvas.clickAnswerBlock(position);
  }

  /**
   * Get current score (convenience wrapper).
   * @returns Current score
   */
  async getScore(): Promise<number> {
    return await this.hud.getScore();
  }

  /**
   * Get current level (convenience wrapper).
   * @returns Current level
   */
  async getLevel(): Promise<number> {
    return await this.hud.getLevel();
  }

  /**
   * Get current lives (convenience wrapper).
   * @returns Current lives
   */
  async getLives(): Promise<number> {
    return await this.hud.getLives();
  }

  /**
   * Get current game state (MENU, PLAYING, PAUSED, etc.).
   * @returns Game state string
   */
  async getGameState(): Promise<string> {
    return await this.hud.getGameState();
  }
}
