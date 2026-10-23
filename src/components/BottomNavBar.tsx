import React from 'react';
import type { AppViewMode } from '../types/padel';
import { 
  Home, 
  Users, 
  Play, 
  Trophy, 
  Menu
} from 'lucide-react';

interface Props {
  currentView: AppViewMode;
  onNavigate: (view: AppViewMode) => void;
  onOpenMenu: () => void;
  onQuickStartMatch: () => void;
}

export const BottomNavBar: React.FC<Props> = ({
  currentView,
  onNavigate,
  onOpenMenu,
  onQuickStartMatch
}) => {
  // Hide on auth screen, court tv mode, live scoreboard or admin to keep focus
  if (currentView === 'auth' || currentView === 'court_tv' || currentView === 'scoreboard' || currentView === 'admin') {
    return null;
  }

  return (
    <nav style={navContainerStyle} className="glass-panel" aria-label="Navegación principal">
      <div style={innerNavGrid}>
        {/* 1. Dashboard / Inicio */}
        <button
          type="button"
          onClick={() => onNavigate('host_dashboard')}
          style={{
            ...navItemStyle,
            color: currentView === 'host_dashboard' ? 'var(--team1-primary)' : 'var(--text-muted)'
          }}
          aria-label="Ir al Inicio"
        >
          <Home size={20} />
          <span style={labelStyle}>Inicio</span>
        </button>

        {/* 2. Grupos de Pádel (Convocatorias y Múltiplos de 4) */}
        <button
          type="button"
          onClick={() => onNavigate('groups')}
          style={{
            ...navItemStyle,
            color: currentView === 'groups' ? 'var(--team1-primary)' : 'var(--text-muted)'
          }}
          aria-label="Ver Grupos y Partidos Abiertos"
        >
          <Users size={20} />
          <span style={labelStyle}>Grupos</span>
        </button>

        {/* 3. HERO CENTRAL BUTTON: JUGAR PARTIDO EN CANCHA */}
        <div style={heroButtonWrapper}>
          <button
            type="button"
            onClick={onQuickStartMatch}
            style={heroButtonStyle}
            title="Iniciar o Configurar Partido en Cancha"
            aria-label="Iniciar Partido en Cancha"
          >
            <div style={heroIconGlow}>
              <Play size={24} fill="#070a10" color="#070a10" style={{ marginLeft: '3px' }} />
            </div>
            <span style={heroLabelStyle}>EN CANCHA</span>
          </button>
        </div>

        {/* 4. Ranking & ELO */}
        <button
          type="button"
          onClick={() => onNavigate('community')}
          style={{
            ...navItemStyle,
            color: currentView === 'community' ? 'var(--gold-primary)' : 'var(--text-muted)'
          }}
          aria-label="Ranking Oficial ELO"
        >
          <Trophy size={20} />
          <span style={labelStyle}>Ranking</span>
        </button>

        {/* 5. Tercer Tiempo / Menú General */}
        <button
          type="button"
          onClick={onOpenMenu}
          style={{
            ...navItemStyle,
            color: 'var(--text-muted)'
          }}
          aria-label="Abrir Menú de Control y Opciones"
        >
          <Menu size={20} />
          <span style={labelStyle}>Menú</span>
        </button>
      </div>
    </nav>
  );
};

// Styles
const navContainerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 900,
  background: 'var(--bg-glass)',
  borderTop: '1px solid var(--border-medium)',
  paddingTop: '6px',
  paddingBottom: 'calc(var(--safe-bottom) + 4px)',
  paddingLeft: 'var(--safe-left)',
  paddingRight: 'var(--safe-right)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)'
};

const innerNavGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr auto 1fr 1fr',
  alignItems: 'center',
  maxWidth: '540px',
  margin: '0 auto',
  position: 'relative'
};

const navItemStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3px',
  padding: '6px 4px',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.02em'
};

const heroButtonWrapper: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  top: '-14px',
  padding: '0 8px'
};

const heroButtonStyle: React.CSSProperties = {
  width: '58px',
  height: '58px',
  borderRadius: '50%',
  background: 'var(--team1-gradient)',
  border: '3px solid var(--bg-card)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 0 25px var(--team1-glow), 0 4px 15px rgba(0,0,0,0.5)',
  transition: 'transform var(--transition-bounce)'
};

const heroIconGlow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const heroLabelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '-16px',
  fontSize: '0.62rem',
  fontWeight: 900,
  color: 'var(--team1-primary)',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap'
};
