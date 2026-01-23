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

  /**
   * Get answer blocks from game state (convenience wrapper).
   * @returns Array of answer blocks with position, value, isCorrect
   */
  async getAnswerBlocks() {
    return await this.hud.getAnswerBlocks();
  }

  /**
   * Get current math problem from game state (convenience wrapper).
   * @returns Current problem with displayString and correctAnswer, or null
   */
  async getCurrentProblem() {
    return await this.hud.getCurrentProblem();
  }

  /**
   * Find the position of the correct answer block.
   * @returns Position of correct block ('left', 'center', or 'right')
   * @throws Error if no correct answer block is found
   */
  async findCorrectAnswerPosition(): Promise<'left' | 'center' | 'right'> {
    const blocks = await this.hud.getAnswerBlocks();
    const correctBlock = blocks.find(b => b.isCorrect);
    if (!correctBlock) {
      throw new Error('No correct answer block found');
    }
    return correctBlock.position;
  }

  /**
   * Fire at the correct answer block.
   * Finds which block has isCorrect=true and fires at it.
   *
   * Strategy: Use keyboard (Space) to fire after positioning via keyboard.
   * Keyboard is more reliable than canvas click in E2E environments.
   */
  async clickCorrectAnswer(): Promise<void> {
    const blocks = await this.hud.getAnswerBlocks();
    const correctBlock = blocks.find(b => b.isCorrect);
    if (!correctBlock) {
      throw new Error('No correct answer block found');
    }
    await this.fireAtBlock(correctBlock.position, correctBlock.x);
  }

  /**
   * Fire at a wrong answer block.
   * Finds a block with isCorrect=false and fires at it.
   * @throws Error if no wrong answer block is found
   */
  async clickWrongAnswer(): Promise<void> {
    const blocks = await this.hud.getAnswerBlocks();
    const wrongBlock = blocks.find(b => !b.isCorrect);
    if (!wrongBlock) {
      throw new Error('No wrong answer block found');
    }
    await this.fireAtBlock(wrongBlock.position, wrongBlock.x);
  }

  /**
   * Fire at a specific block using the actual X coordinate from game state.
   *
   * Strategy:
   * 1. Move towards target using timed key hold
   * 2. Verify position and adjust if needed
   * 3. Press Space to fire when aligned
   * 4. Wait for projectile to hit
   *
   * Note: block.x is the CENTER of the block (100px wide).
   * Projectile needs to be within ±50px of block center to hit.
   * Tolerance of 40px ensures reliable hits.
   *
   * @param _position - Target column (unused, targetX is authoritative)
   * @param targetX - Actual X coordinate of the target block center from game state
   */
  private async fireAtBlock(_position: 'left' | 'center' | 'right', targetX: number): Promise<void> {
    // Ensure page/canvas has focus via keyboard interaction
    // Use Tab to ensure we're focused on the page, not a specific element
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(30);

    // Block is 100px wide, so we need to be within ±50px of center to hit
    // Use tolerance of 40px for reliable hits with some margin
    const tolerance = 40;

    // Position the ship under the target with polling
    for (let attempt = 0; attempt < 8; attempt++) {
      const currentX = await this.page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (window as any).__gameState?.starshipX ?? 0;
      });

      const delta = targetX - currentX;

      // Close enough - fire!
      if (Math.abs(delta) <= tolerance) {
        break;
      }

      // Calculate movement
      const keyToPress = delta > 0 ? 'ArrowRight' : 'ArrowLeft';
      const framesNeeded = Math.abs(delta) / 8;
      // For small adjustments, use minimum of 2 frames
      // For larger movements, use calculated time
      const holdDuration = Math.max(Math.round(framesNeeded * 17), 34);

      await this.page.keyboard.down(keyToPress);
      await this.page.waitForTimeout(holdDuration);
      await this.page.keyboard.up(keyToPress);
      await this.page.waitForTimeout(20);
    }

    // Fire
    await this.page.keyboard.press('Space');

    // Wait for projectile to travel and hit
    await this.page.waitForTimeout(1000);
  }
}
