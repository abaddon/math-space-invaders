import { Page, Locator } from '@playwright/test';

/**
 * CanvasInteractor provides percentage-based coordinate calculation
 * and clicking for HTML5 Canvas elements.
 *
 * This abstraction ensures viewport-independent canvas interactions
 * by converting percentage positions to absolute coordinates based
 * on the canvas's actual bounding box.
 */
export class CanvasInteractor {
  private canvas: Locator;
  private page: Page;

  /**
   * @param page - Playwright Page instance
   * @param canvasSelector - CSS selector for canvas element (default: '[data-testid="game-canvas"]')
   */
  constructor(page: Page, canvasSelector: string = '[data-testid="game-canvas"]') {
    this.page = page;
    this.canvas = page.locator(canvasSelector);
  }

  /**
   * Click the canvas at a specific percentage-based position.
   *
   * @param xPercent - X position as percentage (0-100)
   * @param yPercent - Y position as percentage (0-100)
   * @throws Error if canvas is not visible or has no bounding box
   *
   * @example
   * // Click at 50% horizontal, 25% vertical
   * await canvasInteractor.clickAtPercent(50, 25);
   */
  async clickAtPercent(xPercent: number, yPercent: number): Promise<void> {
    // Get the canvas bounding box
    const box = await this.canvas.boundingBox();

    if (!box) {
      throw new Error('Canvas element not found or not visible');
    }

    // Calculate absolute coordinates
    const x = (box.width * xPercent) / 100;
    const y = (box.height * yPercent) / 100;

    // Click at the calculated position relative to the canvas
    await this.canvas.click({ position: { x, y } });
  }

  /**
   * Fire a projectile aimed at the specified answer block column.
   *
   * Game mechanics: Clicking on the canvas moves the spaceship to the click X position
   * and fires a projectile straight up. The projectile hits whichever answer block
   * is directly above the spaceship. So we click at the X position of the target
   * answer column but at the bottom of the canvas where the spaceship is.
   *
   * Maps semantic positions to percentage-based X coordinates:
   * - left: 20% horizontal
   * - center: 50% horizontal
   * - right: 80% horizontal
   *
   * Y coordinate is always 85% (near the bottom where spaceship can be positioned)
   *
   * @param position - Which answer block to aim at: 'left', 'center', or 'right'
   *
   * @example
   * // Fire at the center answer block
   * await canvasInteractor.clickAnswerBlock('center');
   */
  async clickAnswerBlock(position: 'left' | 'center' | 'right'): Promise<void> {
    const xPositionMap: Record<'left' | 'center' | 'right', number> = {
      left: 20,
      center: 50,
      right: 80,
    };

    const x = xPositionMap[position];

    // Use keyboard to move spaceship to correct position and fire
    // This is more reliable than mouse clicks which may be ignored on touch-detected devices
    const targetPercent = x;
    const currentPercent = 50; // Spaceship starts at center

    // Move spaceship left or right using arrow keys
    if (targetPercent < currentPercent) {
      // Need to move left - hold left arrow briefly
      const keysToPress = Math.floor((currentPercent - targetPercent) / 5);
      for (let i = 0; i < keysToPress; i++) {
        await this.page.keyboard.press('ArrowLeft');
        await this.page.waitForTimeout(50);
      }
    } else if (targetPercent > currentPercent) {
      // Need to move right - hold right arrow briefly
      const keysToPress = Math.floor((targetPercent - currentPercent) / 5);
      for (let i = 0; i < keysToPress; i++) {
        await this.page.keyboard.press('ArrowRight');
        await this.page.waitForTimeout(50);
      }
    }

    // Fire projectile with Space key
    await this.page.keyboard.press('Space');
  }

  /**
   * Get the canvas bounding box for external use.
   * Useful for custom coordinate calculations or assertions.
   *
   * @returns Canvas bounding box or null if not visible
   */
  async getBounds(): Promise<{ x: number; y: number; width: number; height: number } | null> {
    return await this.canvas.boundingBox();
  }
}
