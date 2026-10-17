import React, { useState, useEffect, useRef } from 'react';
import type { Team, MatchScoreState, MatchRules } from '../types/padel';
import { generateMatchCardCanvas } from '../utils/generateMatchCardCanvas';
import { 
  X, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teams: { team1: Team; team2: Team };
  state: MatchScoreState;
  rules?: MatchRules;
  matchDurationSeconds?: number;
}

export const MatchShareCardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  teams,
  state,
  rules,
  matchDurationSeconds
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDataUrl(null);
      setBlob(null);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);
    setErrorMessage(null);

    generateMatchCardCanvas({
      teams,
      state,
      rules,
      matchDurationSeconds
    })
      .then(canvas => {
        if (!isMounted) return;
        canvasRef.current = canvas;
        const url = canvas.toDataURL('image/png');
        setDataUrl(url);

        canvas.toBlob(b => {
          if (isMounted && b) {
            setBlob(b);
          }
        }, 'image/png');
      })
      .catch(err => {
        console.error('Error generating match card:', err);
        if (isMounted) {
          setErrorMessage('No se pudo generar la imagen. Intenta de nuevo.');
        }
      })
      .finally(() => {
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, state, teams, rules, matchDurationSeconds]);

  if (!isOpen) return null;

  // Handle native share sheet (works seamlessly on iOS Safari & Android Chrome)
  const handleNativeShare = async () => {
    if (!blob) return;

    try {
      const file = new File([blob], `padelmatch-${Date.now()}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Resultado Oficial PadelMatch',
          text: `🎾 ¡Resultado oficial de pádel en ${rules?.courtName || 'Cancha'}! Revisa las estadísticas en padelmatch.web.app`
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        // Fallback: trigger download and open WhatsApp
        handleDownload();
        const text = `🎾 *Resultado Oficial PadelMatch* en ${rules?.courtName || 'Cancha'}\nhttps://padelmatch.web.app`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // User didn't just cancel share sheet
        handleDownload();
      }
    }
  };

  // Handle direct file download
  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `padelmatch-resultado-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Handle copy image to clipboard
  const handleCopyImage = async () => {
    if (!blob) return;

    try {
      if (navigator.clipboard && typeof (window as any).ClipboardItem !== 'undefined') {
        const item = new (window as any).ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        handleDownload();
      }
    } catch (err) {
      console.warn('Could not copy image to clipboard:', err);
      handleDownload();
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div 
        style={modalStyle} 
        className="glass-panel" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={iconBadgeStyle}>
              <Sparkles size={18} color="var(--gold-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                Tarjeta Gráfica de Partido
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                Formato HD (4:5) optimizado para WhatsApp e Instagram Stories
              </p>
            </div>
          </div>

          <button onClick={onClose} style={closeBtnStyle} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Card Preview Viewport */}
        <div style={previewContainerStyle}>
          {isGenerating ? (
            <div style={loadingStateStyle}>
              <Loader2 size={36} color="var(--team1-primary)" className="spinner" />
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700, marginTop: '12px' }}>
                Generando tarjeta de alta resolución...
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Calculando ELO, estadísticas y aplicando diseño oficial
              </span>
            </div>
          ) : errorMessage ? (
            <div style={loadingStateStyle}>
              <span style={{ color: '#ff3d71', fontWeight: 700 }}>{errorMessage}</span>
            </div>
          ) : dataUrl ? (
            <div style={imageWrapperStyle}>
              <img 
                src={dataUrl} 
                alt="Tarjeta oficial de partido PadelMatch" 
                style={imageStyle} 
              />
              <div style={imageBadgeStyle}>
                <ImageIcon size={12} />
                <span>1080 × 1350 HD</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Feedback Banners */}
        {copied && (
          <div style={feedbackBannerSuccess}>
            <Check size={16} />
            <span>¡Imagen copiada al portapapeles! Lista para pegar en chats.</span>
          </div>
        )}
        {downloadSuccess && (
          <div style={feedbackBannerSuccess}>
            <Check size={16} />
            <span>¡Imagen guardada en descargas / galería!</span>
          </div>
        )}
        {shareSuccess && (
          <div style={feedbackBannerSuccess}>
            <Check size={16} />
            <span>¡Tarjeta enviada con éxito!</span>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div style={actionButtonsContainer}>
          <button 
            type="button"
            onClick={handleNativeShare} 
            disabled={!dataUrl || isGenerating}
            style={{
              ...primaryShareBtnStyle,
              opacity: !dataUrl || isGenerating ? 0.6 : 1
            }}
          >
            <Share2 size={18} />
            <span>Compartir en WhatsApp / Redes</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              type="button"
              onClick={handleDownload} 
              disabled={!dataUrl || isGenerating}
              style={{
                ...secondaryActionBtnStyle,
                opacity: !dataUrl || isGenerating ? 0.6 : 1
              }}
            >
              <Download size={16} color="var(--gold-primary)" />
              <span>{downloadSuccess ? '¡Guardada!' : 'Descargar HD'}</span>
            </button>

            <button 
              type="button"
              onClick={handleCopyImage} 
              disabled={!dataUrl || isGenerating}
              style={{
                ...secondaryActionBtnStyle,
                opacity: !dataUrl || isGenerating ? 0.6 : 1
              }}
            >
              {copied ? <Check size={16} color="var(--team1-primary)" /> : <Copy size={16} />}
              <span>{copied ? '¡Copiada!' : 'Copiar Imagen'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.88)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: '16px',
  boxSizing: 'border-box'
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  maxHeight: '92vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#0a0f1d',
  border: '1px solid rgba(0, 230, 118, 0.35)',
  borderRadius: '24px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 230, 118, 0.2)',
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(15, 23, 42, 0.6)'
};

const iconBadgeStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid rgba(255, 214, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '8px'
};

const previewContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  background: '#04070e',
  minHeight: '340px'
};

const loadingStateStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  textAlign: 'center'
};

const imageWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '360px',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 230, 118, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.12)'
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: 'auto',
  display: 'block',
  borderRadius: '16px'
};

const imageBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '10px',
  right: '10px',
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(6px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  padding: '3px 8px',
  fontSize: '0.68rem',
  color: '#e2e8f0',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontWeight: 700
};

const feedbackBannerSuccess: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  margin: '10px 20px 0',
  padding: '10px 14px',
  borderRadius: '12px',
  background: 'rgba(0, 230, 118, 0.15)',
  border: '1px solid var(--team1-primary)',
  color: 'var(--team1-primary)',
  fontSize: '0.82rem',
  fontWeight: 700
};

const actionButtonsContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '16px 20px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(15, 23, 42, 0.6)'
};

const primaryShareBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '14px',
  background: 'var(--team1-gradient)',
  color: '#04070e',
  border: 'none',
  borderRadius: '14px',
  fontWeight: 900,
  fontSize: '0.95rem',
  cursor: 'pointer',
  boxShadow: '0 4px 18px var(--team1-glow)',
  letterSpacing: '-0.01em',
  transition: 'transform 0.15s ease'
};

const secondaryActionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '11px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#fff',
  borderRadius: '12px',
  fontWeight: 800,
  fontSize: '0.82rem',
  cursor: 'pointer'
};
