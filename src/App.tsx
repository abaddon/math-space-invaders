import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, GameScore, MathProblem, AnswerBlock, Projectile, PlayerProfile, AuthUser } from './types';
import { GAME_CONFIG, COLORS } from './constants';
import { generateMathProblem, generateAnswerBlocks } from './mathGenerator';
import { AuthScreen } from './components/AuthScreen';
import { Leaderboard } from './components/Leaderboard';
import { getSession, validateSession, signOut } from './authService';
import { getPlayerProfile, updatePlayerStats } from './leaderboardService';
import './App.css';

type AppScreen = 'AUTH' | 'MENU' | 'GAME';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [appScreen, setAppScreen] = useState<AppScreen>('AUTH');
  const [gameState, setGameState] = useState<GameState>('MENU');
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

  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const gameLoopRef = useRef<number | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const isProcessingWrongAnswer = useRef(false);
  const touchControlsActive = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      setIsLoadingAuth(true);
      const session = getSession();

      if (session) {
        // Validate session against Firestore
        const isValid = await validateSession(session);
        if (isValid) {
          setAuthUser(session);
          const profile = await getPlayerProfile(session.playerId);
          if (profile) {
            setCurrentPlayer(profile);
          }
          setAppScreen('MENU');
        } else {
          // Invalid session, clear it
          signOut();
        }
      }

      setIsLoadingAuth(false);
    };

    checkSession();
  }, []);

  // Handle successful authentication
  const handleAuthSuccess = async (user: AuthUser) => {
    setAuthUser(user);
    const profile = await getPlayerProfile(user.playerId);
    if (profile) {
      setCurrentPlayer(profile);
    }
    setAppScreen('MENU');
  };

  // Handle logout
  const handleLogout = () => {
    signOut();
    setAuthUser(null);
    setCurrentPlayer(null);
    setGameState('MENU');
    setAppScreen('AUTH');
  };

  // Save stats when game ends
  const saveGameStats = useCallback(async (finalScore: GameScore) => {
    if (!authUser) return;
    try {
      await updatePlayerStats(
        authUser.playerId,
        finalScore.score,
        finalScore.level,
        finalScore.score // correctAnswers = score in this game
      );
      // Refresh player profile
      const updatedProfile = await getPlayerProfile(authUser.playerId);
      if (updatedProfile) {
        setCurrentPlayer(updatedProfile);
      }
    } catch (error) {
      console.error('Failed to save game stats:', error);
    }
  }, [authUser]);

  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    };
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);

  // Initialize canvas size
  useEffect(() => {
    const updateSize = () => {
      const width = Math.min(500, window.innerWidth - 40);
      const height = Math.min(700, window.innerHeight - 40);
      setCanvasSize({ width, height });
      setStarshipX(width / 2);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate speed based on level
  const getCurrentSpeed = useCallback((level: number): number => {
    const multiplier = Math.min(
      1 + (level - 1) * GAME_CONFIG.SPEED_INCREMENT,
      GAME_CONFIG.MAX_SPEED_MULTIPLIER
    );
    return GAME_CONFIG.BASE_ANSWER_SPEED * multiplier;
  }, []);

  // Generate new round
  const generateNewRound = useCallback(() => {
    const problem = generateMathProblem(score.level);
    setCurrentProblem(problem);
    const blocks = generateAnswerBlocks(
      problem.correctAnswer,
      canvasSize.width,
      GAME_CONFIG.ANSWER_BLOCK_WIDTH,
      80
    );
    setAnswerBlocks(blocks);
    setProjectile(null);
    setLastHitResult(null);
  }, [score.level, canvasSize.width]);

  // Handle correct answer
  const handleCorrectAnswer = useCallback(() => {
    setLastHitResult('correct');
    setTimeout(() => setLastHitResult(null), 300);

    setScore((prev) => {
      const newCorrectInLevel = prev.correctInLevel + 1;
      const newScore = prev.score + 1;

      if (newCorrectInLevel >= GAME_CONFIG.CORRECT_ANSWERS_PER_LEVEL) {
        setGameState('LEVEL_UP');
        setTimeout(() => {
          setGameState('PLAYING');
        }, GAME_CONFIG.LEVEL_UP_DELAY);

        return {
          score: newScore,
          level: prev.level + 1,
          lives: prev.lives,
          correctInLevel: 0,
        };
      }

      return { ...prev, score: newScore, correctInLevel: newCorrectInLevel };
    });
  }, []);

  // Handle wrong answer
  const handleWrongAnswer = useCallback(() => {
    // Prevent double-calling during the same frame
    if (isProcessingWrongAnswer.current) return;
    isProcessingWrongAnswer.current = true;

    setLastHitResult('wrong');
    setTimeout(() => setLastHitResult(null), 300);

    setScore((prev) => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        setGameState('GAME_OVER');
        // Save stats when game over
        const finalScore = { ...prev, lives: 0 };
        saveGameStats(finalScore);
        return finalScore;
      }
      return { ...prev, lives: newLives };
    });

    // Reset the flag after a short delay to allow next wrong answer
    setTimeout(() => {
      isProcessingWrongAnswer.current = false;
    }, 100);
  }, [saveGameStats]);

  // Start game
  const startGame = useCallback(() => {
    setScore({
      score: 0,
      level: 1,
      lives: GAME_CONFIG.INITIAL_LIVES,
      correctInLevel: 0,
    });
    setGameState('PLAYING');
    setStarshipX(canvasSize.width / 2);
  }, [canvasSize.width]);

  // Fire projectile
  const fireProjectile = useCallback(() => {
    if (projectile?.active || gameState !== 'PLAYING') return;
    setProjectile({
      x: starshipX,
      y: canvasSize.height - 120,
      active: true,
    });
  }, [projectile, starshipX, canvasSize.height, gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        fireProjectile();
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === 'PLAYING') setGameState('PAUSED');
        else if (gameState === 'PAUSED') setGameState('PLAYING');
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
  }, [fireProjectile, gameState]);

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

      // Update answer blocks
      const speed = getCurrentSpeed(score.level);
      const bottomLimit = canvasSize.height - 100;

      setAnswerBlocks((blocks) => {
        if (blocks.length === 0) return blocks;

        const updated = blocks.map((b) => ({ ...b, y: b.y + speed }));
        const reachedBottom = updated.some((b) => b.y >= bottomLimit);

        if (reachedBottom) {
          handleWrongAnswer();
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

            if (dx < GAME_CONFIG.ANSWER_BLOCK_WIDTH / 2 + 5 &&
                dy < GAME_CONFIG.ANSWER_BLOCK_HEIGHT / 2 + 5) {
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

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, score.level, canvasSize, getCurrentSpeed, handleCorrectAnswer, handleWrongAnswer]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
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

    if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'LEVEL_UP') {
      // Draw HUD background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvasSize.width, 50);

      // Draw score
      ctx.fillStyle = COLORS.PRIMARY_GREEN;
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Score: ${score.score}`, 15, 30);

      // Draw level
      ctx.fillStyle = COLORS.PRIMARY_BLUE;
      ctx.fillText(`Level: ${score.level}`, canvasSize.width / 2 - 30, 30);

      // Draw lives
      ctx.fillStyle = COLORS.WARNING_RED;
      for (let i = 0; i < score.lives; i++) {
        ctx.fillText('♥', canvasSize.width - 80 + i * 25, 30);
      }

      // Draw progress bar
      const progressWidth = 100;
      const progressX = canvasSize.width / 2 - progressWidth / 2;
      ctx.fillStyle = '#333';
      ctx.fillRect(progressX, 38, progressWidth, 6);
      ctx.fillStyle = COLORS.PRIMARY_BLUE;
      const progress = (score.correctInLevel / GAME_CONFIG.CORRECT_ANSWERS_PER_LEVEL) * progressWidth;
      ctx.fillRect(progressX, 38, progress, 6);

      // Draw answer blocks
      answerBlocks.forEach((block) => {
        // Block body
        ctx.fillStyle = COLORS.ANSWER_BG;
        ctx.strokeStyle = COLORS.ANSWER_BORDER;
        ctx.lineWidth = 2;

        const bx = block.x - GAME_CONFIG.ANSWER_BLOCK_WIDTH / 2;
        const by = block.y - GAME_CONFIG.ANSWER_BLOCK_HEIGHT / 2;

        ctx.beginPath();
        ctx.roundRect(bx, by, GAME_CONFIG.ANSWER_BLOCK_WIDTH, GAME_CONFIG.ANSWER_BLOCK_HEIGHT, 8);
        ctx.fill();
        ctx.stroke();

        // Eyes (alien style)
        ctx.fillStyle = COLORS.PRIMARY_GREEN;
        ctx.beginPath();
        ctx.arc(block.x - 15, by - 3, 6, 0, Math.PI * 2);
        ctx.arc(block.x + 15, by - 3, 6, 0, Math.PI * 2);
        ctx.fill();

        // Antennae
        ctx.strokeStyle = COLORS.PRIMARY_PURPLE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(block.x - 15, by - 9);
        ctx.lineTo(block.x - 15, by - 18);
        ctx.moveTo(block.x + 15, by - 9);
        ctx.lineTo(block.x + 15, by - 18);
        ctx.stroke();

        // Number
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(block.value.toString(), block.x, block.y);
      });

      // Draw projectile
      if (projectile?.active) {
        ctx.fillStyle = COLORS.PRIMARY_GREEN;
        ctx.shadowColor = COLORS.PRIMARY_GREEN;
        ctx.shadowBlur = 10;
        ctx.fillRect(
          projectile.x - GAME_CONFIG.PROJECTILE_WIDTH / 2,
          projectile.y - GAME_CONFIG.PROJECTILE_HEIGHT / 2,
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

      // Draw math problem
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, canvasSize.height - 60, canvasSize.width, 60);

      ctx.fillStyle = COLORS.PRIMARY_PURPLE;
      ctx.fillRect(0, canvasSize.height - 60, canvasSize.width, 3);

      if (currentProblem) {
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = COLORS.PRIMARY_BLUE;
        ctx.shadowBlur = 10;
        ctx.fillText(currentProblem.displayString, canvasSize.width / 2, canvasSize.height - 25);
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
      ctx.fillText('LEVEL UP!', canvasSize.width / 2, canvasSize.height / 2 - 50);

      ctx.fillStyle = COLORS.PRIMARY_BLUE;
      ctx.font = 'bold 64px Arial';
      ctx.fillText(score.level.toString(), canvasSize.width / 2, canvasSize.height / 2 + 30);

      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.WARNING_ORANGE;
      ctx.font = '18px Arial';
      ctx.fillText('Speed increasing...', canvasSize.width / 2, canvasSize.height / 2 + 80);
    }
  }, [canvasSize, gameState, score, currentProblem, answerBlocks, projectile, starshipX, lastHitResult]);

  // Handle canvas click (desktop only)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

  // Show loading screen while checking auth
  if (isLoadingAuth) {
    return (
      <div className="app-container">
        <div className="stars-bg"></div>
        <div className="loading-screen">
          <span className="loading-spinner">🚀</span>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Render Auth Screen
  if (appScreen === 'AUTH') {
    return (
      <div className="app-container">
        <div className="stars-bg"></div>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard
          currentPlayer={currentPlayer}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {gameState === 'MENU' && (
        <div className="menu-screen">
          <div className="stars-bg"></div>

          {/* Player info bar with logout */}
          {authUser && (
            <div className="player-bar">
              <span className="player-name">👨‍🚀 {authUser.nickname}</span>
              <span className="player-high-score">🏆 {currentPlayer?.highScore || 0}</span>
              <button className="logout-btn" onClick={handleLogout} title="Logout">
                🚪
              </button>
            </div>
          )}

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
          <button className="leaderboard-btn" onClick={() => setShowLeaderboard(true)}>
            🏆 LEADERBOARD
          </button>
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
          <button className="leaderboard-btn secondary" onClick={() => setShowLeaderboard(true)}>
            🏆 LEADERBOARD
          </button>
          <button className="menu-button" onClick={() => setGameState('MENU')}>
            🏠 MAIN MENU
          </button>
        </div>
      )}

      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'LEVEL_UP') && (
        <div className="game-container">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={handleCanvasClick}
          />
          {gameState === 'PLAYING' && (
            <button className="pause-btn" onClick={() => setGameState('PAUSED')}>⏸</button>
          )}
          {gameState === 'PAUSED' && (
            <div className="pause-buttons">
              <button onClick={() => setGameState('PLAYING')}>▶ Resume</button>
              <button onClick={startGame}>🔄 Restart</button>
              <button onClick={() => setGameState('MENU')}>🏠 Menu</button>
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
                >
                  ◀
                </button>
                <button
                  className="move-btn right-btn"
                  onTouchStart={handleMoveRightStart}
                  onTouchEnd={handleMoveRightEnd}
                  onTouchCancel={handleMoveRightEnd}
                >
                  ▶
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
