// Authentication Service - Simple username/password auth using Firestore
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { AuthUser, PlayerProfile } from './types';

const PLAYERS_COLLECTION = 'players';
const SESSION_KEY = 'mathInvaders_session';

// Simple hash function using Web Crypto API (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if username is available (case-insensitive)
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const playersRef = collection(db, PLAYERS_COLLECTION);
  const q = query(playersRef, where('usernameLower', '==', username.toLowerCase()));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
}

// Sign up a new user
export async function signUp(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  try {
    // Validate inputs
    if (username.length < 3 || username.length > 15) {
      return { success: false, error: 'Username must be 3-15 characters' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { success: false, error: 'Username can only contain letters, numbers, _ and -' };
    }
    if (password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters' };
    }

    // Check if username is taken
    const available = await isUsernameAvailable(username);
    if (!available) {
      return { success: false, error: 'Username is already taken' };
    }

    // Generate player ID
    const playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create player document
    const playerData = {
      id: playerId,
      username: username,
      usernameLower: username.toLowerCase(), // For case-insensitive lookups
      passwordHash: passwordHash,
      nickname: username, // Default nickname is username
      highScore: 0,
      bestLevel: 1,
      gamesPlayed: 0,
      totalCorrectAnswers: 0,
      createdAt: serverTimestamp(),
      lastPlayed: serverTimestamp()
    };

    await setDoc(doc(db, PLAYERS_COLLECTION, playerId), playerData);

    // Create session
    const authUser: AuthUser = {
      playerId,
      username,
      nickname: username
    };

    saveSession(authUser);

    return { success: true, user: authUser };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: 'Failed to create account. Please try again.' };
  }
}

// Sign in an existing user
export async function signIn(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  try {
    // Find user by username (case-insensitive)
    const playersRef = collection(db, PLAYERS_COLLECTION);
    const q = query(playersRef, where('usernameLower', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Get user data
    const playerDoc = querySnapshot.docs[0];
    const playerData = playerDoc.data();

    // Verify password
    const passwordHash = await hashPassword(password);
    if (passwordHash !== playerData.passwordHash) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Create session
    const authUser: AuthUser = {
      playerId: playerData.id,
      username: playerData.username,
      nickname: playerData.nickname
    };

    saveSession(authUser);

    return { success: true, user: authUser };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Failed to sign in. Please try again.' };
  }
}

// Sign out - clear session
export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
}

// Get current session from localStorage
export function getSession(): AuthUser | null {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;

  try {
    return JSON.parse(sessionStr) as AuthUser;
  } catch {
    return null;
  }
}

// Save session to localStorage
function saveSession(user: AuthUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

// Validate that session user still exists in Firestore
export async function validateSession(session: AuthUser): Promise<boolean> {
  try {
    const playerRef = doc(db, PLAYERS_COLLECTION, session.playerId);
    const playerDoc = await getDoc(playerRef);
    return playerDoc.exists();
  } catch {
    return false;
  }
}

// Get player profile by ID
export async function getPlayerProfileById(playerId: string): Promise<PlayerProfile | null> {
  try {
    const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
    const playerDoc = await getDoc(playerRef);

    if (!playerDoc.exists()) return null;

    const data = playerDoc.data();
    return {
      id: data.id,
      username: data.username,
      nickname: data.nickname,
      highScore: data.highScore,
      bestLevel: data.bestLevel,
      gamesPlayed: data.gamesPlayed,
      totalCorrectAnswers: data.totalCorrectAnswers,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastPlayed: data.lastPlayed?.toDate() || new Date()
    } as PlayerProfile;
  } catch (error) {
    console.error('Error getting player profile:', error);
    return null;
  }
}
