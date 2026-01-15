// Leaderboard Component
import { useState, useEffect } from 'react';
import type { LeaderboardEntry, PlayerProfile } from '../types';
import { getLeaderboard } from '../leaderboardService';
import { trackLeaderboardClose, trackLeaderboardRetry } from '../analytics';

interface LeaderboardProps {
  currentPlayer: PlayerProfile | null;
  onClose: () => void;
}

export function Leaderboard({ currentPlayer, onClose }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard(10);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    trackLeaderboardClose();
    onClose();
  };

  const handleRetry = () => {
    trackLeaderboardRetry();
    loadLeaderboard();
  };

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };


  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-modal">
        <button className="close-btn" onClick={handleClose}>✕</button>

        <h2 className="leaderboard-title">🏆 Global Leaderboard</h2>

        {isLoading ? (
          <div className="leaderboard-loading">
            <span className="loading-spinner">🚀</span>
            <p>Loading scores...</p>
          </div>
        ) : error ? (
          <div className="leaderboard-error">
            <p>{error}</p>
            <button onClick={handleRetry} className="retry-btn">
              🔄 Retry
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="leaderboard-empty">
            <p>No scores yet!</p>
            <p>Be the first to set a record! 🚀</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            <div className="leaderboard-header">
              <span className="col-rank">Rank</span>
              <span className="col-player">Player</span>
              <span className="col-score">Score</span>
              <span className="col-level">Level</span>
            </div>
            {entries.map((entry, index) => (
              <div
                key={entry.playerId}
                className={`leaderboard-row ${currentPlayer?.id === entry.playerId ? 'current-player' : ''} ${index < 3 ? 'top-three' : ''}`}
              >
                <span className="col-rank">{getMedalEmoji(index + 1)}</span>
                <span className="col-player">
                  {entry.nickname}
                  {currentPlayer?.id === entry.playerId && <span className="you-badge">YOU</span>}
                </span>
                <span className="col-score">{entry.score}</span>
                <span className="col-level">{entry.level}</span>
              </div>
            ))}
          </div>
        )}

        {currentPlayer && (
          <div className="your-stats">
            <h3>Your Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-icon">🏆</span>
                <span className="stat-value">{currentPlayer.highScore}</span>
                <span className="stat-label">High Score</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">⭐</span>
                <span className="stat-value">{currentPlayer.bestLevel}</span>
                <span className="stat-label">Best Level</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🎮</span>
                <span className="stat-value">{currentPlayer.gamesPlayed}</span>
                <span className="stat-label">Games</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">✓</span>
                <span className="stat-value">{currentPlayer.totalCorrectAnswers}</span>
                <span className="stat-label">Correct</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
