import { useState, useEffect, useRef, type FormEvent } from 'react';
import { updateTeamSettings, deleteTeam } from '../services/teamService';
import type { Team } from '../types';
import './TeamSettingsModal.css';

interface TeamSettingsModalProps {
  team: Team;
  authPlayerId: string;
  onClose: () => void;
  onSettingsSaved: () => void;
  onTeamDeleted: () => void;
}

export default function TeamSettingsModal({
  team,
  authPlayerId,
  onClose,
  onSettingsSaved,
  onTeamDeleted,
}: TeamSettingsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPublic, setIsPublic] = useState(team.isPublic);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Track if team was previously public (to require password when switching to private)
  const wasPreviouslyPublic = team.isPublic;

  // Handle dialog open on mount
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.showModal();
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      // Validation: if switching to private and no password provided, require it
      if (!isPublic && !password && wasPreviouslyPublic) {
        setError('Password is required for private teams');
        setIsSaving(false);
        return;
      }

      await updateTeamSettings({
        teamId: team.id,
        requestorId: authPlayerId,
        isPublic,
        password: password || undefined, // Only send if provided
      });

      // Show success message
      setSuccess(true);

      // Call onSettingsSaved after 1.5s delay
      setTimeout(() => {
        onSettingsSaved();
      }, 1500);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update settings. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleDeleteTeam = async () => {
    const confirmed = window.confirm(
      `Delete ${team.name}?\n\nThis will permanently delete the team, remove all members, and erase all team leaderboard data. This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setError('');

    try {
      await deleteTeam(team.id, authPlayerId);
      onTeamDeleted(); // Trigger navigation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
      setIsDeleting(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="team-settings-modal" onClose={onClose}>
      <div className="modal-content">
        {success ? (
          // Success screen
          <>
            <h2>✓ Settings Updated!</h2>
            <p className="success-message">Your team settings have been saved.</p>
          </>
        ) : (
          // Settings form
          <>
            <div className="modal-header">
              <h2>Team Settings</h2>
              <button
                type="button"
                onClick={handleCancel}
                className="close-button"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="team-name-display">
              <label>Team Name:</label>
              <p>{team.name}</p>
              <span className="team-name-note">Team name cannot be changed after creation</span>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}

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
                    placeholder={
                      wasPreviouslyPublic
                        ? 'Enter new password'
                        : 'Enter new password (or leave blank to keep current)'
                    }
                    minLength={6}
                  />
                </div>
              )}

              <div className="button-group">
                <button type="button" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            <div className="danger-zone">
              <h3>Danger Zone</h3>
              <p>Once deleted, team data cannot be recovered</p>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={isDeleting || isSaving}
                className="delete-button"
              >
                {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete Team'}
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
