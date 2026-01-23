// Settings Modal Component
import { useState } from 'react';
import { isSoundEnabled, setSoundEnabled } from '../services/audioService';

interface SettingsProps {
  onClose: () => void;
}

// LocalStorage keys for settings
const SETTINGS_KEYS = {
  VISUAL_EFFECTS: 'mathInvaders_visualEffects',
  VIBRATION: 'mathInvaders_vibration',
};

// Helper functions to get initial state from localStorage
function getInitialVisualEffects(): boolean {
  const saved = localStorage.getItem(SETTINGS_KEYS.VISUAL_EFFECTS);
  return saved !== null ? saved === 'true' : true;
}

function getInitialVibration(): boolean {
  const saved = localStorage.getItem(SETTINGS_KEYS.VIBRATION);
  return saved !== null ? saved === 'true' : true;
}

function getIsTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function Settings({ onClose }: SettingsProps) {
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [visualEffectsOn, setVisualEffectsOn] = useState(getInitialVisualEffects);
  const [vibrationOn, setVibrationOn] = useState(getInitialVibration);
  const [isTouchDevice] = useState(getIsTouchDevice);

  const handleSoundToggle = () => {
    const newValue = !soundOn;
    setSoundOn(newValue);
    setSoundEnabled(newValue);
  };

  const handleVisualEffectsToggle = () => {
    const newValue = !visualEffectsOn;
    setVisualEffectsOn(newValue);
    localStorage.setItem(SETTINGS_KEYS.VISUAL_EFFECTS, String(newValue));
    // Visual effects setting can be read by the game
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { visualEffects: newValue } }));
  };

  const handleVibrationToggle = () => {
    const newValue = !vibrationOn;
    setVibrationOn(newValue);
    localStorage.setItem(SETTINGS_KEYS.VIBRATION, String(newValue));
    // Test vibration when enabling
    if (newValue && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <button className="close-btn" onClick={onClose} aria-label="Close settings">✕</button>

        <h2 className="settings-title">⚙️ Settings</h2>

        <div className="settings-list">
          {/* Sound Effects */}
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🔊</span>
              <div>
                <span className="setting-label">Sound Effects</span>
                <span className="setting-desc">Play sounds for actions</span>
              </div>
            </div>
            <button
              className={`toggle-btn ${soundOn ? 'active' : ''}`}
              onClick={handleSoundToggle}
              aria-label={soundOn ? 'Disable sound effects' : 'Enable sound effects'}
              aria-pressed={soundOn}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>

          {/* Visual Effects */}
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">✨</span>
              <div>
                <span className="setting-label">Visual Effects</span>
                <span className="setting-desc">Particles, glows, and trails</span>
              </div>
            </div>
            <button
              className={`toggle-btn ${visualEffectsOn ? 'active' : ''}`}
              onClick={handleVisualEffectsToggle}
              aria-label={visualEffectsOn ? 'Disable visual effects' : 'Enable visual effects'}
              aria-pressed={visualEffectsOn}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>

          {/* Vibration (mobile only) */}
          {isTouchDevice && 'vibrate' in navigator && (
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-icon">📳</span>
                <div>
                  <span className="setting-label">Vibration</span>
                  <span className="setting-desc">Haptic feedback on touch</span>
                </div>
              </div>
              <button
                className={`toggle-btn ${vibrationOn ? 'active' : ''}`}
                onClick={handleVibrationToggle}
                aria-label={vibrationOn ? 'Disable vibration' : 'Enable vibration'}
                aria-pressed={vibrationOn}
              >
                <span className="toggle-slider"></span>
              </button>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <p className="settings-version">Version 1.0</p>
        </div>
      </div>
    </div>
  );
}
