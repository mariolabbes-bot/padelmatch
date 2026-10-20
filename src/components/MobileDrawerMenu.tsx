import React, { useState, useEffect } from 'react';
import { 
  X, 
  Watch, 
  Bluetooth, 
  Volume2, 
  Users, 
  Tv, 
  Trophy, 
  RotateCcw, 
  LogOut, 
  Maximize2,
  Minimize2,
  Sparkles,
  Sliders,
  QrCode,
  Pause,
  Play,
  Clock,
  Sun,
  Moon,
  Crown
} from 'lucide-react';
import type { UserSession } from '../services/authService';
import { themeService, type AppTheme } from '../services/themeService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  isSmartwatchActive: boolean;
  onToggleSmartwatch: () => void;
  onOpenBluetoothModal: () => void;
  onOpenAudioModal: () => void;
  onOpenCourtAlignment: () => void;
  onOpenTvMode: () => void;
  onOpenCommunity: () => void;
  onOpenSubscriptionModal?: () => void;
  onResetMatch: () => void;
  onNewMatch: () => void;
  onLogout: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenSetupModal?: () => void;
  onOpenQrModal?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  onOpenFinishEarlyModal?: () => void;
}

export const MobileDrawerMenu: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  isSmartwatchActive,
  onToggleSmartwatch,
  onOpenBluetoothModal,
  onOpenAudioModal,
  onOpenCourtAlignment,
  onOpenTvMode,
  onOpenCommunity,
  onOpenSubscriptionModal,
  onResetMatch,
  onNewMatch,
  onLogout,
  isFullscreen,
  onToggleFullscreen,
  onOpenSetupModal,
  onOpenQrModal,
  isPaused,
  onTogglePause,
  onOpenFinishEarlyModal
}) => {
  const [theme, setTheme] = useState<AppTheme>(themeService.getTheme());

  useEffect(() => {
    return themeService.subscribe(setTheme);
  }, []);

  if (!isOpen) return null;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <aside 
        style={drawerStyle} 
        className="glass-panel" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/logo.png" 
              alt="PadelMatch Logo" 
              style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255, 255, 255, 0.2)' }} 
            />
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Menú de Control en Cancha
              </div>
            </div>
          </div>

          <button onClick={onClose} style={closeBtnStyle} aria-label="Cerrar menú">
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* User Card */}
        {currentUser && (
          <div style={userCardStyle}>
            <div style={avatarStyle}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                <span>Cat: {currentUser.category}</span>
                <span>•</span>
                <span style={{ color: 'var(--gold-primary)' }}>ELO: {currentUser.elo}</span>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items List */}
        {/* Menu Items List */}
        <div style={menuListStyle}>
          {/* Day / Night High Contrast Display Toggle */}
          <div style={{
            ...smartwatchBannerStyle,
            background: theme === 'day' ? 'rgba(255, 214, 0, 0.08)' : 'rgba(0, 176, 255, 0.08)',
            borderColor: theme === 'day' ? 'rgba(255, 214, 0, 0.3)' : 'rgba(0, 176, 255, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: theme === 'day' ? 'rgba(255, 214, 0, 0.2)' : 'rgba(0, 176, 255, 0.2)',
                color: theme === 'day' ? 'var(--gold-primary)' : 'var(--team2-primary)'
              }}>
                {theme === 'day' ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {theme === 'day' ? 'Modo Día (Luz Solar)' : 'Modo Noche (Estadio)'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {theme === 'day' ? 'Fondo claro anti-reflejo' : 'Contraste oscuro neón'}
                </div>
              </div>
            </div>

            <button 
              onClick={() => themeService.toggleTheme()}
              style={{
                ...switchToggleBtnStyle,
                background: theme === 'day' ? 'var(--gold-primary)' : 'var(--team2-primary)',
                color: '#070a10',
                cursor: 'pointer'
              }}
            >
              {theme === 'day' ? 'CAMBIAR A NOCHE' : 'CAMBIAR A DÍA'}
            </button>
          </div>

          {/* Smartwatch / Apple Watch Feature Toggle */}
          <div style={smartwatchBannerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: isSmartwatchActive ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: isSmartwatchActive ? 'var(--team1-primary)' : 'var(--text-muted)'
              }}>
                <Watch size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Modo Apple Watch / Reloj
                </div>
                <div style={{ fontSize: '0.7rem', color: isSmartwatchActive ? 'var(--team1-primary)' : 'var(--text-muted)' }}>
                  {isSmartwatchActive ? 'Activo ("En Reproducción")' : 'Control desde la muñeca'}
                </div>
              </div>
            </div>

            <button 
              onClick={onToggleSmartwatch}
              style={{
                ...switchToggleBtnStyle,
                background: isSmartwatchActive ? 'var(--team1-primary)' : 'var(--bg-elevated)',
                color: isSmartwatchActive ? '#070a10' : 'var(--text-muted)'
              }}
            >
              {isSmartwatchActive ? 'ACTIVADO' : 'ACTIVAR'}
            </button>
          </div>

          <div style={dividerStyle} />

          {/* Court Views */}
          <button onClick={() => { onOpenCourtAlignment(); onClose(); }} style={menuItemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} color="var(--team1-primary)" />
              <span>Alineación Cancha 2D</span>
            </div>
            <span style={pillTagStyle}>Posiciones</span>
          </button>

          <button onClick={() => { onOpenTvMode(); onClose(); }} style={menuItemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Tv size={18} color="var(--team2-primary)" />
              <span>Pantalla Gigante (Modo TV)</span>
            </div>
            <span style={{ ...pillTagStyle, color: 'var(--team2-primary)' }}>B2B</span>
          </button>

          <button onClick={() => { onOpenCommunity(); onClose(); }} style={menuItemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={18} color="var(--gold-primary)" />
              <span>Ranking ELO & Comunidad</span>
            </div>
            <span style={{ ...pillTagStyle, color: 'var(--gold-primary)' }}>Tabla</span>
          </button>

          {onOpenSubscriptionModal && (
            <button 
              onClick={() => { onOpenSubscriptionModal(); onClose(); }} 
              style={{
                ...menuItemStyle,
                background: 'rgba(255, 214, 0, 0.08)',
                border: '1px solid rgba(255, 214, 0, 0.25)',
                borderRadius: '8px',
                color: 'var(--gold-primary)',
                margin: '4px 0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Crown size={18} color="var(--gold-primary)" />
                <span style={{ fontWeight: 800 }}>Suscripción & Planes Pro</span>
              </div>
              <span style={{ ...pillTagStyle, color: 'var(--gold-primary)', borderColor: 'rgba(255, 214, 0, 0.5)' }}>
                DESDE $1.665/M
              </span>
            </button>
          )}

          <div style={dividerStyle} />

          {/* Settings & Hardware */}
          <button onClick={() => { onOpenBluetoothModal(); onClose(); }} style={menuItemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bluetooth size={18} color="var(--team1-primary)" />
              <span>Calibrar Pulsador / Anillo</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Bluetooth</span>
          </button>

          <button onClick={() => { onOpenAudioModal(); onClose(); }} style={menuItemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Volume2 size={18} color="var(--text-muted)" />
              <span>Ajustes de Voz y Arbitraje</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>TTS</span>
          </button>

          {onOpenSetupModal && (
            <button onClick={() => { onOpenSetupModal(); onClose(); }} style={menuItemStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sliders size={18} color="var(--gold-primary)" />
                <span>Reglas y Formato del Partido</span>
              </div>
            </button>
          )}

          {onOpenQrModal && (
            <button onClick={() => { onOpenQrModal(); onClose(); }} style={menuItemStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <QrCode size={18} color="var(--team1-primary)" />
                <span>Compartir Código QR</span>
              </div>
            </button>
          )}

          <button onClick={onToggleFullscreen} style={menuItemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              <span>{isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}</span>
            </div>
          </button>

          <div style={dividerStyle} />

          {/* Match Actions */}
          {onTogglePause && (
            <button onClick={() => { onTogglePause(); onClose(); }} style={menuItemStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: isPaused ? 'var(--gold-primary)' : '#fff' }}>
                {isPaused ? <Play size={18} color="var(--gold-primary)" /> : <Pause size={18} color="var(--gold-primary)" />}
                <span>{isPaused ? 'Reanudar Partido' : 'Pausar Partido'}</span>
              </div>
              <span style={{ ...pillTagStyle, color: isPaused ? 'var(--gold-primary)' : 'var(--text-dim)', borderColor: isPaused ? 'var(--gold-primary)' : 'var(--border-subtle)' }}>
                {isPaused ? 'EN PAUSA' : 'CONTROL'}
              </span>
            </button>
          )}

          {onOpenFinishEarlyModal && (
            <button onClick={() => { onOpenFinishEarlyModal(); onClose(); }} style={{ ...menuItemStyle, color: 'var(--gold-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} color="var(--gold-primary)" />
                <span>Finalizar Partido Inconcluso</span>
              </div>
              <span style={{ ...pillTagStyle, color: 'var(--gold-primary)', borderColor: 'rgba(255, 214, 0, 0.4)' }}>
                Tiempo Cancha
              </span>
            </button>
          )}

          <button onClick={() => { onResetMatch(); onClose(); }} style={menuItemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
              <RotateCcw size={18} />
              <span>Reiniciar Marcador a 0-0</span>
            </div>
          </button>

          <button onClick={() => { onNewMatch(); onClose(); }} style={menuItemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--team1-primary)' }}>
              <Sparkles size={18} />
              <span>Crear Nuevo Partido</span>
            </div>
          </button>

          {currentUser && (
            <button onClick={() => { onLogout(); onClose(); }} style={{ ...menuItemStyle, color: 'var(--danger-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </div>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};

// Styles
const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(8px)',
  zIndex: 9999,
  display: 'flex',
  justifyContent: 'flex-end',
  animation: 'fadeIn 0.2s ease-out'
};

const drawerStyle: React.CSSProperties = {
  width: '85vw',
  maxWidth: '360px',
  height: '100dvh',
  background: 'var(--bg-card)',
  borderLeft: '1px solid var(--border-medium)',
  paddingTop: 'var(--safe-top)',
  paddingBottom: 'var(--safe-bottom)',
  paddingLeft: 'var(--safe-left)',
  paddingRight: 'var(--safe-right)',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  boxShadow: '-10px 0 30px rgba(0,0,0,0.8)',
  boxSizing: 'border-box'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '16px',
  borderBottom: '1px solid var(--border-subtle)',
  marginBottom: '16px'
};

const closeBtnStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '8px',
  background: 'var(--bg-elevated)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const userCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  background: 'var(--bg-elevated)',
  borderRadius: 'var(--radius-md)',
  marginBottom: '16px',
  border: '1px solid var(--border-subtle)'
};

const avatarStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  fontWeight: 900,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.95rem'
};

const menuListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  color: 'var(--text-main)',
  fontSize: '0.9rem',
  fontWeight: 600,
  textAlign: 'left',
  transition: 'background var(--transition-fast)'
};

const smartwatchBannerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px',
  background: 'rgba(0, 230, 118, 0.08)',
  border: '1px solid rgba(0, 230, 118, 0.25)',
  borderRadius: 'var(--radius-md)',
  marginBottom: '8px'
};

const switchToggleBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 'var(--radius-full)',
  fontSize: '0.75rem',
  fontWeight: 800,
  letterSpacing: '0.04em'
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  background: 'var(--border-subtle)',
  margin: '8px 0'
};

const pillTagStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  background: 'rgba(255, 255, 255, 0.06)',
  color: 'var(--text-muted)'
};
