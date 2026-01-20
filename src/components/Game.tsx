import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { GameState, GameScore, MathProblem, AnswerBlock, Projectile, PlayerProfile, AuthUser, LevelConfig, Particle } from '../types';
import { GAME_CONFIG, COLORS } from '../constants';
import { generateMathProblem, generateAnswerBlocks, getLevelConfig, calculateFallSpeed } from '../mathGenerator';
import { Leaderboard } from './Leaderboard';
import { Settings } from './Settings';
import { MyTeamsDropdown } from './MyTeamsDropdown';
import { updatePlayerStats, updateTeamLeaderboard } from '../leaderboardService';
import { getTierDescription, isNewTier, getTierNumber } from '../utils/levelUtils';
import { playSound } from '../services/audioService';
import {
  trackGameStart,
  trackGamePause,
  trackGameResume,
  trackGameOver,
  trackAnswerCorrect,
  trackAnswerWrong,
  trackAnswerMissed,
  trackLevelUp,
  trackTierUp,
  trackLeaderboardOpen,
  trackScreenView,
  trackHighScoreAchieved
} from '../analytics';

interface GameProps {
  authUser: AuthUser;
  currentPlayer: PlayerProfile | null;
  onPlayerUpdate: (player: PlayerProfile) => void;
  onLogout: () => void;
  onOpenCreateTeam: () => void;
  autoStart?: boolean; // Auto-start game without showing menu (for team play)
  onBackToTeam?: () => void; // Callback to return to team page (when playing in team context)
  teamName?: string; // Team name for display (when playing in team context)
  teamId?: string; // Team ID for score submission (when playing in team context)
}

export function Game({ authUser, currentPlayer, onPlayerUpdate, onLogout, onOpenCreateTeam, autoStart = false, onBackToTeam, teamName, teamId }: GameProps) {
  const { slug } = useParams<{ slug?: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(autoStart ? 'PLAYING' : 'MENU');
  const [activeTeamId, setActiveTeamId] = useState<string | null>(teamId || null);
  const [score, setScore] = useState<GameScore>({
    score: 0,
    level: 1,
    lives: GAME_CONFIG.INITIAL_LIVES,
    correctInLevel: 0,
  });
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [answerBlocks, setAnswerBlocks] = useState<AnswerBlock[]>([]);
  const [projectile, setProjectile] = useState<Projectile | null>(null);
  const [starshipX, setStarshipX] = useState(0);
  const [lastHitResult, setLastHitResult] = useState<'correct' | 'wrong' | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 600 });
  const [particles, setParticles] = useState<Particle[]>([]);

  // Level configuration state
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);

  // UI state
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const gameLoopRef = useRef<number | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const isProcessingWrongAnswer = useRef(false);
  const touchControlsActive = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Timer and countdown state
  const [problemStartTime, setProblemStartTime] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(1); // 0-1 percentage
  const [countdownNumber, setCountdownNumber] = useState<number>(0);
  const levelUpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const starCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate responsive block width based on canvas size
  // For 3 blocks with 30px padding on sides and 10px minimum spacing between blocks:
  // canvasWidth = 60 + 3*blockWidth + 20 (minimum), so blockWidth = (canvasWidth - 80) / 3
  const answerBlockWidth = useMemo(() => {
    const minWidth = 70;
    const maxWidth = GAME_CONFIG.ANSWER_BLOCK_WIDTH; // 100
    const calculatedWidth = Math.floor((canvasSize.width - 80) / 3);
    return Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
  }, [canvasSize.width]);

  // Spawn particles at a position
  const spawnParticles = useCallback((x: number, y: number, isCorrect: boolean) => {
    const count = isCorrect ? 15 : 10;
    const color = isCorrect ? COLORS.PRIMARY_GREEN : COLORS.WARNING_RED;
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: 3 + Math.random() * 4
      });
    }

    setParticles(prev => {
      const combined = [...prev, ...newParticles];
      // Cap particles at 50 to prevent performance issues
      return combined.length > 50 ? combined.slice(-50) : combined;
    });
  }, []);

  // Save stats when game ends
  const saveGameStats = useCallback(async (finalScore: GameScore) => {
    try {
      if (activeTeamId) {
        // Team play: submit to team leaderboard ONLY (not global)
        await updateTeamLeaderboard(
          activeTeamId,
          authUser.playerId,
          authUser.nickname,
          finalScore.score,
          finalScore.level
        );
      } else {
        // Global play: submit to global leaderboard via updatePlayerStats
        await updatePlayerStats(
          authUser.playerId,
          finalScore.score,
          finalScore.level,
          finalScore.score // correctAnswers = score in this game
        );
      }
      // Refresh player profile via parent callback
      const { getPlayerProfile } = await import('../leaderboardService');
      const updatedProfile = await getPlayerProfile(authUser.playerId);
      if (updatedProfile) {
        onPlayerUpdate(updatedProfile);
      }
    } catch (error) {
      console.error('Failed to save game stats:', error);
    }
  }, [authUser.playerId, authUser.nickname, onPlayerUpdate, activeTeamId]);

  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      const isTouch = 'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;
      setIsTouchDevice(isTouch);
      return isTouch;
    };
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);

  // Prevent all default touch behaviors (scrolling, bouncing, zooming)
  useEffect(() => {
    const preventDefaultTouch = (e: TouchEvent) => {
      // Allow touch events on buttons and interactive elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' ||
          target.closest('button') || target.closest('input') ||
          target.closest('.leaderboard-modal')) {
        return;
      }
      e.preventDefault();
    };

    const preventDefaultWheel = (e: WheelEvent) => {
      // Only allow scrolling in modal
      const target = e.target as HTMLElement;
      if (!target.closest('.leaderboard-modal')) {
        e.preventDefault();
      }
    };

    // Prevent touchmove and wheel events on document
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    document.addEventListener('wheel', preventDefaultWheel, { passive: false });

    // Prevent overscroll/bounce on iOS
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('touchmove', preventDefaultTouch);
      document.removeEventListener('wheel', preventDefaultWheel);
    };
  }, []);

  // Initialize canvas size - account for user bar
  useEffect(() => {
    const updateSize = () => {
      // User bar is 50px on desktop, 45px on mobile (below 500px)
      const isMobile = window.innerWidth <= 500;
      const userBarHeight = isMobile ? 45 : 50;

      // On mobile, use full screen width; on desktop, cap at 500px with some padding
      const width = isMobile
        ? window.innerWidth
        : Math.min(500, window.innerWidth - 40);

      // On mobile, use full available height; on desktop, cap at 700px
      const availableHeight = window.innerHeight - userBarHeight;
      const height = isMobile
        ? availableHeight
        : Math.min(700, availableHeight - 20);

      setCanvasSize({ width, height });
      setStarshipX(width / 2);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Create cached star background canvas
  useEffect(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = canvasSize.width;
    offscreen.height = canvasSize.height;
    const ctx = offscreen.getContext('2d');
    if (ctx) {
      // Draw space background
      ctx.fillStyle = COLORS.SPACE_BLACK;
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      // Draw stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 50; i++) {
        const x = (i * 73) % canvasSize.width;
        const y = (i * 137) % canvasSize.height;
        const size = (i % 3) + 1;
        ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    starCanvasRef.current = offscreen;
  }, [canvasSize.width, canvasSize.height]);

  // Update level config when level changes
  useEffect(() => {
    const config = getLevelConfig(score.level);
    setLevelConfig(config);
  }, [score.level]);

  // Calculate speed based on time-based difficulty system
  const getCurrentSpeed = useCallback((): number => {
    if (!levelConfig) return 1.5; // Default fallback

    // Calculate fall speed based on time available
    return calculateFallSpeed(canvasSize.height, levelConfig.timeAvailable);
  }, [levelConfig, canvasSize.height]);

  // Generate new round
  const generateNewRound = useCallback(() => {
    const problem = generateMathProblem(score.level);
    setCurrentProblem(problem);
    const blocks = generateAnswerBlocks(
      problem,
      canvasSize.width,
      answerBlockWidth,
      80
    );
    setAnswerBlocks(blocks);
    setProjectile(null);
    setLastHitResult(null);
    // Reset timer for new problem
    setProblemStartTime(Date.now());
    setTimeRemaining(1);
  }, [score.level, canvasSize.width, answerBlockWidth]);

  // Handle correct answer
  const handleCorrectAnswer = useCallback(() => {
    playSound('correct');
    setLastHitResult('correct');
    setTimeout(() => setLastHitResult(null), 300);

    // Track correct answer
    if (currentProblem) {
      trackAnswerCorrect(score.level, currentProblem.operation, score.score + 1);
    }

    setScore((prev) => {
      const newCorrectInLevel = prev.correctInLevel + 1;
      const newScore = prev.score + 1;

      if (newCorrectInLevel >= GAME_CONFIG.CORRECT_ANSWERS_PER_LEVEL) {
        const newLevel = prev.level + 1;
        const newTier = getTierNumber(newLevel);
        const oldTier = getTierNumber(prev.level);

        setGameState('LEVEL_UP');
        playSound('levelUp');
        // Clear any existing timeout
        if (levelUpTimeoutRef.current) {
          clearTimeout(levelUpTimeoutRef.current);
        }
        levelUpTimeoutRef.current = setTimeout(() => {
          setGameState('PLAYING');
          levelUpTimeoutRef.current = null;
        }, GAME_CONFIG.LEVEL_UP_DELAY);

        // Track level up
        trackLevelUp(newLevel, newTier, newScore);

        // Track tier up if entering a new tier
        if (newTier > oldTier) {
          trackTierUp(newTier, getTierDescription(newLevel));
        }

        return {
          score: newScore,
          level: newLevel,
          lives: prev.lives,
          correctInLevel: 0,
        };
      }

      return { ...prev, score: newScore, correctInLevel: newCorrectInLevel };
    });
  }, [currentProblem, score.level, score.score]);

  // Handle wrong answer
  const handleWrongAnswer = useCallback((missed: boolean = false) => {
    // Prevent double-calling during the same frame
    if (isProcessingWrongAnswer.current) return;
    isProcessingWrongAnswer.current = true;

    playSound('wrong');
    setLastHitResult('wrong');
    setTimeout(() => setLastHitResult(null), 300);

    setScore((prev) => {
      const newLives = prev.lives - 1;

      // Track wrong answer or missed answer
      if (currentProblem) {
        if (missed) {
          trackAnswerMissed(prev.level, currentProblem.operation, newLives);
        } else {
          trackAnswerWrong(prev.level, currentProblem.operation, newLives);
        }
      }

      if (newLives <= 0) {
        setGameState('GAME_OVER');
        playSound('gameOver');
        // Save stats when game over
        const finalScore = { ...prev, lives: 0 };
        saveGameStats(finalScore);

        // Track game over
        trackGameOver(finalScore.score, finalScore.level, finalScore.score);

        // Check for high score
        if (currentPlayer && finalScore.score > currentPlayer.highScore) {
          trackHighScoreAchieved(finalScore.score, currentPlayer.highScore);
        }

        return finalScore;
      }
      return { ...prev, lives: newLives };
    });

    // Reset the flag after a short delay to allow next wrong answer
    setTimeout(() => {
      isProcessingWrongAnswer.current = false;
    }, 100);
  }, [saveGameStats, currentProblem, currentPlayer]);

  // Start game with countdown
  const startGame = useCallback(() => {
    // Capture team context from URL at game start (or use prop if provided)
    const contextTeamId = teamId || (slug ? `team_${slug.toLowerCase()}` : null);
    setActiveTeamId(contextTeamId);

    setScore({
      score: 0,
      level: 1,
      lives: GAME_CONFIG.INITIAL_LIVES,
      correctInLevel: 0,
    });
    setStarshipX(canvasSize.width / 2);
    setAnswerBlocks([]);
    setProjectile(null);
    setTimeRemaining(1);

    // Start countdown
    setCountdownNumber(3);
    setGameState('COUNTDOWN');

    // Track game start
    trackGameStart(authUser.playerId);
    trackScreenView('game');
  }, [canvasSize.width, authUser.playerId, slug]);

  // Countdown effect
  useEffect(() => {
    if (gameState !== 'COUNTDOWN') return;

    if (countdownNumber > 0) {
      playSound('countdown');
      const timer = setTimeout(() => {
        setCountdownNumber(countdownNumber - 1);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished, start playing
      playSound('correct'); // Play a "go" sound
      setGameState('PLAYING');
    }
  }, [gameState, countdownNumber]);

  // Fire projectile
  const fireProjectile = useCallback(() => {
    if (projectile?.active || gameState !== 'PLAYING') return;
    playSound('laser');
    setProjectile({
      x: starshipX,
      y: canvasSize.height - 120,
      active: true,
    });
  }, [projectile, starshipX, canvasSize.height, gameState]);

  // Skip level up screen
  const skipLevelUp = useCallback(() => {
    if (gameState !== 'LEVEL_UP') return;
    if (levelUpTimeoutRef.current) {
      clearTimeout(levelUpTimeoutRef.current);
      levelUpTimeoutRef.current = null;
    }
    setGameState('PLAYING');
  }, [gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'LEVEL_UP') {
          skipLevelUp();
        } else {
          fireProjectile();
        }
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
          trackGamePause(score.level, score.score);
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
          trackGameResume(score.level, score.score);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [fireProjectile, skipLevelUp, gameState, score.level, score.score]);

  // Generate round when game starts or after hit
  useEffect(() => {
    if (gameState === 'PLAYING' && answerBlocks.length === 0 && score.lives > 0) {
      generateNewRound();
    }
  }, [gameState, answerBlocks.length, score.lives, generateNewRound]);

  // Main game loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const gameLoop = () => {
      // Update time remaining for visual timer
      if (levelConfig && problemStartTime > 0) {
        const elapsed = (Date.now() - problemStartTime) / 1000;
        const remaining = Math.max(0, 1 - elapsed / levelConfig.timeAvailable);
        setTimeRemaining(remaining);
      }

      // Handle keyboard and touch movement
      const moveSpeed = 8;
      if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a') || touchControlsActive.current.left) {
        setStarshipX((x) => Math.max(GAME_CONFIG.STARSHIP_WIDTH / 2, x - moveSpeed));
      }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || touchControlsActive.current.right) {
        setStarshipX((x) =>
          Math.min(canvasSize.width - GAME_CONFIG.STARSHIP_WIDTH / 2, x + moveSpeed)
        );
      }

      // Update answer blocks with time-based speed
      const speed = getCurrentSpeed();
      const bottomLimit = canvasSize.height - 100;

      setAnswerBlocks((blocks) => {
        if (blocks.length === 0) return blocks;

        const updated = blocks.map((b) => ({ ...b, y: b.y + speed }));
        const reachedBottom = updated.some((b) => b.y >= bottomLimit);

        if (reachedBottom) {
          handleWrongAnswer(true); // true = missed (reached bottom)
          return [];
        }
        return updated;
      });

      // Update projectile
      setProjectile((proj) => {
        if (!proj || !proj.active) return proj;
        const newY = proj.y - GAME_CONFIG.PROJECTILE_SPEED;
        if (newY < 0) return { ...proj, active: false };
        return { ...proj, y: newY };
      });

      // Check collisions
      setAnswerBlocks((blocks) => {
        setProjectile((proj) => {
          if (!proj || !proj.active || blocks.length === 0) return proj;

          for (const block of blocks) {
            const dx = Math.abs(proj.x - block.x);
            const dy = Math.abs(proj.y - block.y);

            if (dx < answerBlockWidth / 2 + 5 &&
                dy < GAME_CONFIG.ANSWER_BLOCK_HEIGHT / 2 + 5) {
              // Spawn particles at hit location
              spawnParticles(block.x, block.y, block.isCorrect);

              if (block.isCorrect) {
                handleCorrectAnswer();
              } else {
                handleWrongAnswer();
              }
              setAnswerBlocks([]);
              return { ...proj, active: false };
            }
          }
          return proj;
        });
        return blocks;
      });

      // Update particles
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.1, // gravity
          life: p.life - 0.03
        }))
        .filter(p => p.life > 0)
      );

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, canvasSize, getCurrentSpeed, handleCorrectAnswer, handleWrongAnswer, levelConfig, problemStartTime, answerBlockWidth, spawnParticles]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw cached star background (performance optimization)
    if (starCanvasRef.current) {
      ctx.drawImage(starCanvasRef.current, 0, 0);
    } else {
      // Fallback if cache not ready
      ctx.fillStyle = COLORS.SPACE_BLACK;
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }

    if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'LEVEL_UP' || gameState === 'COUNTDOWN') {
      // Draw HUD background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvasSize.width, 50);

      // Draw score
      ctx.fillStyle = COLORS.PRIMARY_GREEN;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score.score}`, 15, 30);

      // Draw level and tier info
      ctx.fillStyle = COLORS.PRIMARY_BLUE;
      ctx.textAlign = 'center';
      ctx.fillText(`Level: ${score.level}`, canvasSize.width / 2, 20);

      // Draw time indicator (smaller text)
      if (levelConfig) {
        ctx.fillStyle = COLORS.TEXT_GRAY;
        ctx.font = '10px Arial';
        ctx.fillText(`${levelConfig.timeAvailable.toFixed(1)}s`, canvasSize.width / 2, 32);
      }

      // Draw lives (using emoji for cross-platform consistency)
      ctx.font = '18px Arial';
      ctx.textAlign = 'right';
      for (let i = 0; i < score.lives; i++) {
        ctx.fillText('❤️', canvasSize.width - 15 - (score.lives - 1 - i) * 28, 32);
      }

      // Draw progress bar
      const progressWidth = 100;
      const progressX = canvasSize.width / 2 - progressWidth / 2;
      ctx.fillStyle = '#333';
      ctx.fillRect(progressX, 42, progressWidth, 4);
      ctx.fillStyle = COLORS.PRIMARY_BLUE;
      const progress = (score.correctInLevel / GAME_CONFIG.CORRECT_ANSWERS_PER_LEVEL) * progressWidth;
      ctx.fillRect(progressX, 42, progress, 4);

      // Helper to get font size based on string length (memoized per block)
      const getFontSize = (len: number): number => {
        if (len > 6) return 14;
        if (len > 4) return 18;
        if (len > 2) return 20;
        return 24;
      };

      // Draw answer blocks with variety
      answerBlocks.forEach((block) => {
        // Use block id hash for consistent randomization per block
        const blockHash = block.id.charCodeAt(block.id.length - 1);
        const blockHash2 = block.id.charCodeAt(0);

        // Block body with subtle color variation
        const hueShift = (blockHash % 3) * 10; // Slight purple/blue variation
        ctx.fillStyle = `hsl(${250 + hueShift}, 30%, 18%)`;
        ctx.strokeStyle = COLORS.ANSWER_BORDER;
        ctx.lineWidth = 2;

        const bx = block.x - answerBlockWidth / 2;
        const by = block.y - GAME_CONFIG.ANSWER_BLOCK_HEIGHT / 2;

        ctx.beginPath();
        ctx.roundRect(bx, by, answerBlockWidth, GAME_CONFIG.ANSWER_BLOCK_HEIGHT, 8);
        ctx.fill();
        ctx.stroke();

        // Eyes (alien style) - scale positions based on block width
        const eyeOffset = answerBlockWidth * 0.2;
        const eyeY = by - 4;

        // Simple blinking based on time and block id hash
        const blinkCycle = (Date.now() + blockHash * 100) % 3000;
        const isBlinking = blinkCycle < 150;

        // Eye expression variety based on block hash
        const eyeExpression = blockHash % 3; // 0: normal, 1: wide, 2: squint
        const eyeSize = eyeExpression === 1 ? 10 : eyeExpression === 2 ? 6 : 8;

        ctx.fillStyle = COLORS.PRIMARY_GREEN;
        ctx.shadowColor = COLORS.PRIMARY_GREEN;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        if (isBlinking) {
          // Closed eyes (thin lines)
          ctx.moveTo(block.x - eyeOffset - 6, eyeY);
          ctx.lineTo(block.x - eyeOffset + 6, eyeY);
          ctx.moveTo(block.x + eyeOffset - 6, eyeY);
          ctx.lineTo(block.x + eyeOffset + 6, eyeY);
          ctx.lineWidth = 3;
          ctx.strokeStyle = COLORS.PRIMARY_GREEN;
          ctx.stroke();
        } else {
          // Open eyes with variety
          ctx.arc(block.x - eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
          ctx.arc(block.x + eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
          ctx.fill();

          // Pupils with direction variety
          const pupilOffset = (blockHash2 % 3) - 1; // -1, 0, or 1
          ctx.fillStyle = '#000';
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(block.x - eyeOffset + pupilOffset * 2, eyeY, 3, 0, Math.PI * 2);
          ctx.arc(block.x + eyeOffset + pupilOffset * 2, eyeY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Antennae with varied angles
        const antennaAngleL = -0.2 + (blockHash % 5) * 0.1; // Slight angle variation
        const antennaAngleR = 0.2 - (blockHash2 % 5) * 0.1;
        const antennaLength = 12;

        ctx.strokeStyle = COLORS.PRIMARY_PURPLE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(block.x - eyeOffset, by - 12);
        ctx.lineTo(block.x - eyeOffset + Math.sin(antennaAngleL) * antennaLength, by - 12 - antennaLength);
        ctx.moveTo(block.x + eyeOffset, by - 12);
        ctx.lineTo(block.x + eyeOffset + Math.sin(antennaAngleR) * antennaLength, by - 12 - antennaLength);
        ctx.stroke();

        // Glowing antenna bulbs with slight size variation
        const bulbSize = 3 + (blockHash % 3);
        ctx.fillStyle = COLORS.PRIMARY_PURPLE;
        ctx.shadowColor = COLORS.PRIMARY_PURPLE;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(block.x - eyeOffset + Math.sin(antennaAngleL) * antennaLength, by - 12 - antennaLength - 2, bulbSize, 0, Math.PI * 2);
        ctx.arc(block.x + eyeOffset + Math.sin(antennaAngleR) * antennaLength, by - 12 - antennaLength - 2, bulbSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Answer value - memoized font size calculation
        const valueStr = String(block.value);
        const fontSize = getFontSize(valueStr.length);

        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(valueStr, block.x, block.y);
      });

      // Draw particles
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw projectile with trailing effect
      if (projectile?.active) {
        const projX = projectile.x - GAME_CONFIG.PROJECTILE_WIDTH / 2;
        const projY = projectile.y - GAME_CONFIG.PROJECTILE_HEIGHT / 2;

        // Draw trailing glow effect (fading segments behind the projectile)
        const trailLength = 40;
        const trailSegments = 5;
        for (let i = 0; i < trailSegments; i++) {
          const segmentY = projY + GAME_CONFIG.PROJECTILE_HEIGHT + (i * trailLength / trailSegments);
          const alpha = 0.6 - (i * 0.12);
          const width = GAME_CONFIG.PROJECTILE_WIDTH - (i * 0.5);

          ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
          ctx.fillRect(
            projectile.x - width / 2,
            segmentY,
            width,
            trailLength / trailSegments
          );
        }

        // Draw main projectile with gradient
        const gradient = ctx.createLinearGradient(projX, projY, projX, projY + GAME_CONFIG.PROJECTILE_HEIGHT);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, COLORS.PRIMARY_GREEN);
        gradient.addColorStop(1, COLORS.PRIMARY_GREEN);

        ctx.fillStyle = gradient;
        ctx.shadowColor = COLORS.PRIMARY_GREEN;
        ctx.shadowBlur = 15;
        ctx.fillRect(
          projX,
          projY,
          GAME_CONFIG.PROJECTILE_WIDTH,
          GAME_CONFIG.PROJECTILE_HEIGHT
        );
        ctx.shadowBlur = 0;
      }

      // Draw starship
      const shipY = canvasSize.height - 100;

      // Cockpit
      ctx.fillStyle = COLORS.PRIMARY_BLUE;
      ctx.shadowColor = COLORS.PRIMARY_BLUE;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(starshipX, shipY - 25);
      ctx.lineTo(starshipX - 12, shipY);
      ctx.lineTo(starshipX + 12, shipY);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Wings
      ctx.fillStyle = COLORS.PRIMARY_PURPLE;
      ctx.beginPath();
      ctx.moveTo(starshipX - 30, shipY + 15);
      ctx.lineTo(starshipX - 8, shipY - 5);
      ctx.lineTo(starshipX - 8, shipY + 15);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(starshipX + 30, shipY + 15);
      ctx.lineTo(starshipX + 8, shipY - 5);
      ctx.lineTo(starshipX + 8, shipY + 15);
      ctx.closePath();
      ctx.fill();

      // Engine flames
      ctx.fillStyle = COLORS.WARNING_ORANGE;
      ctx.shadowColor = COLORS.WARNING_ORANGE;
      ctx.shadowBlur = 10;
      ctx.fillRect(starshipX - 18, shipY + 15, 6, 10);
      ctx.fillRect(starshipX + 12, shipY + 15, 6, 10);
      ctx.shadowBlur = 0;

      // Draw math problem area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, canvasSize.height - 60, canvasSize.width, 60);

      // Draw timer bar above problem area
      const baseTimerBarHeight = 6;
      const timerBarY = canvasSize.height - 60 - baseTimerBarHeight;

      // Timer background
      ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
      ctx.fillRect(0, timerBarY, canvasSize.width, baseTimerBarHeight);

      // Timer fill - smooth color transition based on time remaining
      // Interpolate between green -> orange -> red
      const interpolateColor = (color1: string, color2: string, t: number): string => {
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return `rgb(${r}, ${g}, ${b})`;
      };

      let timerColor: string;
      let timerBarHeight = baseTimerBarHeight;
      let pulseGlow = 8;

      if (timeRemaining > 0.6) {
        // Fully green
        timerColor = COLORS.PRIMARY_GREEN;
      } else if (timeRemaining > 0.3) {
        // Transition from green to orange (0.6 -> 0.3)
        const t = (0.6 - timeRemaining) / 0.3;
        timerColor = interpolateColor(COLORS.PRIMARY_GREEN, COLORS.WARNING_ORANGE, t);
      } else {
        // Transition from orange to red (0.3 -> 0)
        const t = (0.3 - timeRemaining) / 0.3;
        timerColor = interpolateColor(COLORS.WARNING_ORANGE, COLORS.WARNING_RED, t);
        // Add pulsing effect for colorblind accessibility
        const pulseRate = (Date.now() % 400) / 400; // 0.4 second pulse cycle
        const pulseIntensity = Math.sin(pulseRate * Math.PI * 2);
        timerBarHeight = baseTimerBarHeight + pulseIntensity * 3; // Pulse between 3-9px
        pulseGlow = 8 + pulseIntensity * 12; // Pulse glow between 8-20
      }

      // Adjust Y position if bar height changed due to pulse
      const adjustedTimerBarY = timerBarY - (timerBarHeight - baseTimerBarHeight) / 2;

      ctx.fillStyle = timerColor;
      ctx.shadowColor = timerColor;
      ctx.shadowBlur = pulseGlow;
      ctx.fillRect(0, adjustedTimerBarY, canvasSize.width * timeRemaining, timerBarHeight);
      ctx.shadowBlur = 0;

      // Decorative line
      ctx.fillStyle = COLORS.PRIMARY_PURPLE;
      ctx.fillRect(0, canvasSize.height - 60, canvasSize.width, 2);

      if (currentProblem) {
        ctx.fillStyle = COLORS.TEXT_WHITE;
        // Adjust font size for longer problems
        const problemLen = currentProblem.displayString.length;
        let problemFontSize = 28;
        if (problemLen > 30) problemFontSize = 18;
        else if (problemLen > 20) problemFontSize = 22;

        ctx.font = `bold ${problemFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = COLORS.PRIMARY_BLUE;
        ctx.shadowBlur = 10;
        ctx.fillText(currentProblem.displayString, canvasSize.width / 2, canvasSize.height - 30);
        ctx.shadowBlur = 0;
      }

      // Hit effect overlay
      if (lastHitResult) {
        ctx.fillStyle = lastHitResult === 'correct'
          ? 'rgba(0, 255, 136, 0.2)'
          : 'rgba(255, 71, 87, 0.2)';
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      }
    }

    // Pause overlay
    if (gameState === 'PAUSED') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      ctx.fillStyle = COLORS.PRIMARY_BLUE;
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvasSize.width / 2, canvasSize.height / 2 - 40);

      ctx.fillStyle = COLORS.TEXT_WHITE;
      ctx.font = '18px Arial';
      ctx.fillText('Press P or ESC to resume', canvasSize.width / 2, canvasSize.height / 2 + 10);
      ctx.fillText('Press R to restart', canvasSize.width / 2, canvasSize.height / 2 + 40);
    }

    // Level up overlay
    if (gameState === 'LEVEL_UP') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      ctx.fillStyle = COLORS.PRIMARY_GREEN;
      ctx.shadowColor = COLORS.PRIMARY_GREEN;
      ctx.shadowBlur = 20;
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL UP!', canvasSize.width / 2, canvasSize.height / 2 - 60);

      ctx.fillStyle = COLORS.PRIMARY_BLUE;
      ctx.font = 'bold 64px Arial';
      ctx.fillText(score.level.toString(), canvasSize.width / 2, canvasSize.height / 2 + 20);

      ctx.shadowBlur = 0;

      // Show tier description if entering new tier
      if (isNewTier(score.level)) {
        ctx.fillStyle = COLORS.WARNING_ORANGE;
        ctx.font = 'bold 16px Arial';
        ctx.fillText('NEW TIER!', canvasSize.width / 2, canvasSize.height / 2 + 60);

        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = '14px Arial';
        const desc = getTierDescription(score.level);
        ctx.fillText(desc, canvasSize.width / 2, canvasSize.height / 2 + 85);
      } else {
        ctx.fillStyle = COLORS.WARNING_ORANGE;
        ctx.font = '18px Arial';
        ctx.fillText('Speed increasing...', canvasSize.width / 2, canvasSize.height / 2 + 70);
      }

      // Skip hint
      ctx.fillStyle = COLORS.TEXT_GRAY;
      ctx.font = '14px Arial';
      ctx.fillText('Tap or press SPACE to continue', canvasSize.width / 2, canvasSize.height / 2 + 120);
    }

    // Countdown overlay
    if (gameState === 'COUNTDOWN') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      ctx.fillStyle = COLORS.PRIMARY_BLUE;
      ctx.shadowColor = COLORS.PRIMARY_BLUE;
      ctx.shadowBlur = 30;
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const displayText = countdownNumber > 0 ? countdownNumber.toString() : 'GO!';
      const displayColor = countdownNumber > 0 ? COLORS.PRIMARY_BLUE : COLORS.PRIMARY_GREEN;

      ctx.fillStyle = displayColor;
      ctx.shadowColor = displayColor;
      ctx.fillText(displayText, canvasSize.width / 2, canvasSize.height / 2);
      ctx.shadowBlur = 0;

      // Subtitle
      ctx.fillStyle = COLORS.TEXT_WHITE;
      ctx.font = '18px Arial';
      ctx.fillText('Get Ready!', canvasSize.width / 2, canvasSize.height / 2 + 80);
    }
  }, [canvasSize, gameState, score, currentProblem, answerBlocks, projectile, starshipX, lastHitResult, levelConfig, timeRemaining, countdownNumber, answerBlockWidth, particles]);

  // Handle canvas click (desktop only)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Skip level up on click
    if (gameState === 'LEVEL_UP') {
      skipLevelUp();
      return;
    }

    if (gameState !== 'PLAYING' || isTouchDevice) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      setStarshipX(Math.max(30, Math.min(canvasSize.width - 30, x)));
    }
    fireProjectile();
  };

  // Touch control handlers
  const handleMoveLeftStart = () => {
    touchControlsActive.current.left = true;
  };

  const handleMoveLeftEnd = () => {
    touchControlsActive.current.left = false;
  };

  const handleMoveRightStart = () => {
    touchControlsActive.current.right = true;
  };

  const handleMoveRightEnd = () => {
    touchControlsActive.current.right = false;
  };

  const handleFireTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    fireProjectile();
  };

  return (
    <>
      {/* Landscape Warning Overlay */}
      <div className="landscape-warning">
        <div className="warning-icon">📱</div>
        <h2>Please Rotate Your Device</h2>
        <p>Math Space Invaders works best in portrait mode</p>
      </div>

      {/* Fixed Top User Bar - OUTSIDE app-container to avoid iOS Safari stacking issues */}
      <div className="user-top-bar">
        <span className="user-info">
          <span className="user-avatar">👨‍🚀</span>
          <span className="user-name">{authUser.nickname}</span>
        </span>
        <div className="user-stats">
          <span className="user-score">🏆 {currentPlayer?.highScore || 0}</span>
          <button className="leaderboard-bar-btn" onClick={() => {
            setShowLeaderboard(true);
            trackLeaderboardOpen('user_bar');
          }} title="Leaderboard">
            🏆 Leaderboard
          </button>
        </div>
        <div className="user-actions">
          <MyTeamsDropdown />
          <button className="logout-btn" onClick={onLogout} title="Logout">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Leaderboard Modal - OUTSIDE app-container */}
      {showLeaderboard && (
        <Leaderboard
          currentPlayer={currentPlayer}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Settings Modal - OUTSIDE app-container */}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}

      <div className="app-container">

      {gameState === 'MENU' && (
        <div className="menu-screen">
          <div className="stars-bg"></div>

          <h1 className="title">
            <span className="title-math">MATH</span>
            <span className="title-space">SPACE</span>
            <span className="title-invaders">INVADERS</span>
          </h1>
          <p className="subtitle">Learn Math. Save the Galaxy!</p>
          <div className="rocket-icon">🚀</div>
          <button className="start-button" onClick={startGame}>
            ▶ START GAME
          </button>
          <div className="menu-buttons-container">
            <button className="create-team-btn" onClick={onOpenCreateTeam}>
              👥 CREATE TEAM
            </button>
            <button className="leaderboard-btn" onClick={() => {
              setShowLeaderboard(true);
              trackLeaderboardOpen('menu');
            }}>
              🏆 LEADERBOARD
            </button>
            <button className="settings-btn" onClick={() => setShowSettings(true)}>
              ⚙️ SETTINGS
            </button>
          </div>
          <div className="instructions">
            <h3>HOW TO PLAY</h3>
            <p>← → or A D - Move spaceship</p>
            <p>SPACE or TAP - Fire laser</p>
            <p>Hit the correct answer!</p>
          </div>
        </div>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="game-over-screen">
          <div className="stars-bg"></div>
          <h1 className="game-over-title">GAME OVER</h1>
          <div className="final-score-card">
            <p className="score-label">FINAL SCORE</p>
            <p className="score-value">{score.score}</p>
            {currentPlayer && score.score > 0 && score.score >= currentPlayer.highScore && (
              <p className="new-high-score">🎉 NEW HIGH SCORE!</p>
            )}
            <div className="stats-row">
              <div className="stat">
                <span className="stat-icon">🏆</span>
                <span className="stat-label">Level</span>
                <span className="stat-value">{score.level}</span>
              </div>
              <div className="stat">
                <span className="stat-icon">✓</span>
                <span className="stat-label">Correct</span>
                <span className="stat-value">{score.score}</span>
              </div>
            </div>
          </div>
          <p className="message">
            {score.score >= 50 ? "Amazing! You're a Math Master!" :
             score.score >= 30 ? "Great job! Keep practicing!" :
             score.score >= 15 ? "Good effort! Try again!" :
             "Don't give up! Practice makes perfect!"}
          </p>
          <button className="play-again-button" onClick={startGame}>
            🔄 PLAY AGAIN
          </button>
          {onBackToTeam ? (
            <button className="menu-button" onClick={onBackToTeam}>
              ← BACK TO {teamName?.toUpperCase() || 'TEAM'}
            </button>
          ) : (
            <>
              <button className="leaderboard-btn secondary" onClick={() => {
                setShowLeaderboard(true);
                trackLeaderboardOpen('game_over');
              }}>
                🏆 VIEW LEADERBOARD
              </button>
              <button className="menu-button" onClick={() => setGameState('MENU')}>
                🏠 MAIN MENU
              </button>
            </>
          )}
        </div>
      )}

      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'LEVEL_UP' || gameState === 'COUNTDOWN') && (
        <div className="game-container">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={handleCanvasClick}
            className={gameState === 'PAUSED' ? 'paused-blur' : ''}
          />
          {gameState === 'PAUSED' && <div className="pause-blur-overlay"></div>}
          {gameState === 'PLAYING' && (
            <button
              className="pause-btn"
              onClick={() => {
                setGameState('PAUSED');
                trackGamePause(score.level, score.score);
              }}
              aria-label="Pause game"
            >
              ⏸
            </button>
          )}
          {gameState === 'PAUSED' && !showQuitConfirm && (
            <div className="pause-buttons">
              <button onClick={() => {
                setGameState('PLAYING');
                trackGameResume(score.level, score.score);
              }}>▶ Resume</button>
              <button onClick={startGame}>🔄 Restart</button>
              <button onClick={() => setShowQuitConfirm(true)}>🏠 Menu</button>
            </div>
          )}
          {gameState === 'PAUSED' && showQuitConfirm && (
            <div className="quit-confirm-dialog">
              <h3>Abandon Game?</h3>
              <p>Your progress will be lost.</p>
              <div className="quit-confirm-buttons">
                <button
                  className="quit-confirm-btn cancel"
                  onClick={() => setShowQuitConfirm(false)}
                >
                  ← Back
                </button>
                <button
                  className="quit-confirm-btn confirm"
                  onClick={() => {
                    setShowQuitConfirm(false);
                    setGameState('MENU');
                    trackScreenView('menu');
                  }}
                >
                  🚪 Quit Game
                </button>
              </div>
            </div>
          )}

          {/* Touch controls for mobile devices */}
          {isTouchDevice && gameState === 'PLAYING' && (
            <>
              {/* Fire button - left side */}
              <button
                className="touch-control fire-btn"
                onTouchStart={handleFireTouch}
                onTouchEnd={(e) => e.preventDefault()}
                aria-label="Fire laser"
              >
                🔥
              </button>

              {/* Movement buttons - right side */}
              <div className="touch-control move-controls">
                <button
                  className="move-btn left-btn"
                  onTouchStart={handleMoveLeftStart}
                  onTouchEnd={handleMoveLeftEnd}
                  onTouchCancel={handleMoveLeftEnd}
                  aria-label="Move spaceship left"
                >
                  ◀
                </button>
                <button
                  className="move-btn right-btn"
                  onTouchStart={handleMoveRightStart}
                  onTouchEnd={handleMoveRightEnd}
                  onTouchCancel={handleMoveRightEnd}
                  aria-label="Move spaceship right"
                >
                  ▶
                </button>
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </>
  );
}
