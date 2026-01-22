import { Page } from '@playwright/test';

/**
 * Type definition for answer block exposed in game state.
 */
interface AnswerBlock {
  position: 'left' | 'center' | 'right';
  value: string | number;
  isCorrect: boolean;
  x: number;
  y: number;
}

/**
 * Type definition for current problem exposed in game state.
 */
interface CurrentProblem {
  displayString: string;
  correctAnswer: number | string;
}

/**
 * Type definition for the game state exposed on window object.
 */
interface GameState {
  score?: number;
  level?: number;
  lives?: number;
  gameState?: string;
  answerBlocks?: AnswerBlock[];
  currentProblem?: CurrentProblem | null;
}

/**
 * Extend Window interface to include __gameState property.
 */
interface WindowWithGameState extends Window {
  __gameState?: GameState;
}

/**
 * HUDComponent reads game state from the window.__gameState object.
 *
 * This component provides methods to retrieve score, level, lives,
 * and game state from the game's global state object.
 *
 * Note: Requires the game to expose __gameState on window object.
 * This will be implemented in Plan 02-02.
 */
export class HUDComponent {
  private page: Page;

  /**
   * @param page - Playwright Page instance
   */
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get the current score from game state.
   * @returns Current score (default: 0 if not available)
   */
  async getScore(): Promise<number> {
    return await this.page.evaluate(() => (window as WindowWithGameState).__gameState?.score ?? 0);
  }

  /**
   * Get the current level from game state.
   * @returns Current level (default: 1 if not available)
   */
  async getLevel(): Promise<number> {
    return await this.page.evaluate(() => (window as WindowWithGameState).__gameState?.level ?? 1);
  }

  /**
   * Get the current number of lives from game state.
   * @returns Current lives (default: 3 if not available)
   */
  async getLives(): Promise<number> {
    return await this.page.evaluate(() => (window as WindowWithGameState).__gameState?.lives ?? 3);
  }

  /**
   * Get the current game state.
   * @returns Game state string (default: 'MENU' if not available)
   *
   * Expected values: 'MENU', 'PLAYING', 'PAUSED', 'LEVEL_UP', 'GAME_OVER'
   */
  async getGameState(): Promise<string> {
    return await this.page.evaluate(() => (window as WindowWithGameState).__gameState?.gameState ?? 'MENU');
  }

  /**
   * Get the answer blocks from game state.
   * @returns Array of answer blocks with position, value, isCorrect
   */
  async getAnswerBlocks(): Promise<Array<{
    position: 'left' | 'center' | 'right';
    value: string | number;
    isCorrect: boolean;
  }>> {
    return await this.page.evaluate(() => {
      const state = (window as WindowWithGameState).__gameState;
      return state?.answerBlocks?.map(block => ({
        position: block.position,
        value: block.value,
        isCorrect: block.isCorrect
      })) || [];
    });
  }

  /**
   * Get the current math problem from game state.
   * @returns Current problem with displayString and correctAnswer, or null
   */
  async getCurrentProblem(): Promise<{
    displayString: string;
    correctAnswer: number | string;
  } | null> {
    return await this.page.evaluate(() => {
      const state = (window as WindowWithGameState).__gameState;
      return state?.currentProblem || null;
    });
  }
}
