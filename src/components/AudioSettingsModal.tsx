import React, { useState, useEffect } from 'react';
import type { TTSSettings } from '../types/padel';
import { ttsService } from '../services/ttsService';
import { Volume2, VolumeX, Play, X, Mic } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: TTSSettings;
  onUpdateSettings: (settings: TTSSettings) => void;
}

export const AudioSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const [localSettings, setLocalSettings] = useState<TTSSettings>(settings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!isOpen) return;

    const loadVoices = () => {
      const spanish = ttsService.getAvailableSpanishVoices();
      if (spanish.length > 0) {
        setAvailableVoices(spanish);
      } else {
        setAvailableVoices(ttsService.getAllVoices());
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    ttsService.unlockAudioContext();
    ttsService.speak('Treinta iguales. Punto de oro en juego.', localSettings);
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} className="glass-panel">
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={iconBadgeStyle}>
              <Volume2 size={22} color="var(--gold-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Arbitraje por Voz (TTS)</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Configuración del sintetizador para anuncios en parlantes de cancha
              </p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Enable / Disable Toggle */}
        <div style={toggleRowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {localSettings.enabled ? <Volume2 color="#00e676" size={24} /> : <VolumeX color="var(--text-dim)" size={24} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Anunciar Marcador por Voz</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Cantar puntos, juegos, punto de oro y cambio de lado
              </div>
            </div>
          </div>
          <label style={switchLabelStyle}>
            <input
              type="checkbox"
              checked={localSettings.enabled}
              onChange={e => setLocalSettings(prev => ({ ...prev, enabled: e.target.checked }))}
              style={{ display: 'none' }}
            />
            <div style={{
              ...switchTrackStyle,
              background: localSettings.enabled ? 'var(--team1-primary)' : '#243048'
            }}>
              <div style={{
                ...switchThumbStyle,
                transform: localSettings.enabled ? 'translateX(22px)' : 'translateX(2px)'
              }} />
            </div>
          </label>
        </div>

        {/* Voice Selector */}
        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>
            <Mic size={15} color="var(--team1-primary)" /> Voz en Español
          </label>
          <select
            value={localSettings.voiceName}
            onChange={e => setLocalSettings(prev => ({ ...prev, voiceName: e.target.value }))}
            style={selectStyle}
          >
            <option value="">Voz predeterminada del sistema</option>
            {availableVoices.map(v => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Rate (Velocidad) */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={labelStyle}>Velocidad de Dicción</label>
            <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--gold-primary)' }}>
              {localSettings.rate}x
            </span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.05"
            value={localSettings.rate}
            onChange={e => setLocalSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
            style={rangeStyle}
          />
        </div>

        {/* Volume */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={labelStyle}>Volumen de Salida</label>
            <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--gold-primary)' }}>
              {Math.round(localSettings.volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={localSettings.volume}
            onChange={e => setLocalSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
            style={rangeStyle}
          />
        </div>

        {/* Test voice action */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <button onClick={handleTestVoice} style={testVoiceBtnStyle}>
            <Play size={16} fill="currentColor" /> Probar Voz en Parlante
          </button>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button onClick={onClose} style={secondaryBtnStyle}>
            Cancelar
          </button>
          <button onClick={handleSave} style={primaryBtnStyle}>
            Guardar Ajustes
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(5, 8, 15, 0.85)',
  backdropFilter: 'blur(8px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
  animation: 'slideDown 0.25s ease-out'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  paddingBottom: '16px',
  borderBottom: '1px solid var(--border-subtle)'
};

const iconBadgeStyle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '12px',
  background: 'rgba(255, 214, 0, 0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255, 214, 0, 0.3)'
};

const closeBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  cursor: 'pointer'
};

const toggleRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 16px',
  background: 'var(--bg-elevated)',
  borderRadius: '14px',
  marginBottom: '20px',
  border: '1px solid var(--border-subtle)'
};

const switchLabelStyle: React.CSSProperties = {
  cursor: 'pointer'
};

const switchTrackStyle: React.CSSProperties = {
  width: '48px',
  height: '26px',
  borderRadius: '13px',
  position: 'relative',
  transition: 'background 0.25s'
};

const switchThumbStyle: React.CSSProperties = {
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  background: '#ffffff',
  position: 'absolute',
  top: '2px',
  transition: 'transform 0.25s',
  boxShadow: '0 2px 5px rgba(0,0,0,0.4)'
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'var(--text-main)',
  marginBottom: '6px'
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-input, #ffffff)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '10px',
  color: 'var(--text-main)',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  outline: 'none'
};

const rangeStyle: React.CSSProperties = {
  width: '100%',
  accentColor: 'var(--gold-primary)',
  cursor: 'pointer'
};

const testVoiceBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 18px',
  borderRadius: '10px',
  background: 'rgba(255, 214, 0, 0.12)',
  color: 'var(--gold-primary)',
  border: '1px solid rgba(255, 214, 0, 0.35)',
  fontWeight: 700,
  fontSize: '0.88rem'
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px'
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: '10px',
  background: 'var(--bg-elevated)',
  color: 'var(--text-main)',
  border: '1px solid var(--border-subtle)',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer'
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 22px',
  borderRadius: '10px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  fontWeight: 800,
  fontSize: '0.9rem'
};
