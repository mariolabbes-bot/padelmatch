import React, { useState } from 'react';
import type { UserPrivacySettings, PrivacyScope } from '../types/padel';
import { authService, type UserSession } from '../services/authService';
import { 
  ShieldCheck, 
  Phone, 
  Trophy, 
  TrendingUp, 
  Activity, 
  UserCheck, 
  X, 
  Check, 
  Lock, 
  Users, 
  Globe 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onSaved?: (updatedSettings: UserPrivacySettings) => void;
}

export const PrivacySettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onSaved
}) => {
  const [settings, setSettings] = useState<UserPrivacySettings>(() => 
    authService.getPrivacySettings(currentUser)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const success = await authService.updatePrivacySettings(settings);
    setIsSaving(false);
    if (success) {
      setSavedSuccess(true);
      if (onSaved) onSaved(settings);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    }
  };

  const renderScopeSelector = (
    currentScope: PrivacyScope, 
    onChange: (scope: PrivacyScope) => void,
    includePublic = true
  ) => {
    return (
      <div style={segmentedControlStyle}>
        {includePublic && (
          <button
            type="button"
            onClick={() => onChange('public')}
            style={{
              ...segmentBtnStyle,
              background: currentScope === 'public' ? 'var(--team1-primary)' : 'transparent',
              color: currentScope === 'public' ? '#070a10' : 'var(--text-muted)',
              fontWeight: currentScope === 'public' ? 800 : 600
            }}
          >
            <Globe size={11} />
            <span>Público</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onChange('partners')}
          style={{
            ...segmentBtnStyle,
            background: currentScope === 'partners' ? 'var(--gold-primary)' : 'transparent',
            color: currentScope === 'partners' ? '#070a10' : 'var(--text-muted)',
            fontWeight: currentScope === 'partners' ? 800 : 600
          }}
        >
          <Users size={11} />
          <span>Solo Partners</span>
        </button>
        <button
          type="button"
          onClick={() => onChange('private')}
          style={{
            ...segmentBtnStyle,
            background: currentScope === 'private' ? 'rgba(255, 82, 82, 0.2)' : 'transparent',
            color: currentScope === 'private' ? '#ff5252' : 'var(--text-muted)',
            fontWeight: currentScope === 'private' ? 800 : 600
          }}
        >
          <Lock size={11} />
          <span>Privado</span>
        </button>
      </div>
    );
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalBoxStyle} className="glass-panel apple-card" onClick={e => e.stopPropagation()}>
        
        {/* 1. HEADER FIJO */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={shieldIconBox}>
              <ShieldCheck size={20} color="var(--gold-primary)" />
            </div>
            <div>
              <h2 style={modalTitleStyle}>Centro de Privacidad</h2>
              <p style={modalSubtitleStyle}>Controla quién tiene acceso a tus datos de pádel</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={closeBtnStyle}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. CUERPO SCROLLABLE */}
        <div style={bodyScrollableStyle}>
          <div style={infoBannerStyle}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.45 }}>
              Tus Partners son tus amigos de confianza en PadelMatch. Aquí decides qué información permanece pública para el circuito o restringida a tu círculo.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Opción 1: Teléfono y WhatsApp */}
            <div style={settingRowStyle}>
              <div style={settingLabelGroup}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={15} color="#25D366" />
                  <span style={settingTitleStyle}>Teléfono y WhatsApp Directo</span>
                </div>
                <span style={settingDescStyle}>
                  Permite que otros jugadores vean tu botón de contacto rápido por WhatsApp para armar partidos.
                </span>
              </div>
              {renderScopeSelector(settings.phoneVisibility, scope => 
                setSettings(prev => ({ ...prev, phoneVisibility: scope }))
              )}
            </div>

            {/* Opción 2: Historial y Tanteadores */}
            <div style={settingRowStyle}>
              <div style={settingLabelGroup}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={15} color="var(--gold-primary)" />
                  <span style={settingTitleStyle}>Historial de Partidos y Tanteadores</span>
                </div>
                <span style={settingDescStyle}>
                  Detalle de resultados set a set, rivales y clubes en los que has disputado partidos.
                </span>
              </div>
              {renderScopeSelector(settings.historyVisibility, scope => 
                setSettings(prev => ({ ...prev, historyVisibility: scope }))
              )}
            </div>

            {/* Opción 3: Gráfica de ELO */}
            <div style={settingRowStyle}>
              <div style={settingLabelGroup}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={15} color="var(--team1-primary)" />
                  <span style={settingTitleStyle}>Evolución de Rendimiento ELO</span>
                </div>
                <span style={settingDescStyle}>
                  Tu curva histórica de puntos ELO y ascenso entre categorías (1ª a 6ª).
                </span>
              </div>
              {renderScopeSelector(settings.eloVisibility, scope => 
                setSettings(prev => ({ ...prev, eloVisibility: scope }))
              )}
            </div>

            {/* Opción 4: Presencia en Cancha */}
            <div style={settingRowStyle}>
              <div style={settingLabelGroup}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={15} color="var(--team2-primary)" />
                  <span style={settingTitleStyle}>Estado "En Cancha Ahora"</span>
                </div>
                <span style={settingDescStyle}>
                  Muestra un indicador activo cuando estés disputando un partido en vivo en el marcador.
                </span>
              </div>
              {renderScopeSelector(
                settings.presenceVisibility, 
                scope => setSettings(prev => ({ ...prev, presenceVisibility: scope as 'partners' | 'private' })),
                false
              )}
            </div>

            {/* Opción 5: Convocatorias Abiertas */}
            <div style={settingRowStyle}>
              <div style={settingLabelGroup}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={15} color="#00E676" />
                  <span style={settingTitleStyle}>Recepción de Convocatorias</span>
                </div>
                <span style={settingDescStyle}>
                  Define quién puede invitarte directamente a partidos en múltiplos de 4.
                </span>
              </div>
              <div style={segmentedControlStyle}>
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, invitesAllowed: 'all' }))}
                  style={{
                    ...segmentBtnStyle,
                    background: settings.invitesAllowed === 'all' ? 'var(--team1-primary)' : 'transparent',
                    color: settings.invitesAllowed === 'all' ? '#070a10' : 'var(--text-muted)'
                  }}
                >
                  <Globe size={11} />
                  <span>Todos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, invitesAllowed: 'partners' }))}
                  style={{
                    ...segmentBtnStyle,
                    background: settings.invitesAllowed === 'partners' ? 'var(--gold-primary)' : 'transparent',
                    color: settings.invitesAllowed === 'partners' ? '#070a10' : 'var(--text-muted)'
                  }}
                >
                  <Users size={11} />
                  <span>Partners</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, invitesAllowed: 'none' }))}
                  style={{
                    ...segmentBtnStyle,
                    background: settings.invitesAllowed === 'none' ? 'rgba(255, 82, 82, 0.2)' : 'transparent',
                    color: settings.invitesAllowed === 'none' ? '#ff5252' : 'var(--text-muted)'
                  }}
                >
                  <Lock size={11} />
                  <span>Nadie</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* 3. FOOTER STICKY */}
        <div style={footerStyle}>
          <button
            type="button"
            onClick={onClose}
            style={cancelBtnStyle}
            disabled={isSaving}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              ...saveBtnStyle,
              background: savedSuccess ? '#00E676' : 'var(--gold-primary)',
              color: '#070a10'
            }}
          >
            {savedSuccess ? (
              <>
                <Check size={16} />
                <span>¡Guardado con éxito!</span>
              </>
            ) : isSaving ? (
              <span>Guardando...</span>
            ) : (
              <span>Guardar Privacidad</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

// --- STYLES ---

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(5, 7, 12, 0.85)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px',
  zIndex: 10000,
  overflowY: 'auto'
};

const modalBoxStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '520px',
  maxHeight: 'min(92vh, 760px)',
  margin: 'auto',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '24px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-card)',
  boxShadow: 'var(--shadow-lg)'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 24px',
  borderBottom: '1px solid var(--border-subtle)',
  background: 'var(--bg-glass)',
  backdropFilter: 'blur(12px)',
  flexShrink: 0
};

const shieldIconBox: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '12px',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid rgba(255, 214, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const modalTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.15rem',
  fontWeight: 900,
  color: 'var(--text-main)',
  letterSpacing: '-0.02em'
};

const modalSubtitleStyle: React.CSSProperties = {
  margin: '2px 0 0 0',
  fontSize: '0.75rem',
  color: 'var(--text-dim)'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.06)',
  border: 'none',
  color: 'var(--text-muted)',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const bodyScrollableStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  WebkitOverflowScrolling: 'touch',
  padding: '20px 24px'
};

const infoBannerStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderLeft: '4px solid var(--gold-primary)',
  borderRadius: '14px',
  padding: '12px 14px',
  marginBottom: '20px'
};

const settingRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  background: 'var(--bg-elevated)',
  padding: '14px',
  borderRadius: '16px',
  border: '1px solid var(--border-subtle)'
};

const settingLabelGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '3px'
};

const settingTitleStyle: React.CSSProperties = {
  fontSize: '0.86rem',
  fontWeight: 800,
  color: 'var(--text-main)'
};

const settingDescStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--text-dim)',
  lineHeight: 1.4
};

const segmentedControlStyle: React.CSSProperties = {
  display: 'flex',
  background: 'var(--bg-card)',
  padding: '3px',
  borderRadius: '10px',
  gap: '4px',
  border: '1px solid var(--border-subtle)'
};

const segmentBtnStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  padding: '7px 8px',
  borderRadius: '8px',
  fontSize: '0.72rem',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const footerStyle: React.CSSProperties = {
  position: 'sticky',
  bottom: 0,
  flexShrink: 0,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  padding: '16px 24px',
  borderTop: '1px solid var(--border-subtle)',
  background: 'var(--bg-card)',
  borderBottomLeftRadius: '24px',
  borderBottomRightRadius: '24px'
};

const cancelBtnStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  color: 'var(--text-muted)',
  padding: '10px 18px',
  borderRadius: '12px',
  fontSize: '0.82rem',
  fontWeight: 700,
  cursor: 'pointer'
};

const saveBtnStyle: React.CSSProperties = {
  border: 'none',
  padding: '10px 20px',
  borderRadius: '12px',
  fontSize: '0.85rem',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(255, 214, 0, 0.25)',
  transition: 'all 0.15s ease'
};
