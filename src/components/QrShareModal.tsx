import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, Users, X, Smartphone } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  courtName: string;
  team1Name: string;
  team2Name: string;
}

export const QrShareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  matchId,
  courtName,
  team1Name,
  team2Name
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://padelmatch.app';
  const joinUrl = `${origin}/#match=${matchId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} className="glass-panel">
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={iconBadgeStyle}>
              <QrCode size={22} color="var(--team2-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Código QR del Partido</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Autoinscripción de jugadores y transmisión en vivo a espectadores
              </p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* QR Display Card */}
        <div style={qrContainerStyle}>
          <div style={qrWrapperStyle}>
            <QRCodeSVG
              value={joinUrl}
              size={220}
              bgColor="#ffffff"
              fgColor="#070a12"
              level="H"
              includeMargin={true}
            />
          </div>
          
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <span className="badge badge-team2" style={{ marginBottom: '6px' }}>
              {courtName}
            </span>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
              {team1Name} <span style={{ color: 'var(--gold-primary)' }}>vs</span> {team2Name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              ID de Encuentro: {matchId}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div style={featuresGridStyle}>
          <div style={featureCardStyle}>
            <Users size={18} color="var(--team1-primary)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Autoinscripción</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Los 4 jugadores eligen Drive o Revés desde su móvil.
              </div>
            </div>
          </div>

          <div style={featureCardStyle}>
            <Smartphone size={18} color="var(--team2-primary)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Marcador en Vivo</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Los espectadores en el club ven el tanteador en tiempo real.
              </div>
            </div>
          </div>
        </div>

        {/* Copy Link Input */}
        <div style={copyRowStyle}>
          <input
            type="text"
            readOnly
            value={joinUrl}
            style={linkInputStyle}
          />
          <button onClick={handleCopy} style={copyBtnStyle}>
            {copied ? <Check size={16} color="#00e676" /> : <Copy size={16} />}
            <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button onClick={onClose} style={primaryBtnStyle}>
            Listo
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
  maxWidth: '460px',
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
  background: 'rgba(0, 176, 255, 0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(0, 176, 255, 0.3)'
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

const qrContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  background: 'var(--bg-elevated)',
  borderRadius: '16px',
  border: '1px solid var(--border-subtle)',
  marginBottom: '18px'
};

const qrWrapperStyle: React.CSSProperties = {
  padding: '12px',
  background: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
};

const featuresGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
  marginBottom: '16px'
};

const featureCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  padding: '10px 12px',
  background: 'var(--bg-elevated)',
  borderRadius: '10px',
  border: '1px solid var(--border-subtle)'
};

const copyRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '20px'
};

const linkInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  background: 'var(--bg-input, #ffffff)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '8px',
  color: 'var(--text-muted)',
  fontSize: '0.82rem',
  fontFamily: 'var(--font-mono)',
  outline: 'none'
};

const copyBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 14px',
  borderRadius: '8px',
  background: 'rgba(0, 176, 255, 0.15)',
  color: 'var(--team2-primary)',
  border: '1px solid rgba(0, 176, 255, 0.3)',
  fontWeight: 700,
  fontSize: '0.85rem'
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center'
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  background: 'var(--team2-gradient)',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: '0.95rem'
};
