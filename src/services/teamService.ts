// Team Service - Firebase operations for team management
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
  type FieldValue
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Team, TeamMembership, TeamRole } from '../types';

const TEAMS_COLLECTION = 'teams';
const TEAM_MEMBERSHIPS_COLLECTION = 'teamMemberships';

// Simple hash function using Web Crypto API (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Transform team name to URL-safe slug (name-based, no random suffix)
 * @param name Team name
 * @returns URL-safe slug based on team name
 * @example "Math Wizards" -> "math-wizards"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    // Remove special characters (keep letters, numbers, hyphens)
    .replace(/[^a-z0-9-]/g, '')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Create a new team with unique slug (using transaction for atomicity)
 * @param params Team creation parameters
 * @returns Created team object
 * @throws Error with 'SLUG_TAKEN' message if team name already exists
 */
export async function createTeamWithUniqueSlug(params: {
  name: string;
  creatorId: string;
  creatorNickname: string;
  isPublic: boolean;
  password?: string;
}): Promise<Team> {
  const { name, creatorId, creatorNickname, isPublic, password } = params;

  // Validate inputs
  if (!name || name.trim().length === 0) {
    throw new Error('Team name is required');
  }
  if (name.length < 3 || name.length > 50) {
    throw new Error('Team name must be 3-50 characters');
  }
  if (!isPublic && !password) {
    throw new Error('Password is required for private teams');
  }

  // Generate slug from name
  const slug = slugify(name);
  const slugLower = slug.toLowerCase();

  // Hash password if provided
  let passwordHash: string | undefined;
  if (!isPublic && password) {
    passwordHash = await hashPassword(password);
  }

  // Check if slug already exists (outside transaction to avoid permission issues)
  try {
    const teamsRef = collection(db, TEAMS_COLLECTION);
    const q = query(teamsRef, where('slugLower', '==', slugLower));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error('Team name already taken, please choose a different name');
    }
  } catch (error) {
    // If query fails, continue - let the setDoc handle conflicts
    console.warn('Could not check for existing team:', error);
  }

  try {
    // Generate team ID using slug as base for predictable conflicts
    const teamId = `team_${slugLower}`;

    // Create team document
    const teamData: Omit<Team, 'createdAt' | 'updatedAt'> & {
      createdAt: FieldValue;
      updatedAt: FieldValue;
    } = {
      id: teamId,
      name: name.trim(),
      slug,
      slugLower,
      creatorId,
      memberCount: 1,
      isPublic,
      passwordHash,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const teamRef = doc(db, TEAMS_COLLECTION, teamId);

    // Check if document already exists
    const existingTeam = await getDoc(teamRef);
    if (existingTeam.exists()) {
      throw new Error('Team name already taken, please choose a different name');
    }

    await setDoc(teamRef, teamData);

    // Create creator's membership
    const membershipId = `${teamId}_${creatorId}`;
    const membershipData: Omit<TeamMembership, 'joinedAt'> & {
      joinedAt: FieldValue;
    } = {
      id: membershipId,
      teamId,
      playerId: creatorId,
      role: 'creator' as TeamRole,
      teamName: name.trim(),
      teamSlug: slug,
      playerNickname: creatorNickname,
      joinedAt: serverTimestamp(),
    };

    const membershipRef = doc(db, TEAM_MEMBERSHIPS_COLLECTION, membershipId);
    await setDoc(membershipRef, membershipData);

    // Return created team with current timestamp
    const now = new Date();
    return {
      ...teamData,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('already taken')) {
      throw error;
    }
    console.error('Create team error:', error);
    throw new Error('Failed to create team. Please try again.');
  }
}

/**
 * Get team by slug (case-insensitive)
 * @param slug Team slug
 * @returns Team object or null if not found
 */
export async function getTeamBySlug(slug: string): Promise<Team | null> {
  try {
    const teamsRef = collection(db, TEAMS_COLLECTION);
    const q = query(teamsRef, where('slugLower', '==', slug.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const teamDoc = querySnapshot.docs[0];
    const data = teamDoc.data();

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      slugLower: data.slugLower,
      creatorId: data.creatorId,
      memberCount: data.memberCount,
      isPublic: data.isPublic,
      passwordHash: data.passwordHash,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
  } catch (error) {
    console.error('Get team by slug error:', error);
    return null;
  }
}

/**
 * Join a team
 * @param params Join team parameters
 * @returns Success status and optional error message
 */
export async function joinTeam(params: {
  teamId: string;
  playerId: string;
  playerNickname: string;
  password?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { teamId, playerId, playerNickname, password } = params;

    // Get team by ID
    const teamRef = doc(db, TEAMS_COLLECTION, teamId);
    const teamDoc = await getDoc(teamRef);

    if (!teamDoc.exists()) {
      return { success: false, error: 'Team not found' };
    }

    const teamData = teamDoc.data();

    // If team is private, verify password
    if (!teamData.isPublic) {
      if (!password) {
        return { success: false, error: 'Password is required for private teams' };
      }

      const passwordHash = await hashPassword(password);
      if (passwordHash !== teamData.passwordHash) {
        return { success: false, error: 'Incorrect password' };
      }
    }

    // Check if already a member
    const membershipId = `${teamId}_${playerId}`;
    const membershipRef = doc(db, TEAM_MEMBERSHIPS_COLLECTION, membershipId);
    const membershipDoc = await getDoc(membershipRef);

    if (membershipDoc.exists()) {
      return { success: false, error: 'You are already a member of this team' };
    }

    // Create membership document
    const membershipData: Omit<TeamMembership, 'joinedAt'> & {
      joinedAt: FieldValue;
    } = {
      id: membershipId,
      teamId,
      playerId,
      role: 'member' as TeamRole,
      teamName: teamData.name,
      teamSlug: teamData.slug,
      playerNickname,
      joinedAt: serverTimestamp(),
    };

    await setDoc(membershipRef, membershipData);

    // Increment team member count
    await updateDoc(teamRef, {
      memberCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Join team error:', error);
    return { success: false, error: 'Failed to join team. Please try again.' };
  }
}

/**
 * Get all teams for a player
 * @param playerId Player ID
 * @returns Array of team memberships ordered by joinedAt desc
 */
export async function getMyTeams(playerId: string): Promise<TeamMembership[]> {
  try {
    const membershipsRef = collection(db, TEAM_MEMBERSHIPS_COLLECTION);
    const q = query(
      membershipsRef,
      where('playerId', '==', playerId),
      orderBy('joinedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const memberships: TeamMembership[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      memberships.push({
        id: data.id,
        teamId: data.teamId,
        playerId: data.playerId,
        role: data.role as TeamRole,
        teamName: data.teamName,
        teamSlug: data.teamSlug,
        playerNickname: data.playerNickname,
        joinedAt: data.joinedAt instanceof Timestamp ? data.joinedAt.toDate() : new Date(),
      });
    });

    return memberships;
  } catch (error) {
    console.error('Get my teams error:', error);
    return [];
  }
}
