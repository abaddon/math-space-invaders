import { useState, useEffect, useRef, type FormEvent } from 'react';
import { createTeamWithUniqueSlug } from '../services/teamService';
import type { AuthUser, Team } from '../types';
import { ShareTeamLink } from './ShareTeamLink';
import './CreateTeamModal.css';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (team: Team) => void;
  currentUser: AuthUser;
}

export default function CreateTeamModal({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
}: CreateTeamModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [teamName, setTeamName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTeam, setCreatedTeam] = useState<Team | null>(null);
  const [teamPassword, setTeamPassword] = useState<string | undefined>(undefined);

  // Handle dialog open/close based on isOpen prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setTeamName('');
      setIsPublic(true);
      setPassword('');
      setError('');
      setIsSubmitting(false);
      setCreatedTeam(null);
      setTeamPassword(undefined);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const team = await createTeamWithUniqueSlug({
        name: teamName,
        creatorId: currentUser.playerId,
        creatorNickname: currentUser.nickname,
        isPublic,
        password: isPublic ? undefined : password,
      });

      // Store team and password for ShareTeamLink display
      setCreatedTeam(team);
      setTeamPassword(isPublic ? undefined : password);
      onSuccess(team);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('already taken')) {
          setError('Team name already taken, please choose a different name');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to create team. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <dialog ref={dialogRef} className="create-team-modal">
      <div className="modal-content">
        {createdTeam ? (
          // Show success screen with shareable link
          <>
            <ShareTeamLink team={createdTeam} password={teamPassword} />
            <div className="button-group">
              <button type="button" onClick={handleCancel}>
                Done
              </button>
            </div>
          </>
        ) : (
          // Show creation form
          <>
            <h2>Create Team</h2>
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label htmlFor="team-name">Team Name</label>
                <input
                  id="team-name"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  minLength={3}
                  maxLength={50}
                  required
                  autoFocus
                  placeholder="Enter team name"
                />
              </div>

              <div className="form-group">
                <label>Team Privacy</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isPublic"
                      value="true"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                    />
                    Public (anyone can join)
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isPublic"
                      value="false"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                    />
                    Private (password required)
                  </label>
                </div>
              </div>

              {!isPublic && (
                <div className="form-group">
                  <label htmlFor="team-password">Team Password</label>
                  <input
                    id="team-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                    placeholder="Enter team password"
                  />
                </div>
              )}

              <div className="button-group">
                <button type="button" onClick={handleCancel} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
