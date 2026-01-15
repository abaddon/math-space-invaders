// Player Selection Component
import { useState } from 'react';
import type { PlayerProfile } from '../types';

interface PlayerSelectProps {
  onPlayerReady: (nickname: string) => void;
  currentPlayer: PlayerProfile | null;
  isLoading: boolean;
}

export function PlayerSelect({ onPlayerReady, currentPlayer, isLoading }: PlayerSelectProps) {
  const [nickname, setNickname] = useState(currentPlayer?.nickname || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedNickname = nickname.trim();

    if (trimmedNickname.length < 2) {
      setError('Nickname must be at least 2 characters');
      return;
    }

    if (trimmedNickname.length > 15) {
      setError('Nickname must be 15 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedNickname)) {
      setError('Only letters, numbers, - and _ allowed');
      return;
    }

    setError('');
    onPlayerReady(trimmedNickname);
  };

  return (
    <div className="player-select">
      <h2 className="player-select-title">👨‍🚀 Enter Your Callsign</h2>

      {currentPlayer && (
        <div className="player-stats-mini">
          <p>Welcome back, <span className="highlight">{currentPlayer.nickname}</span>!</p>
          <div className="mini-stats">
            <span>🏆 High Score: {currentPlayer.highScore}</span>
            <span>⭐ Best Level: {currentPlayer.bestLevel}</span>
            <span>🎮 Games: {currentPlayer.gamesPlayed}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="nickname-form">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Your nickname..."
          className="nickname-input"
          maxLength={15}
          autoFocus
          disabled={isLoading}
        />
        {error && <p className="input-error">{error}</p>}
        <button type="submit" className="confirm-btn" disabled={isLoading}>
          {isLoading ? '⏳ Loading...' : currentPlayer ? '✓ Continue' : '🚀 Start Mission'}
        </button>
      </form>

      <p className="player-hint">
        Your scores will be saved to the global leaderboard!
      </p>
    </div>
  );
}
