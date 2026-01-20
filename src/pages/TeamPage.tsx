import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useTeam } from '../contexts/TeamContext';

export function TeamPage() {
  const { slug } = useParams<{ slug: string }>();
  const { currentTeam, isLoadingCurrentTeam, setCurrentTeamBySlug } = useTeam();

  useEffect(() => {
    if (slug) {
      setCurrentTeamBySlug(slug);
    }
  }, [slug, setCurrentTeamBySlug]);

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

  // Placeholder - Phase 2 will add full team UI
  return (
    <div className="app-container">
      <div className="stars-bg"></div>
      <div className="menu-screen">
        <h1 className="title">{currentTeam.name}</h1>
        <p className="subtitle">Team page coming soon!</p>
        <p>Members: {currentTeam.memberCount}</p>
        <Link to="/" className="start-button" style={{ textDecoration: 'none' }}>
          🎮 Play Game
        </Link>
      </div>
    </div>
  );
}
