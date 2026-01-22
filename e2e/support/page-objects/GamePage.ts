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
   * Fire at a specific block using its position and X coordinate.
   * Uses keyboard controls for reliable cross-environment support.
   *
   * @param position - Target column name
   * @param targetX - Target X coordinate from game state
   */
  private async fireAtBlock(position: 'left' | 'center' | 'right', targetX: number): Promise<void> {
    const canvasLocator = this.page.locator('[data-testid="game-canvas"]');
    const box = await canvasLocator.boundingBox();
    if (!box) {
      throw new Error('Canvas not found');
    }

    // Calculate target X as percentage of canvas width
    const targetPercent = (targetX / box.width) * 100;

    // Move to position by first going to far left, then moving right
    // This normalizes the starting position for consistent movement

    // Press A to move left for a bit (normalize position)
    await this.page.keyboard.down('a');
    await this.page.waitForTimeout(500);
    await this.page.keyboard.up('a');

    // Calculate how long to hold D based on target position
    // At ~20% = short, ~50% = medium, ~80% = long
    let moveRightDuration = 0;
    if (targetPercent > 30) {
      moveRightDuration = (targetPercent - 20) * 8; // ~8ms per 1% of canvas
    }

    if (moveRightDuration > 0) {
      await this.page.keyboard.down('d');
      await this.page.waitForTimeout(Math.min(moveRightDuration, 1000));
      await this.page.keyboard.up('d');
    }

    // Brief pause to let spaceship settle
    await this.page.waitForTimeout(50);

    // Fire!
    await this.page.keyboard.press('Space');

    // Wait for projectile to reach target (animation time)
    await this.page.waitForTimeout(200);
  }
}
