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
   * 1. Get current spaceship X position and canvas width from game state
   * 2. Calculate the exact movement needed (target X - current X)
   * 3. Use keyboard keys to move to precise position
   * 4. Press Space to fire
   * 5. Wait for projectile to hit
   *
   * @param _position - Target column (unused, targetX is authoritative)
   * @param targetX - Actual X coordinate of the target block from game state
   */
  private async fireAtBlock(_position: 'left' | 'center' | 'right', targetX: number): Promise<void> {
    // Ensure page has focus
    await this.page.click('body', { force: true });
    await this.page.waitForTimeout(100);

    // Get current starship position and canvas width from game state
    const gameState = await this.page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = (window as any).__gameState;
      return {
        starshipX: state?.starshipX ?? 0,
        canvasWidth: state?.canvasWidth ?? 400,
        gameState: state?.gameState ?? 'UNKNOWN'
      };
    });

    const currentX = gameState.starshipX;
    const deltaX = targetX - currentX;

    // Movement speed is 8 units per frame (from Game.tsx moveSpeed)
    // Each key press moves approximately 8 units
    const moveSpeed = 8;
    const keysNeeded = Math.abs(Math.round(deltaX / moveSpeed));
    const direction = deltaX > 0 ? 'd' : 'a';

    // Move spaceship to target position by holding the key down
    // The game uses keysPressed.has() which checks if key is currently pressed
    // keyboard.press() does keydown+keyup too quickly, so we use down/up with delays
    const keyToHold = direction === 'd' ? 'ArrowRight' : 'ArrowLeft';

    // Only move if we actually need to
    if (keysNeeded > 0) {
      // Hold the key down for the duration of movement
      // Movement is 8 units per frame at 60fps = 8 units per ~16ms
      // For deltaX of 170, we need ~21 frames = ~350ms
      const holdDuration = keysNeeded * 20;

      await this.page.keyboard.down(keyToHold);
      await this.page.waitForTimeout(holdDuration);
      await this.page.keyboard.up(keyToHold);

      // Small delay to ensure spaceship position is updated
      await this.page.waitForTimeout(50);

    }

    // Fire with Space
    await this.page.keyboard.press('Space');

    // Wait for projectile to travel and hit
    // Projectile speed is 15 units/frame, canvas height ~600, so max travel time ~40 frames = ~670ms at 60fps
    // Add buffer for collision detection and state update
    await this.page.waitForTimeout(1000);
  }
}
