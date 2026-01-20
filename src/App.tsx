import { useState, useEffect } from 'react';
import type { AuthUser, PlayerProfile } from './types';
import { AuthScreen } from './components/AuthScreen';
import { Game } from './components/Game';
import { getSession, validateSession, signOut } from './authService';
import { getPlayerProfile } from './leaderboardService';
import { initAnalytics, trackSessionRestored, trackLogout, trackScreenView } from './analytics';
import './App.css';

type AppScreen = 'AUTH' | 'GAME';

function App() {
  // Auth state
  const [appScreen, setAppScreen] = useState<AppScreen>('AUTH');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Initialize analytics
  useEffect(() => {
    initAnalytics();
  }, []);

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
          setAppScreen('GAME');
          trackSessionRestored();
          trackScreenView('menu');
        } else {
          // Invalid session, clear it
          signOut();
          trackScreenView('auth');
        }
      } else {
        trackScreenView('auth');
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
    setAppScreen('GAME');
    trackScreenView('menu');
  };

  // Handle logout
  const handleLogout = () => {
    trackLogout();
    signOut();
    setAuthUser(null);
    setCurrentPlayer(null);
    setAppScreen('AUTH');
    trackScreenView('auth');
  };

  // Handle player profile updates from game
  const handlePlayerUpdate = (player: PlayerProfile) => {
    setCurrentPlayer(player);
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

  // Render Game (includes menu, playing, game over, etc.)
  return (
    <Game
      authUser={authUser!}
      currentPlayer={currentPlayer}
      onPlayerUpdate={handlePlayerUpdate}
      onLogout={handleLogout}
    />
  );
}

export default App;
