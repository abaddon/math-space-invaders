// Google Analytics 4 Service
// Tracks all user actions in the Math Space Invaders game

// Type definitions for gtag
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

// Analytics configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

// Check if analytics is available
const isAnalyticsEnabled = (): boolean => {
  return typeof window !== 'undefined' &&
         typeof window.gtag === 'function' &&
         GA_MEASUREMENT_ID !== '';
};

// Generic event tracking function
const trackEvent = (
  eventName: string,
  parameters?: Record<string, string | number | boolean>
): void => {
  if (!isAnalyticsEnabled()) {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', eventName, parameters);
    }
    return;
  }

  window.gtag('event', eventName, parameters);
};

// ============================================
// AUTHENTICATION EVENTS
// ============================================

export const trackSignUp = (): void => {
  trackEvent('sign_up', {
    method: 'username_password'
  });
};

export const trackLogin = (): void => {
  trackEvent('login', {
    method: 'username_password'
  });
};

export const trackLogout = (): void => {
  trackEvent('logout');
};

export const trackAuthError = (errorType: string, authMode: 'signin' | 'signup'): void => {
  trackEvent('auth_error', {
    error_type: errorType,
    auth_mode: authMode
  });
};

export const trackAuthTabSwitch = (tab: 'signin' | 'signup'): void => {
  trackEvent('auth_tab_switch', {
    tab
  });
};

export const trackSessionRestored = (): void => {
  trackEvent('session_restored');
};

// ============================================
// GAME FLOW EVENTS
// ============================================

export const trackGameStart = (playerId?: string): void => {
  trackEvent('game_start', {
    player_id: playerId || 'anonymous'
  });
};

export const trackGamePause = (level: number, score: number): void => {
  trackEvent('game_pause', {
    level,
    score
  });
};

export const trackGameResume = (level: number, score: number): void => {
  trackEvent('game_resume', {
    level,
    score
  });
};

export const trackGameOver = (
  finalScore: number,
  finalLevel: number,
  totalCorrect: number
): void => {
  trackEvent('game_over', {
    final_score: finalScore,
    final_level: finalLevel,
    total_correct: totalCorrect
  });
};

// ============================================
// GAMEPLAY EVENTS
// ============================================

export const trackAnswerCorrect = (
  level: number,
  operationType: string,
  score: number
): void => {
  trackEvent('answer_correct', {
    level,
    operation_type: operationType,
    score
  });
};

export const trackAnswerWrong = (
  level: number,
  operationType: string,
  livesRemaining: number
): void => {
  trackEvent('answer_wrong', {
    level,
    operation_type: operationType,
    lives_remaining: livesRemaining
  });
};

export const trackAnswerMissed = (
  level: number,
  operationType: string,
  livesRemaining: number
): void => {
  trackEvent('answer_missed', {
    level,
    operation_type: operationType,
    lives_remaining: livesRemaining
  });
};

export const trackLevelUp = (
  newLevel: number,
  tier: number,
  score: number
): void => {
  trackEvent('level_up', {
    new_level: newLevel,
    tier,
    score
  });
};

export const trackTierUp = (
  newTier: number,
  tierDescription: string
): void => {
  trackEvent('tier_up', {
    new_tier: newTier,
    tier_description: tierDescription
  });
};

// ============================================
// LEADERBOARD EVENTS
// ============================================

export const trackLeaderboardOpen = (source: 'user_bar' | 'game_over' | 'menu'): void => {
  trackEvent('leaderboard_open', {
    source
  });
};

export const trackLeaderboardClose = (): void => {
  trackEvent('leaderboard_close');
};

export const trackLeaderboardRetry = (): void => {
  trackEvent('leaderboard_retry');
};

export const trackHighScoreAchieved = (
  newScore: number,
  previousScore: number
): void => {
  trackEvent('high_score_achieved', {
    new_score: newScore,
    previous_score: previousScore,
    improvement: newScore - previousScore
  });
};

// ============================================
// UI/NAVIGATION EVENTS
// ============================================

export const trackScreenView = (screenName: string): void => {
  trackEvent('screen_view', {
    screen_name: screenName
  });
};

export const trackPageView = (screen: 'auth' | 'menu' | 'game'): void => {
  trackEvent('page_view', {
    screen
  });
};

// ============================================
// DEVICE/PLATFORM EVENTS
// ============================================

export const trackDeviceDetected = (
  deviceType: 'touch' | 'desktop',
  screenWidth: number,
  screenHeight: number
): void => {
  trackEvent('device_detected', {
    device_type: deviceType,
    screen_width: screenWidth,
    screen_height: screenHeight
  });
};

// ============================================
// INITIALIZATION
// ============================================

export const initAnalytics = (): void => {
  if (!GA_MEASUREMENT_ID) {
    if (import.meta.env.DEV) {
      console.log('[Analytics] No Measurement ID configured. Set VITE_GA_MEASUREMENT_ID in .env');
    }
    return;
  }

  // gtag.js is loaded via index.html
  if (isAnalyticsEnabled()) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false // We'll track page views manually
    });

    if (import.meta.env.DEV) {
      console.log('[Analytics] Initialized with ID:', GA_MEASUREMENT_ID);
    }
  }
};

// Export measurement ID for use in index.html script
export const getGAMeasurementId = (): string => GA_MEASUREMENT_ID;
