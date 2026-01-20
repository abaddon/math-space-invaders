// Leaderboard Component - supports both global and team leaderboards
import { useState, useEffect, useCallback } from 'react';
import type { LeaderboardEntry, PlayerProfile, TeamLeaderboardEntry } from '../types';
import { getLeaderboard, getTeamLeaderboard } from '../leaderboardService';
import { trackLeaderboardClose, trackLeaderboardRetry } from '../analytics';
import type { DocumentSnapshot } from 'firebase/firestore';

interface LeaderboardProps {
  currentPlayer: PlayerProfile | null;
  onClose: () => void;
  teamId?: string;  // If provided, show team leaderboard instead of global
  teamName?: string; // Team name for display
}

const PAGE_SIZE = 10;

export function Leaderboard({ currentPlayer, onClose, teamId, teamName }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | TeamLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLimit, setCurrentLimit] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<DocumentSnapshot | null>(null);

  const isTeamMode = !!teamId;

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      if (isTeamMode && teamId) {
        const result = await getTeamLeaderboard(teamId, 25, cursor || undefined);
        setEntries(prev => [...prev, ...result.entries]);
        setCursor(result.lastDoc);
        setHasMore(result.hasMore);
      } else {
        const newLimit = currentLimit + PAGE_SIZE;
        const data = await getLeaderboard(newLimit);
        setEntries(data);
        setCurrentLimit(newLimit);
        setHasMore(data.length >= newLimit);
      }
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isTeamMode, teamId, cursor, hasMore, isLoadingMore, currentLimit]);

  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (isTeamMode && teamId) {
          const result = await getTeamLeaderboard(teamId, 25, undefined);
          setEntries(result.entries);
          setCursor(result.lastDoc);
          setHasMore(result.hasMore);
        } else {
          const data = await getLeaderboard(PAGE_SIZE);
          setEntries(data);
          setHasMore(data.length >= PAGE_SIZE);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        setError('Failed to load leaderboard. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitial();
  }, [isTeamMode, teamId]);

  const handleClose = () => {
    trackLeaderboardClose();
    onClose();
  };

  const handleRetry = () => {
    trackLeaderboardRetry();
    // Retry by re-running the effect
    setIsLoading(true);
    setError(null);
    setEntries([]);
    setCursor(null);
    setHasMore(true);
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
        <button className="close-btn" onClick={handleClose} aria-label="Close leaderboard">✕</button>

        <h2 className="leaderboard-title">
          🏆 {isTeamMode ? `${teamName || 'Team'} Leaderboard` : 'Global Leaderboard'}
        </h2>

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
            <div className="empty-icon">🏆</div>
            <h3>The Galaxy Awaits Its Hero!</h3>
            <p>No scores have been recorded yet.</p>
            <p className="empty-cta">Be the first to claim the #1 spot!</p>
            <div className="empty-hint">Play now and your score will appear here</div>
          </div>
        ) : (
          <div className="leaderboard-list">
            <table className="leaderboard-table" role="table">
              <thead>
                <tr className="leaderboard-header">
                  <th className="col-rank" scope="col">Rank</th>
                  <th className="col-player" scope="col">Player</th>
                  <th className="col-score" scope="col">Score</th>
                  <th className="col-level" scope="col">Level</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  // Handle both LeaderboardEntry (has playerId) and TeamLeaderboardEntry (has id)
                  const entryKey = (entry as LeaderboardEntry).playerId || (entry as TeamLeaderboardEntry).id;
                  const entryPlayerId = (entry as LeaderboardEntry).playerId || (entry as TeamLeaderboardEntry).playerId;
                  return (
                    <tr
                      key={entryKey}
                      className={`leaderboard-row ${currentPlayer?.id === entryPlayerId ? 'current-player' : ''} ${index < 3 ? 'top-three' : ''}`}
                    >
                      <td className="col-rank">{getMedalEmoji(index + 1)}</td>
                      <td className="col-player">
                        {entry.nickname}
                        {currentPlayer?.id === entryPlayerId && <span className="you-badge">YOU</span>}
                      </td>
                      <td className="col-score">{entry.score}</td>
                      <td className="col-level">{entry.level}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {hasMore && (
              <button
                className="load-more-btn"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? '⏳ Loading...' : '📋 Load More'}
              </button>
            )}
          </div>
        )}

        {currentPlayer && (
          <div className="your-stats">
            <h3>{isTeamMode ? 'Your Team Stats' : 'Your Stats'}</h3>
            <div className="stats-grid">
              {isTeamMode ? (
                <>
                  {/* Team-specific stats: find player's entry in team leaderboard */}
                  {(() => {
                    const myEntry = entries.find(e => {
                      const entryPlayerId = (e as LeaderboardEntry).playerId || (e as TeamLeaderboardEntry).playerId;
                      return currentPlayer.id === entryPlayerId;
                    });
                    const myRank = myEntry ? entries.findIndex(e => {
                      const entryPlayerId = (e as LeaderboardEntry).playerId || (e as TeamLeaderboardEntry).playerId;
                      return currentPlayer.id === entryPlayerId;
                    }) + 1 : null;

                    return (
                      <>
                        <div className="stat-item">
                          <span className="stat-icon">🏆</span>
                          <span className="stat-value">{myEntry?.score || 0}</span>
                          <span className="stat-label">Team High Score</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">⭐</span>
                          <span className="stat-value">{myEntry?.level || 0}</span>
                          <span className="stat-label">Best Level</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">📊</span>
                          <span className="stat-value">{myRank ? `#${myRank}` : 'N/A'}</span>
                          <span className="stat-label">Team Rank</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">👥</span>
                          <span className="stat-value">{entries.length}</span>
                          <span className="stat-label">Team Members</span>
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
