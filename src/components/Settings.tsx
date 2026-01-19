// Settings Modal Component
import { useState, useEffect } from 'react';
import { isSoundEnabled, setSoundEnabled } from '../services/audioService';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const handleSoundToggle = () => {
    const newValue = !soundOn;
    setSoundOn(newValue);
    setSoundEnabled(newValue);
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <button className="close-btn" onClick={onClose}>✕</button>

        <h2 className="settings-title">⚙️ Settings</h2>

        <div className="settings-list">
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
            >
              <span className="toggle-slider"></span>
            </button>
          </div>
        </div>

        <div className="settings-footer">
          <p>More settings coming soon!</p>
        </div>
      </div>
    </div>
  );
}
