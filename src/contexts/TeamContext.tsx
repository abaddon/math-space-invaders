import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { TeamMembership, Team } from '../types';
import { getMyTeams, getTeamBySlug } from '../services/teamService';

interface TeamContextValue {
  // User's team memberships
  myTeams: TeamMembership[];
  isLoadingTeams: boolean;

  // Current team context (from URL)
  currentTeam: Team | null;
  isLoadingCurrentTeam: boolean;

  // Actions
  refreshMyTeams: (playerId: string) => Promise<void>;
  setCurrentTeamBySlug: (slug: string) => Promise<void>;
  clearCurrentTeam: () => void;
}

const TeamContext = createContext<TeamContextValue | null>(null);

interface TeamProviderProps {
  children: ReactNode;
}

export function TeamProvider({ children }: TeamProviderProps) {
  const [myTeams, setMyTeams] = useState<TeamMembership[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [isLoadingCurrentTeam, setIsLoadingCurrentTeam] = useState(false);

  const refreshMyTeams = useCallback(async (playerId: string) => {
    if (!playerId) return;
    setIsLoadingTeams(true);
    try {
      const teams = await getMyTeams(playerId);
      setMyTeams(teams);
    } catch (error) {
      console.error('Failed to load teams:', error);
      setMyTeams([]);
    } finally {
      setIsLoadingTeams(false);
    }
  }, []);

  const setCurrentTeamBySlug = useCallback(async (slug: string) => {
    if (!slug) {
      setCurrentTeam(null);
      return;
    }
    setIsLoadingCurrentTeam(true);
    try {
      const team = await getTeamBySlug(slug);
      console.log('[TeamContext] setCurrentTeamBySlug - fetched team:', team?.name, 'memberCount:', team?.memberCount);
      setCurrentTeam(team);
    } catch (error) {
      console.error('Failed to load team:', error);
      setCurrentTeam(null);
    } finally {
      setIsLoadingCurrentTeam(false);
    }
  }, []);

  const clearCurrentTeam = useCallback(() => {
    setCurrentTeam(null);
  }, []);

  const value: TeamContextValue = {
    myTeams,
    isLoadingTeams,
    currentTeam,
    isLoadingCurrentTeam,
    refreshMyTeams,
    setCurrentTeamBySlug,
    clearCurrentTeam,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam(): TeamContextValue {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
