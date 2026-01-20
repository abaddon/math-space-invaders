// Leaderboard Service - Firebase operations for player scores
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
  where,
  startAfter,
  type DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { PlayerProfile, LeaderboardEntry, TeamLeaderboardEntry } from './types';

const PLAYERS_COLLECTION = 'players';
const LEADERBOARD_COLLECTION = 'leaderboard';
const TEAM_LEADERBOARD_COLLECTION = 'teamLeaderboard';

// Get player profile by ID
export async function getPlayerProfile(playerId: string): Promise<PlayerProfile | null> {
  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  const playerDoc = await getDoc(playerRef);

  if (playerDoc.exists()) {
    const data = playerDoc.data();
    return {
      id: data.id,
      username: data.username,
      nickname: data.nickname,
      highScore: data.highScore,
      bestLevel: data.bestLevel,
      gamesPlayed: data.gamesPlayed,
      totalCorrectAnswers: data.totalCorrectAnswers,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      lastPlayed: data.lastPlayed instanceof Timestamp ? data.lastPlayed.toDate() : new Date()
    } as PlayerProfile;
  }

  return null;
}

// Update player stats after a game
export async function updatePlayerStats(
  playerId: string,
  score: number,
  level: number,
  correctAnswers: number
): Promise<void> {
  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  const playerDoc = await getDoc(playerRef);

  if (playerDoc.exists()) {
    const currentData = playerDoc.data();
    const isNewHighScore = score > currentData.highScore;

    await updateDoc(playerRef, {
      highScore: isNewHighScore ? score : currentData.highScore,
      bestLevel: Math.max(currentData.bestLevel, level),
      gamesPlayed: currentData.gamesPlayed + 1,
      totalCorrectAnswers: currentData.totalCorrectAnswers + correctAnswers,
      lastPlayed: serverTimestamp()
    });

    // Update leaderboard if new high score
    if (isNewHighScore) {
      await updateLeaderboard(playerId, currentData.nickname, score, level);
    }
  }
}

// Update global leaderboard
async function updateLeaderboard(
  playerId: string,
  nickname: string,
  score: number,
  level: number
): Promise<void> {
  const leaderboardRef = doc(db, LEADERBOARD_COLLECTION, playerId);

  await setDoc(leaderboardRef, {
    playerId,
    nickname,
    score,
    level,
    achievedAt: serverTimestamp()
  });
}

// Get top scores from leaderboard
export async function getLeaderboard(topN: number = 10): Promise<LeaderboardEntry[]> {
  const leaderboardRef = collection(db, LEADERBOARD_COLLECTION);
  const q = query(leaderboardRef, orderBy('score', 'desc'), limit(topN));

  const querySnapshot = await getDocs(q);
  const entries: LeaderboardEntry[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    entries.push({
      playerId: data.playerId,
      nickname: data.nickname,
      score: data.score,
      level: data.level,
      achievedAt: data.achievedAt instanceof Timestamp ? data.achievedAt.toDate() : new Date()
    });
  });

  return entries;
}

// Update team leaderboard
export async function updateTeamLeaderboard(
  teamId: string,
  playerId: string,
  nickname: string,
  score: number,
  level: number
): Promise<void> {
  const teamLeaderboardRef = doc(db, TEAM_LEADERBOARD_COLLECTION, `${teamId}_${playerId}`);

  await setDoc(teamLeaderboardRef, {
    id: `${teamId}_${playerId}`,
    teamId,
    playerId,
    nickname,
    score,
    level,
    achievedAt: serverTimestamp()
  });
}

// Paginated team leaderboard result
interface PaginatedTeamLeaderboard {
  entries: TeamLeaderboardEntry[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

// Get team leaderboard with cursor-based pagination
export async function getTeamLeaderboard(
  teamId: string,
  pageSize: number = 25,
  cursor?: DocumentSnapshot
): Promise<PaginatedTeamLeaderboard> {
  try {
    const leaderboardRef = collection(db, TEAM_LEADERBOARD_COLLECTION);

    // CRITICAL: Two orderBy clauses for stable tie-breaking
    // Primary: score DESC (highest first)
    // Secondary: achievedAt ASC (earlier time wins ties)
    let q = query(
      leaderboardRef,
      where('teamId', '==', teamId),
      orderBy('score', 'desc'),
      orderBy('achievedAt', 'asc'),
      limit(pageSize + 1)  // Fetch one extra to detect hasMore
    );

    // Start after cursor if provided
    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    const snapshot = await getDocs(q);
    const entries: TeamLeaderboardEntry[] = [];

    snapshot.forEach((doc) => {
      if (entries.length < pageSize) {  // Only take pageSize items
        const data = doc.data();
        entries.push({
          id: data.id,
          teamId: data.teamId,
          playerId: data.playerId,
          nickname: data.nickname,
          score: data.score,
          level: data.level,
          achievedAt: data.achievedAt instanceof Timestamp ? data.achievedAt.toDate() : new Date(),
        });
      }
    });

    const hasMore = snapshot.docs.length > pageSize;
    const lastDoc = hasMore ? snapshot.docs[pageSize - 1] : null;

    return { entries, lastDoc, hasMore };
  } catch (error) {
    console.error('Get team leaderboard error:', error);
    return { entries: [], lastDoc: null, hasMore: false };
  }
}
