import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { AuthUser, PlayerProfile, Team } from './types';
import { AuthScreen } from './components/AuthScreen';
import { Game } from './components/Game';
import CreateTeamModal from './components/CreateTeamModal';
import { TeamProvider } from './contexts/TeamContext';
import { TeamPage } from './pages/TeamPage';
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

  // Team creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // Handle team creation success
  const handleTeamCreated = (team: Team) => {
    console.log('Team created:', team);
    // Modal will handle showing the shareable link
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

  // Wrap with TeamProvider and add Routes
  return (
    <TeamProvider>
      <Routes>
        <Route path="/" element={
          appScreen === 'AUTH' ? (
            <div className="app-container">
              <div className="stars-bg"></div>
              <AuthScreen onAuthSuccess={handleAuthSuccess} />
            </div>
          ) : (
            <>
              <Game
                authUser={authUser!}
                currentPlayer={currentPlayer}
                onPlayerUpdate={handlePlayerUpdate}
                onLogout={handleLogout}
                onOpenCreateTeam={() => setShowCreateModal(true)}
              />
              {authUser && (
                <CreateTeamModal
                  isOpen={showCreateModal}
                  onClose={() => setShowCreateModal(false)}
                  onSuccess={handleTeamCreated}
                  currentUser={authUser}
                />
              )}
            </>
          )
        } />
        <Route path="/team/:slug" element={<TeamPage />} />
      </Routes>
    </TeamProvider>
  );
}

export default App;
