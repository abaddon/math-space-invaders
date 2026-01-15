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

// Generate a unique player ID (stored in localStorage)
export function getOrCreatePlayerId(): string {
  const storageKey = 'mathInvaders_playerId';
  let playerId = localStorage.getItem(storageKey);

  if (!playerId) {
    playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(storageKey, playerId);
  }

  return playerId;
}

// Get stored nickname from localStorage
export function getStoredNickname(): string | null {
  return localStorage.getItem('mathInvaders_nickname');
}

// Store nickname in localStorage
export function storeNickname(nickname: string): void {
  localStorage.setItem('mathInvaders_nickname', nickname);
}

// Create or update player profile
export async function savePlayerProfile(playerId: string, nickname: string): Promise<void> {
  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  const playerDoc = await getDoc(playerRef);

  if (playerDoc.exists()) {
    // Update existing player
    await updateDoc(playerRef, {
      nickname,
      lastPlayed: serverTimestamp()
    });
  } else {
    // Create new player
    const newPlayer: Omit<PlayerProfile, 'lastPlayed'> & { lastPlayed: ReturnType<typeof serverTimestamp> } = {
      id: playerId,
      nickname,
      highScore: 0,
      bestLevel: 1,
      gamesPlayed: 0,
      totalCorrectAnswers: 0,
      lastPlayed: serverTimestamp()
    };
    await setDoc(playerRef, newPlayer);
  }

  storeNickname(nickname);
}

// Get player profile
export async function getPlayerProfile(playerId: string): Promise<PlayerProfile | null> {
  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  const playerDoc = await getDoc(playerRef);

  if (playerDoc.exists()) {
    const data = playerDoc.data();
    return {
      ...data,
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
    const currentData = playerDoc.data() as PlayerProfile;
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

// Check if nickname is available (optional - for unique nicknames)
export async function isNicknameAvailable(nickname: string, currentPlayerId: string): Promise<boolean> {
  const leaderboardRef = collection(db, LEADERBOARD_COLLECTION);
  const querySnapshot = await getDocs(leaderboardRef);

  let isAvailable = true;
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.nickname.toLowerCase() === nickname.toLowerCase() && data.playerId !== currentPlayerId) {
      isAvailable = false;
    }
  });

  return isAvailable;
}
