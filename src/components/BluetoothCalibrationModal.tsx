import React, { useState, useEffect } from 'react';
import type { HardwareKeyMapping } from '../types/padel';
import { DEFAULT_KEY_PRESETS, saveKeyMapping } from '../services/hardwareInput';
import { Bluetooth, Check, Radio, X, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentMapping: HardwareKeyMapping;
  onUpdateMapping: (mapping: HardwareKeyMapping) => void;
}

export const BluetoothCalibrationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentMapping,
  onUpdateMapping
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('ring_remote');
  const [mapping, setMapping] = useState<HardwareKeyMapping>(currentMapping);
  const [listeningFor, setListeningFor] = useState<'team1' | 'team2' | 'undo' | 'repeat' | null>(null);
  const [lastDetectedKey, setLastDetectedKey] = useState<string | null>(null);

  useEffect(() => {
    setMapping(currentMapping);
  }, [currentMapping]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.code)) {
        e.preventDefault();
      }

      setLastDetectedKey(e.code || e.key);

      if (listeningFor) {
        const keyToAdd = e.code || e.key;
        setMapping(prev => {
          const next = { ...prev };
          if (listeningFor === 'team1') {
            next.team1PointKeys = Array.from(new Set([...next.team1PointKeys, keyToAdd]));
          } else if (listeningFor === 'team2') {
            next.team2PointKeys = Array.from(new Set([...next.team2PointKeys, keyToAdd]));
          } else if (listeningFor === 'undo') {
            next.undoKeys = Array.from(new Set([...next.undoKeys, keyToAdd]));
          } else if (listeningFor === 'repeat') {
            next.repeatScoreKeys = Array.from(new Set([...next.repeatScoreKeys, keyToAdd]));
          }
          return next;
        });
        setListeningFor(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, listeningFor]);

  if (!isOpen) return null;

  const handleApplyPreset = (key: string) => {
    setSelectedPreset(key);
    const newMap = DEFAULT_KEY_PRESETS[key].mapping;
    setMapping(newMap);
  };

  const handleSave = () => {
    saveKeyMapping(mapping);
    onUpdateMapping(mapping);
    onClose();
  };

  const removeKey = (type: 'team1' | 'team2' | 'undo' | 'repeat', keyToRemove: string) => {
    setMapping(prev => {
      const next = { ...prev };
      if (type === 'team1') next.team1PointKeys = next.team1PointKeys.filter(k => k !== keyToRemove);
      if (type === 'team2') next.team2PointKeys = next.team2PointKeys.filter(k => k !== keyToRemove);
      if (type === 'undo') next.undoKeys = next.undoKeys.filter(k => k !== keyToRemove);
      if (type === 'repeat') next.repeatScoreKeys = next.repeatScoreKeys.filter(k => k !== keyToRemove);
      return next;
    });
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} className="glass-panel">
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={iconBadgeStyle}>
              <Bluetooth size={22} color="#00e676" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Pulsadores Bluetooth & Mandos</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Vincula anillos inteligentes, obturadores selfie o clickers de pista
              </p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Device Profiles Presets */}
        <div style={{ marginBottom: '20px' }}>
          <label style={sectionTitleStyle}>Perfiles Rápidos Compatibles</label>
          <div style={presetGridStyle}>
            {Object.entries(DEFAULT_KEY_PRESETS).map(([key, item]) => {
              const isSelected = selectedPreset === key;
              return (
                <div
                  key={key}
                  onClick={() => handleApplyPreset(key)}
                  style={{
                    ...presetCardStyle,
                    borderColor: isSelected ? 'var(--team1-primary)' : 'var(--border-subtle)',
                    background: isSelected ? 'rgba(0, 230, 118, 0.08)' : 'var(--bg-elevated)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--team1-primary)' : '#fff' }}>
                      {item.name}
                    </span>
                    {isSelected && <Check size={16} color="var(--team1-primary)" />}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Special Apple Watch Series 1 - Ultra Callout */}
          <div style={{
            marginTop: '12px',
            padding: '12px 14px',
            background: 'rgba(0, 176, 255, 0.08)',
            border: '1px solid rgba(0, 176, 255, 0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>⌚</span>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--team2-primary)' }}>
                ¿Cómo conectar Apple Watch (Serie 1 a Ultra) y Wear OS?
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              <strong>1.</strong> Activa el botón <strong>WATCH</strong> en la barra superior del marcador (inicia audio silencioso para mantener activo Safari en segundo plano).<br />
              <strong>2.</strong> En tu Apple Watch, abre la aplicación nativa <strong>"En Reproducción"</strong>.<br />
              <strong>3.</strong> Pulsa <strong>[⏮]</strong> para punto Pareja 1, <strong>[⏭]</strong> para punto Pareja 2 y <strong>[⏯]</strong> para Deshacer.<br />
              <em>Nota técnica: watchOS no soporta emulación de teclado Bluetooth HID directo, por lo que el estándar universal oficial de Apple es Media Session.</em>
            </p>
          </div>
        </div>

        {/* Live Hardware Listener Test Bench */}
        <div style={testBenchCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Radio size={16} color="#00b0ff" className="pulsing-dot" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--team2-primary)' }}>
              Monitor de Señal en Tiempo Real
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Presiona cualquier botón en tu control Bluetooth para comprobar si el navegador lo detecta:
          </p>
          <div style={keyDetectedBox}>
            {lastDetectedKey ? (
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-primary)', fontWeight: 800 }}>
                Código detectado: {lastDetectedKey}
              </span>
            ) : (
              <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                Esperando pulsación de tecla o botón...
              </span>
            )}
          </div>
        </div>

        {/* Key Customizer / Calibrator */}
        <div style={{ marginBottom: '24px' }}>
          <label style={sectionTitleStyle}>Asignación de Comandos</label>
          
          <div style={mappingRowStyle}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--team1-primary)', fontSize: '0.9rem' }}>
                +1 Punto Pareja 1
              </div>
              <div style={keyChipsWrapper}>
                {mapping.team1PointKeys.map(k => (
                  <span key={k} style={keyChipStyle}>
                    {k}
                    <button onClick={() => removeKey('team1', k)} style={removeChipBtn}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setListeningFor('team1')}
              style={{
                ...calibrateBtnStyle,
                background: listeningFor === 'team1' ? 'var(--team1-primary)' : 'var(--bg-elevated)',
                color: listeningFor === 'team1' ? '#000' : '#fff'
              }}
            >
              {listeningFor === 'team1' ? 'Presiona botón...' : '+ Asignar'}
            </button>
          </div>

          <div style={mappingRowStyle}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--team2-primary)', fontSize: '0.9rem' }}>
                +1 Punto Pareja 2
              </div>
              <div style={keyChipsWrapper}>
                {mapping.team2PointKeys.map(k => (
                  <span key={k} style={keyChipStyle}>
                    {k}
                    <button onClick={() => removeKey('team2', k)} style={removeChipBtn}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setListeningFor('team2')}
              style={{
                ...calibrateBtnStyle,
                background: listeningFor === 'team2' ? 'var(--team2-primary)' : 'var(--bg-elevated)',
                color: listeningFor === 'team2' ? '#000' : '#fff'
              }}
            >
              {listeningFor === 'team2' ? 'Presiona botón...' : '+ Asignar'}
            </button>
          </div>

          <div style={mappingRowStyle}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--danger-primary)', fontSize: '0.9rem' }}>
                Deshacer Último Punto (Undo)
              </div>
              <div style={keyChipsWrapper}>
                {mapping.undoKeys.map(k => (
                  <span key={k} style={keyChipStyle}>
                    {k}
                    <button onClick={() => removeKey('undo', k)} style={removeChipBtn}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setListeningFor('undo')}
              style={{
                ...calibrateBtnStyle,
                background: listeningFor === 'undo' ? 'var(--danger-primary)' : 'var(--bg-elevated)',
                color: listeningFor === 'undo' ? '#fff' : '#fff'
              }}
            >
              {listeningFor === 'undo' ? 'Presiona botón...' : '+ Asignar'}
            </button>
          </div>
        </div>

        {/* Tip Box */}
        <div style={tipBoxStyle}>
          <ShieldAlert size={16} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            <strong>Recomendación en Pista:</strong> Vincula tu obturador o anillo por el menú Bluetooth nativo de tu teléfono (iOS o Android). Una vez enlazado, PadelMatch responderá directamente a los clics sin instalar apps externas.
          </p>
        </div>

        {/* Footer actions */}
        <div style={footerStyle}>
          <button onClick={onClose} style={secondaryBtnStyle}>
            Cancelar
          </button>
          <button onClick={handleSave} style={primaryBtnStyle}>
            Guardar Configuración
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
  maxWidth: '560px',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#0d1424',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
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
  background: 'rgba(0, 230, 118, 0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(0, 230, 118, 0.3)'
};

const closeBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.05)',
  color: 'var(--text-muted)'
};

const sectionTitleStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  marginBottom: '10px'
};

const presetGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '10px'
};

const presetCardStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const testBenchCard: React.CSSProperties = {
  background: 'rgba(0, 176, 255, 0.06)',
  border: '1px solid rgba(0, 176, 255, 0.25)',
  borderRadius: '14px',
  padding: '14px',
  marginBottom: '20px'
};

const keyDetectedBox: React.CSSProperties = {
  marginTop: '10px',
  padding: '8px 12px',
  background: '#070a12',
  borderRadius: '8px',
  textAlign: 'center',
  border: '1px dashed rgba(255, 255, 255, 0.15)'
};

const mappingRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 14px',
  background: 'var(--bg-elevated)',
  borderRadius: '12px',
  marginBottom: '8px',
  border: '1px solid var(--border-subtle)'
};

const keyChipsWrapper: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: '6px'
};

const keyChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  background: '#131b2e',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontFamily: 'var(--font-mono)',
  color: '#e2e8f0'
};

const removeChipBtn: React.CSSProperties = {
  fontSize: '1rem',
  lineHeight: '1',
  color: 'var(--text-dim)',
  padding: '0 2px'
};

const calibrateBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 700,
  border: '1px solid var(--border-subtle)',
  whiteSpace: 'nowrap'
};

const tipBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '12px 14px',
  background: 'rgba(255, 214, 0, 0.08)',
  border: '1px solid rgba(255, 214, 0, 0.25)',
  borderRadius: '12px',
  marginBottom: '20px'
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px'
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: '10px',
  background: 'rgba(255, 255, 255, 0.06)',
  color: '#cbd5e1',
  fontWeight: 600,
  fontSize: '0.9rem'
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 22px',
  borderRadius: '10px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  fontWeight: 800,
  fontSize: '0.9rem',
  boxShadow: '0 4px 14px var(--team1-glow)'
};
