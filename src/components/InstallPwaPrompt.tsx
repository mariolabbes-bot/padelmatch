import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Share, 
  PlusSquare, 
  X, 
  Smartphone,
  ShieldCheck
} from 'lucide-react';

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if app is already running in standalone (installed) mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Never show if already running from home screen
    }

    // 2. Check if user dismissed prompt recently (within 48 hours)
    const dismissedTime = localStorage.getItem('padelmatch_pwa_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime) < 1000 * 60 * 60 * 48) {
      return;
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isAppleDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);

    if (isAppleDevice && isSafari) {
      setIsIOS(true);
      // Small timeout so user sees the page first before the installation banner pops up
      const timer = setTimeout(() => setShowPrompt(true), 2500);
      return () => clearTimeout(timer);
    }

    // 4. Android / Chrome / Desktop PWA prompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('padelmatch_pwa_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div style={floatingContainerStyle}>
      <div style={promptCardStyle} className="glass-panel">
        {/* Header Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={appIconBadge}>
              <Smartphone size={20} color="var(--team1-primary)" />
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--gold-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                ACCESO DIRECTO OFICIAL
              </span>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', margin: '2px 0 0' }}>
                Instalar PadelMatch
              </h4>
            </div>
          </div>

          <button onClick={handleDismiss} style={closeIconBtnStyle} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {isIOS ? (
          /* iOS Safari Specific Guide */
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '6px 0 12px', lineHeight: 1.35 }}>
              Agrega la app a tu pantalla de inicio para habilitar <strong>notificaciones push</strong>, pantalla completa sin barras y arbitraje por voz en cancha:
            </p>

            <div style={iosStepsBox}>
              <div style={iosStepRow}>
                <div style={stepNumberBadge}>1</div>
                <div style={{ flex: 1, fontSize: '0.82rem', color: '#e2e8f0' }}>
                  Toca el botón <strong>Compartir</strong> en Safari abajo <Share size={15} color="#38bdf8" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />
                </div>
              </div>

              <div style={iosStepRow}>
                <div style={stepNumberBadge}>2</div>
                <div style={{ flex: 1, fontSize: '0.82rem', color: '#e2e8f0' }}>
                  Selecciona <strong>"Agregar a pantalla de inicio"</strong> <PlusSquare size={15} color="var(--gold-primary)" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />
                </div>
              </div>
            </div>

            <button onClick={handleDismiss} style={understoodBtnStyle}>
              <ShieldCheck size={16} />
              <span>¡Entendido! Lo haré ahora</span>
            </button>
          </div>
        ) : (
          /* Android / Chrome Native 1-Click Install */
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '6px 0 14px', lineHeight: 1.35 }}>
              Instala la app en tu teléfono con 1 solo toque. Funciona sin conexión, pantalla completa y te avisa cuando <strong>falta 1 jugador</strong> en tu club.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleInstallClick} style={primaryInstallBtnStyle}>
                <Download size={16} />
                <span>Instalar App en Teléfono</span>
              </button>

              <button onClick={handleDismiss} style={secondaryDismissBtnStyle}>
                <span>Ahora no</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const floatingContainerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 'calc(var(--safe-bottom) + 16px)',
  left: '16px',
  right: '16px',
  zIndex: 9999,
  display: 'flex',
  justifyContent: 'center',
  pointerEvents: 'none',
  animation: 'slideUp 0.35s ease-out'
};

const promptCardStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  width: '100%',
  maxWidth: '440px',
  background: '#0d1527',
  border: '1px solid rgba(0, 230, 118, 0.4)',
  borderRadius: '20px',
  padding: '18px 20px',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 230, 118, 0.15)'
};

const appIconBadge: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  background: 'rgba(0, 230, 118, 0.12)',
  border: '1px solid rgba(0, 230, 118, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const closeIconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '4px'
};

const primaryInstallBtnStyle: React.CSSProperties = {
  flex: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px 14px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  borderRadius: '12px',
  fontWeight: 900,
  fontSize: '0.88rem',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 14px var(--team1-glow)'
};

const secondaryDismissBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  background: 'var(--bg-elevated)',
  color: 'var(--text-muted)',
  borderRadius: '12px',
  fontWeight: 700,
  fontSize: '0.85rem',
  border: '1px solid var(--border-subtle)',
  cursor: 'pointer'
};

const iosStepsBox: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  borderRadius: '12px',
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '12px',
  border: '1px solid var(--border-subtle)'
};

const iosStepRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const stepNumberBadge: React.CSSProperties = {
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.1)',
  color: '#fff',
  fontSize: '0.75rem',
  fontWeight: 900,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const understoodBtnStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px',
  background: 'var(--bg-elevated)',
  color: 'var(--team1-primary)',
  borderRadius: '12px',
  fontWeight: 800,
  fontSize: '0.88rem',
  border: '1px solid var(--team1-primary)',
  cursor: 'pointer'
};
