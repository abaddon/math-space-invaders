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
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { PlayerProfile, LeaderboardEntry } from './types';

const PLAYERS_COLLECTION = 'players';
const LEADERBOARD_COLLECTION = 'leaderboard';

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
