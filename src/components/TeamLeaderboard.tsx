// Team Leaderboard Component with infinite scroll
import { useState, useEffect, useRef, useCallback } from 'react';
import type { TeamLeaderboardEntry } from '../types';
import { getTeamLeaderboard } from '../leaderboardService';
import type { DocumentSnapshot } from 'firebase/firestore';
import './TeamLeaderboard.css';

interface TeamLeaderboardProps {
  teamId: string;
  teamName: string;
}

export function TeamLeaderboard({ teamId, teamName }: TeamLeaderboardProps) {
  const [entries, setEntries] = useState<TeamLeaderboardEntry[]>([]);
  const [cursor, setCursor] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;  // Guard clause

    setIsLoading(true);
    const result = await getTeamLeaderboard(teamId, 25, cursor || undefined);
    setEntries(prev => [...prev, ...result.entries]);
    setCursor(result.lastDoc);
    setHasMore(result.hasMore);
    setIsLoading(false);
    setIsInitialLoad(false);
  }, [teamId, cursor, hasMore, isLoading]);

  // Load first page on mount or when teamId changes
  useEffect(() => {
    // Reset state when team changes
    setEntries([]);
    setCursor(null);
    setHasMore(true);
    setIsInitialLoad(true);
    setIsLoading(false); // Reset loading state

    // Load first page
    const loadFirstPage = async () => {
      setIsLoading(true);
      const result = await getTeamLeaderboard(teamId, 25, undefined);
      setEntries(result.entries); // Replace, not append
      setCursor(result.lastDoc);
      setHasMore(result.hasMore);
      setIsLoading(false);
      setIsInitialLoad(false);
    };

    loadFirstPage();
  }, [teamId]); // Only depend on teamId

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '100px' }  // Trigger 100px before reaching bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  // Render
  return (
    <div className="team-leaderboard">
      <h2 className="leaderboard-title">{teamName} Leaderboard</h2>

      {isInitialLoad && entries.length === 0 ? (
        <div className="leaderboard-loading">Loading leaderboard...</div>
      ) : entries.length === 0 ? (
        <div className="leaderboard-empty">
          No scores yet. Be the first to play!
        </div>
      ) : (
        <>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Score</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.id}>
                  <td className="rank-cell">{index + 1}</td>
                  <td className="player-cell">{entry.nickname}</td>
                  <td className="score-cell">{entry.score.toLocaleString()}</td>
                  <td className="level-cell">{entry.level}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Sentinel element for infinite scroll */}
          {hasMore && (
            <div ref={sentinelRef} className="leaderboard-sentinel">
              {isLoading && <span className="loading-text">Loading more...</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
