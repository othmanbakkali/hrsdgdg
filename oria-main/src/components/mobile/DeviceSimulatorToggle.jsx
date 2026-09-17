import React from 'react';

export default function DeviceSimulatorToggle({ isMobileSimulator, onToggleSimulator }) {
  return (
    <div className="device-simulator-floating-bar">
      <div className="simulator-toggle-inner">
        <span className="simulator-label">Expérience :</span>
        <button 
          className={`simulator-btn ${!isMobileSimulator ? 'active' : ''}`}
          onClick={() => onToggleSimulator(false)}
        >
          💻 Bureau
        </button>
        <button 
          className={`simulator-btn ${isMobileSimulator ? 'active' : ''}`}
          onClick={() => onToggleSimulator(true)}
        >
          📱 Mobile Avito
        </button>
      </div>
    </div>
  );
}
