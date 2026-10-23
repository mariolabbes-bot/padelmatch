import React, { useState } from 'react';
import type { UserSession } from '../services/authService';
import { partnerService } from '../services/partnerService';
import { 
  X, 
  MessageSquare, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Users,
  ExternalLink 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  initialFriendName?: string;
}

export const InviteExternalPartnerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  initialFriendName = ''
}) => {
  const [friendName, setFriendName] = useState(initialFriendName);
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const generatedText = partnerService.generateWhatsAppPartnerInviteText(
    currentUser,
    customNote,
    friendName
  );

  const inviteUrl = `https://padelmatch.web.app#register?invite-partner=${currentUser.id}&name=${encodeURIComponent(currentUser.name)}`;

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(generatedText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyLinkOnly = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div 
        style={modalCardStyle} 
        className="glass-panel apple-card glow-team1"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={iconBadgeStyle}>
              <Share2 size={20} color="#25D366" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                Invitar Partner por WhatsApp
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Invita a amigos externos a unirse y conectar contigo
              </span>
            </div>
          </div>

          <button onClick={onClose} style={closeBtnStyle} aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        {/* Value Proposition Pill */}
        <div style={valueBannerStyle}>
          <Sparkles size={16} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
            Tu amigo recibirá un enlace directo a la pantalla de registro. Al crear su cuenta, <strong>quedarán conectados como partners automáticamente</strong>.
          </p>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={fieldLabelStyle}>
              Nombre de tu amigo (opcional):
            </label>
            <input
              type="text"
              value={friendName}
              onChange={e => setFriendName(e.target.value)}
              placeholder="Ej: Gonzalo, Seba, Pipe..."
              style={textInputStyle}
            />
          </div>

          <div>
            <label style={fieldLabelStyle}>
              Mensaje personalizado adicional (opcional):
            </label>
            <input
              type="text"
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
              placeholder="Ej: ¡Súmate para programar nuestros partidos de los jueves!"
              style={textInputStyle}
            />
          </div>
        </div>

        {/* WhatsApp Message Live Preview */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#25D366', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vista Previa del Mensaje de WhatsApp
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
              Enlace de registro incluido
            </span>
          </div>

          <div style={previewBoxStyle}>
            <div style={{ fontSize: '0.78rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.45, fontFamily: 'sans-serif' }}>
              {generatedText}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            style={whatsappPrimaryBtnStyle}
          >
            <MessageSquare size={18} fill="#fff" />
            <span>Enviar Invitación por WhatsApp</span>
            <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopyText}
              style={secondaryActionBtnStyle}
            >
              {copied ? <Check size={14} color="var(--team1-primary)" /> : <Copy size={14} />}
              <span>{copied ? '¡Mensaje Copiado!' : 'Copiar Mensaje'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLinkOnly}
              style={secondaryActionBtnStyle}
            >
              {copiedLink ? <Check size={14} color="var(--team1-primary)" /> : <Users size={14} />}
              <span>{copiedLink ? '¡Link Copiado!' : 'Copiar Solo Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(5, 8, 15, 0.85)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '16px',
  boxSizing: 'border-box'
};

const modalCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  background: 'linear-gradient(145deg, rgba(14, 21, 36, 0.95) 0%, rgba(10, 15, 26, 0.98) 100%)',
  borderRadius: '20px',
  border: '1px solid rgba(37, 211, 102, 0.35)',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(37, 211, 102, 0.15)',
  padding: '20px',
  boxSizing: 'border-box',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const iconBadgeStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '12px',
  background: 'rgba(37, 211, 102, 0.15)',
  border: '1px solid rgba(37, 211, 102, 0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const closeBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  borderRadius: '50%',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const valueBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  borderRadius: '12px',
  background: 'rgba(255, 214, 0, 0.08)',
  border: '1px solid rgba(255, 214, 0, 0.25)',
  marginBottom: '14px'
};

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.74rem',
  fontWeight: 800,
  color: 'var(--text-muted)',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const textInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  fontSize: '0.86rem',
  boxSizing: 'border-box',
  outline: 'none'
};

const previewBoxStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.45)',
  border: '1px solid rgba(37, 211, 102, 0.25)',
  borderRadius: '12px',
  padding: '12px 14px',
  maxHeight: '160px',
  overflowY: 'auto'
};

const whatsappPrimaryBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  width: '100%',
  padding: '13px 18px',
  borderRadius: '14px',
  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
  color: '#ffffff',
  fontSize: '0.92rem',
  fontWeight: 900,
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 18px rgba(37, 211, 102, 0.35)',
  transition: 'transform 0.15s ease'
};

const secondaryActionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  flex: 1,
  padding: '9px 12px',
  borderRadius: '10px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  fontSize: '0.78rem',
  fontWeight: 800,
  cursor: 'pointer'
};
