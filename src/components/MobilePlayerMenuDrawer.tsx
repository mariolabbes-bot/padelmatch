import React from 'react';
import type { UserSession } from '../services/authService';
import type { AppTheme } from '../services/themeService';
import { getEloTier } from '../engine/eloEngine';
import { isImageAvatar } from '../utils/imageOptimizer';
import { 
  X, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Crown, 
  Watch, 
  LogOut, 
  ChevronRight, 
  Sparkles,
  Award
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  isAdmin: boolean;
  isSubscribed: boolean;
  theme: AppTheme;
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onOpenPrivacy: () => void;
  onOpenSubscription?: () => void;
  onOpenBluetoothModal: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
}

export const MobilePlayerMenuDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  isAdmin,
  isSubscribed,
  theme,
  onToggleTheme,
  onOpenProfile,
  onOpenPrivacy,
  onOpenSubscription,
  onOpenBluetoothModal,
  onOpenAdmin,
  onLogout
}) => {
  if (!isOpen) return null;

  const eloTier = getEloTier(currentUser.elo || 1400);

  return (
    <div 
      style={backdropStyle} 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-menu-title"
    >
      <div 
        style={sheetContainerStyle} 
        className="glass-panel"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag Handle Indicator */}
        <div style={dragHandleWrapStyle}>
          <div style={dragHandlePillStyle} />
        </div>

        {/* Header Bar */}
        <div style={sheetHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--team1-primary)" />
            <h2 id="player-menu-title" style={titleStyle}>Menú del Jugador</h2>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={closeBtnStyle}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={sheetBodyStyle}>
          {/* Athlete Profile Highlight Card */}
          <div 
            onClick={() => {
              onClose();
              onOpenProfile();
            }}
            style={profileCardStyle}
            className="apple-card"
            title="Abrir ficha oficial de jugador"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
              <div style={{
                ...avatarWrapperStyle,
                borderColor: eloTier.color,
                boxShadow: `0 0 12px ${eloTier.color}33`
              }}>
                {currentUser.avatar ? (
                  isImageAvatar(currentUser.avatar) ? (
                    <img src={currentUser.avatar} alt={currentUser.name} style={avatarImgStyle} />
                  ) : (
                    <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{currentUser.avatar}</span>
                  )
                ) : (
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={athleteNameStyle}>{currentUser.name}</span>
                  <span className="badge badge-team1" style={{ fontSize: '0.62rem' }}>
                    {currentUser.category} Cat
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: eloTier.color }}>
                    {eloTier.label} • {currentUser.elo || 1400} ELO
                  </span>
                </div>
              </div>
            </div>

            <div style={profileActionArrow}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>Ver Perfil</span>
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>
          </div>

          {/* Quick Actions Navigation List */}
          <div style={menuListStyle}>
            {/* 1. Theme Switcher */}
            <button
              type="button"
              onClick={onToggleTheme}
              style={menuItemBtnStyle}
            >
              <div style={menuItemIconCircle}>
                {theme === 'day' ? <Sun size={18} color="var(--gold-primary)" /> : <Moon size={18} color="var(--team2-primary)" />}
              </div>
              <div style={menuItemTextWrap}>
                <div style={menuItemTitle}>Aspecto Visual de la App</div>
                <div style={menuItemSubtitle}>
                  {theme === 'day' ? 'Modo Luz Natural (Social Claro)' : 'Modo Estadio Nocturno (Oscuro)'}
                </div>
              </div>
              <span style={menuPillBadgeStyle}>
                {theme === 'day' ? '☀️ Claro' : '🌙 Noche'}
              </span>
            </button>

            {/* 2. Privacy & Data Governance */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPrivacy();
              }}
              style={menuItemBtnStyle}
            >
              <div style={{ ...menuItemIconCircle, background: 'rgba(0, 230, 118, 0.12)' }}>
                <ShieldCheck size={18} color="var(--team1-primary)" />
              </div>
              <div style={menuItemTextWrap}>
                <div style={menuItemTitle}>Privacidad & Gobernanza de Datos</div>
                <div style={menuItemSubtitle}>Controla qué ven tus partners vs. público</div>
              </div>
              <ChevronRight size={16} color="var(--text-dim)" />
            </button>

            {/* 3. Subscription & PRO Status */}
            {onOpenSubscription && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSubscription();
                }}
                style={menuItemBtnStyle}
              >
                <div style={{ ...menuItemIconCircle, background: 'rgba(255, 214, 0, 0.12)' }}>
                  <Crown size={18} color="var(--gold-primary)" />
                </div>
                <div style={menuItemTextWrap}>
                  <div style={menuItemTitle}>Membresía & Beneficios PRO</div>
                  <div style={menuItemSubtitle}>Historial ilimitado, estadísticas y partners VIP</div>
                </div>
                <span style={{
                  ...menuPillBadgeStyle,
                  background: isSubscribed ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 214, 0, 0.15)',
                  color: isSubscribed ? 'var(--team1-primary)' : 'var(--gold-primary)'
                }}>
                  {isSubscribed ? 'Activo PRO 🏆' : 'Ver Planes'}
                </span>
              </button>
            )}

            {/* 4. Smartwatch & Bluetooth Sensors */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBluetoothModal();
              }}
              style={menuItemBtnStyle}
            >
              <div style={{ ...menuItemIconCircle, background: 'rgba(0, 176, 255, 0.12)' }}>
                <Watch size={18} color="var(--team2-primary)" />
              </div>
              <div style={menuItemTextWrap}>
                <div style={menuItemTitle}>Smartwatch & Sensores en Cancha</div>
                <div style={menuItemSubtitle}>Calibrar Apple Watch o Galaxy Watch</div>
              </div>
              <ChevronRight size={16} color="var(--text-dim)" />
            </button>

            {/* 5. Complete Athlete Profile Details */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              style={menuItemBtnStyle}
            >
              <div style={{ ...menuItemIconCircle, background: 'rgba(124, 77, 255, 0.12)' }}>
                <Award size={18} color="#7c4dff" />
              </div>
              <div style={menuItemTextWrap}>
                <div style={menuItemTitle}>Editar Ficha Oficial & Posición</div>
                <div style={menuItemSubtitle}>Drive / Revés, mano diestra/zurda y club</div>
              </div>
              <ChevronRight size={16} color="var(--text-dim)" />
            </button>

            {/* 6. Admin Control Panel (Only Authorized Admin) */}
            {isAdmin && onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                style={{
                  ...menuItemBtnStyle,
                  background: 'rgba(255, 214, 0, 0.05)',
                  borderColor: 'rgba(255, 214, 0, 0.25)'
                }}
              >
                <div style={{ ...menuItemIconCircle, background: 'rgba(255, 214, 0, 0.2)' }}>
                  <ShieldCheck size={18} color="var(--gold-primary)" />
                </div>
                <div style={menuItemTextWrap}>
                  <div style={{ ...menuItemTitle, color: 'var(--gold-primary)' }}>Panel de Administración Central</div>
                  <div style={menuItemSubtitle}>Métricas, usuarios registrados y referidos</div>
                </div>
                <span style={{ ...menuPillBadgeStyle, background: 'var(--gold-primary)', color: '#000' }}>
                  ADMIN
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Sticky Footer with Clean Logout */}
        <div style={sheetFooterStyle}>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            style={logoutFullBtnStyle}
          >
            <LogOut size={16} />
            <span>Cerrar Sesión Segura</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// STYLES
// ==========================================

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.65)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  zIndex: 10000,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  animation: 'fadeIn 0.2s ease-out'
};

const sheetContainerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '520px',
  margin: '0 auto',
  background: 'var(--bg-glass, rgba(255, 255, 255, 0.95))',
  borderTopLeftRadius: '24px',
  borderTopRightRadius: '24px',
  borderTop: '1px solid var(--border-medium)',
  boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '85vh',
  overflow: 'hidden',
  animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
};

const dragHandleWrapStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '10px 0 4px',
  cursor: 'pointer'
};

const dragHandlePillStyle: React.CSSProperties = {
  width: '38px',
  height: '4px',
  borderRadius: '2px',
  background: 'rgba(120, 120, 120, 0.3)'
};

const sheetHeaderStyle: React.CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 18px 12px',
  borderBottom: '1px solid var(--border-subtle)'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 900,
  margin: 0,
  color: 'var(--text-main)',
  letterSpacing: '-0.02em'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'rgba(120, 120, 120, 0.1)',
  border: 'none',
  borderRadius: '50%',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-muted)',
  cursor: 'pointer'
};

const sheetBodyStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px'
};

const profileCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px',
  borderRadius: '16px',
  background: 'rgba(0, 230, 118, 0.06)',
  border: '1px solid rgba(0, 230, 118, 0.2)',
  cursor: 'pointer',
  transition: 'transform 0.15s ease'
};

const avatarWrapperStyle: React.CSSProperties = {
  width: '46px',
  height: '46px',
  borderRadius: '50%',
  border: '2px solid var(--team1-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.15)',
  overflow: 'hidden',
  flexShrink: 0
};

const avatarImgStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const athleteNameStyle: React.CSSProperties = {
  fontSize: '0.96rem',
  fontWeight: 900,
  color: 'var(--text-main)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const profileActionArrow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  flexShrink: 0
};

const menuListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const menuItemBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 14px',
  borderRadius: '14px',
  background: 'rgba(120, 120, 120, 0.05)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.15s ease'
};

const menuItemIconCircle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  background: 'rgba(120, 120, 120, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const menuItemTextWrap: React.CSSProperties = {
  flex: 1,
  minWidth: 0
};

const menuItemTitle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 800,
  color: 'var(--text-main)'
};

const menuItemSubtitle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--text-muted)',
  marginTop: '1px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const menuPillBadgeStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 800,
  padding: '3px 8px',
  borderRadius: '8px',
  background: 'rgba(120, 120, 120, 0.12)',
  color: 'var(--text-main)',
  flexShrink: 0
};

const sheetFooterStyle: React.CSSProperties = {
  flexShrink: 0,
  padding: '12px 18px',
  borderTop: '1px solid var(--border-subtle)',
  background: 'rgba(0, 0, 0, 0.02)'
};

const logoutFullBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 16px',
  borderRadius: '12px',
  background: 'rgba(255, 61, 113, 0.08)',
  border: '1px solid rgba(255, 61, 113, 0.25)',
  color: 'var(--danger-primary)',
  fontSize: '0.85rem',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  cursor: 'pointer'
};
