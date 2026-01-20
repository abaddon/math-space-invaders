import { useParams, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTeam } from '../contexts/TeamContext';
import { joinTeam } from '../services/teamService';
import { Game } from '../components/Game';
import { TeamLeaderboard } from '../components/TeamLeaderboard';
import type { AuthUser, PlayerProfile } from '../types';

interface TeamPageProps {
  authUser: AuthUser | null;
  currentPlayer: PlayerProfile | null;
  onPlayerUpdate: (player: PlayerProfile) => void;
  onLogout: () => void;
  onOpenCreateTeam: () => void;
}

export function TeamPage({ authUser, currentPlayer, onPlayerUpdate, onLogout, onOpenCreateTeam }: TeamPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { currentTeam, isLoadingCurrentTeam, setCurrentTeamBySlug, refreshMyTeams, myTeams } = useTeam();

  // View state for members
  const [view, setView] = useState<'landing' | 'game' | 'leaderboard'>('landing');

  // Join flow state
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [manualPassword, setManualPassword] = useState('');
  const [hasAttemptedAutoJoin, setHasAttemptedAutoJoin] = useState(false);

  const passwordFromHash = location.hash.slice(1); // Remove # prefix

  useEffect(() => {
    if (slug) {
      setCurrentTeamBySlug(slug);
    }
  }, [slug, setCurrentTeamBySlug]);

  // Auto-join when hash fragment password present
  useEffect(() => {
    const attemptAutoJoin = async () => {
      if (!currentTeam || !authUser || !passwordFromHash || hasAttemptedAutoJoin || joinSuccess) {
        return;
      }

      setHasAttemptedAutoJoin(true);
      setIsJoining(true);
      setJoinError('');

      const result = await joinTeam({
        teamId: currentTeam.id,
        playerId: authUser.playerId,
        playerNickname: authUser.nickname,
        password: passwordFromHash,
      });

      setIsJoining(false);

      if (result.success) {
        setJoinSuccess(true);
        // Refresh myTeams in context
        await refreshMyTeams(authUser.playerId);
      } else {
        setJoinError(result.error || 'Failed to join team');
      }
    };

    attemptAutoJoin();
  }, [currentTeam, authUser, passwordFromHash, hasAttemptedAutoJoin, joinSuccess, refreshMyTeams]);

  // Handle manual join (form submission)
  const handleManualJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam || !authUser) return;

    setIsJoining(true);
    setJoinError('');

    const result = await joinTeam({
      teamId: currentTeam.id,
      playerId: authUser.playerId,
      playerNickname: authUser.nickname,
      password: currentTeam.isPublic ? undefined : manualPassword,
    });

    setIsJoining(false);

    if (result.success) {
      setJoinSuccess(true);
      await refreshMyTeams(authUser.playerId);
    } else {
      setJoinError(result.error || 'Failed to join team');
    }
  };

  if (isLoadingCurrentTeam) {
    return (
      <div className="app-container">
        <div className="stars-bg"></div>
        <div className="loading-screen">
          <span className="loading-spinner">🚀</span>
          <p>Loading team...</p>
        </div>
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="app-container">
        <div className="stars-bg"></div>
        <div className="menu-screen">
          <h1 className="title">Team Not Found</h1>
          <p className="subtitle">The team "{slug}" doesn't exist or has been deleted.</p>
          <Link to="/" className="start-button" style={{ textDecoration: 'none' }}>
            🏠 Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is a member
  const isMember = myTeams.some(m => m.teamId === currentTeam.id);

  // Show join success message
  if (joinSuccess) {
    return (
      <div className="app-container">
        <div className="stars-bg"></div>
        <div className="menu-screen">
          <h1 className="title">✓ Joined!</h1>
          <p className="subtitle">You successfully joined {currentTeam.name}</p>
          <p>Members: {currentTeam.memberCount}</p>
          <button
            onClick={() => setView('landing')}
            className="start-button"
          >
            🎮 Continue
          </button>
        </div>
      </div>
    );
  }

  // Unauthenticated user - show preview with sign up prompt
  if (!authUser) {
    return (
      <div className="app-container">
        <div className="stars-bg"></div>
        <div className="menu-screen">
          <h1 className="title">{currentTeam.name}</h1>
          <p className="subtitle">
            {currentTeam.isPublic ? 'Public Team' : 'Private Team'}
          </p>
          <p>Members: {currentTeam.memberCount}</p>
          <Link to="/" className="start-button" style={{ textDecoration: 'none' }}>
            🚀 Sign up to join
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated user who is a member - show landing/game/leaderboard views
  if (authUser && isMember) {
    if (view === 'game') {
      return (
        <div className="app-container">
          <div className="stars-bg"></div>
          <Game
            authUser={authUser}
            currentPlayer={currentPlayer}
            onPlayerUpdate={onPlayerUpdate}
            onLogout={onLogout}
            onOpenCreateTeam={onOpenCreateTeam}
            autoStart={true}
            onBackToTeam={() => setView('landing')}
            teamName={currentTeam.name}
            teamId={currentTeam.id}
          />
        </div>
      );
    }

    if (view === 'leaderboard') {
      return (
        <div className="app-container">
          <div className="stars-bg"></div>
          <div className="menu-screen">
            <TeamLeaderboard teamId={currentTeam.id} teamName={currentTeam.name} />
            <button
              onClick={() => setView('landing')}
              className="start-button"
              style={{ marginTop: '20px' }}
            >
              ← Back to Team
            </button>
          </div>
        </div>
      );
    }

    // Landing view - show team info with Play and View Leaderboard buttons
    return (
      <div className="app-container">
        <div className="stars-bg"></div>
        <div className="menu-screen">
          <h1 className="title">{currentTeam.name}</h1>
          <p className="subtitle">
            {currentTeam.isPublic ? 'Public Team' : 'Private Team'}
          </p>
          <p>Members: {currentTeam.memberCount}</p>

          <div className="menu-buttons-container">
            <button
              onClick={() => setView('game')}
              className="start-button"
            >
              🎮 Play for {currentTeam.name}
            </button>

            <button
              onClick={() => setView('leaderboard')}
              className="start-button"
            >
              🏆 View Leaderboard
            </button>

            <Link to="/" className="start-button" style={{ textDecoration: 'none' }}>
              🏠 Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user who is NOT a member - show join form
  return (
    <div className="app-container">
      <div className="stars-bg"></div>
      <div className="menu-screen">
        <h1 className="title">{currentTeam.name}</h1>
        <p className="subtitle">
          {currentTeam.isPublic ? 'Public Team' : 'Private Team'}
        </p>
        <p>Members: {currentTeam.memberCount}</p>

        {joinError && (
          <div style={{
            color: '#ff4757',
            padding: '10px',
            marginBottom: '15px',
            background: 'rgba(255, 71, 87, 0.1)',
            borderRadius: '8px',
            border: '2px solid #ff4757'
          }}>
            {joinError}
          </div>
        )}

        <form onSubmit={handleManualJoin} style={{ maxWidth: '400px', margin: '20px auto' }}>
          {!currentTeam.isPublic && (
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="team-password" style={{ display: 'block', marginBottom: '8px', color: '#00ff88' }}>
                Team Password:
              </label>
              <input
                id="team-password"
                type="password"
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                required={!currentTeam.isPublic}
                placeholder="Enter team password"
                disabled={isJoining}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid #00ff88',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining}
            className="start-button"
            style={{ width: '100%', marginBottom: '10px' }}
          >
            {isJoining ? '⏳ Joining...' : '👥 Join Team'}
          </button>
        </form>

        <Link to="/" className="start-button" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '10px' }}>
          🏠 Go Home
        </Link>
      </div>
    </div>
  );
}
