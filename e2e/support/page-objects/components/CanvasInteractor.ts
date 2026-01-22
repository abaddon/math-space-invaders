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

  /**
   * @param page - Playwright Page instance
   * @param canvasSelector - CSS selector for canvas element (default: '[data-testid="game-canvas"]')
   */
  constructor(page: Page, canvasSelector: string = '[data-testid="game-canvas"]') {
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
   * Click on one of the three answer blocks at the top of the canvas.
   *
   * Maps semantic positions to percentage-based coordinates:
   * - left: 20% horizontal, 15% vertical
   * - center: 50% horizontal, 15% vertical
   * - right: 80% horizontal, 15% vertical
   *
   * @param position - Which answer block to click: 'left', 'center', or 'right'
   *
   * @example
   * // Click the center answer block
   * await canvasInteractor.clickAnswerBlock('center');
   */
  async clickAnswerBlock(position: 'left' | 'center' | 'right'): Promise<void> {
    const positionMap: Record<'left' | 'center' | 'right', { x: number; y: number }> = {
      left: { x: 20, y: 15 },
      center: { x: 50, y: 15 },
      right: { x: 80, y: 15 },
    };

    const coords = positionMap[position];
    await this.clickAtPercent(coords.x, coords.y);
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
