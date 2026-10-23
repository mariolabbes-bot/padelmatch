import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Sparkles, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { 
  optimizeImage, 
  isImageAvatar, 
  PLAYER_GENERIC_AVATARS, 
  GROUP_GENERIC_AVATARS,
  type GenericAvatarPreset 
} from '../utils/imageOptimizer';

interface Props {
  value: string;
  onChange: (newAvatar: string) => void;
  type?: 'player' | 'group';
  fallbackLetter?: string;
  label?: string;
}

export const AvatarSelector: React.FC<Props> = ({
  value,
  onChange,
  type = 'player',
  fallbackLetter = 'P',
  label = 'Foto / Avatar'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [compressionFeedback, setCompressionFeedback] = useState<string | null>(null);

  const presets = type === 'player' ? PLAYER_GENERIC_AVATARS : GROUP_GENERIC_AVATARS;
  const isImage = isImageAvatar(value);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessError(null);
    setCompressionFeedback(null);

    try {
      const result = await optimizeImage(file, {
        maxWidth: type === 'player' ? 260 : 300,
        maxHeight: type === 'player' ? 260 : 300,
        quality: 0.84,
        squareCrop: true
      });

      onChange(result.dataUrl);
      setCompressionFeedback(
        `¡Foto ajustada a formato 1:1! Reducida de ${result.originalSizeKb} KB a solo ${result.optimizedSizeKb} KB para carga ultrarrápida.`
      );
    } catch (err: any) {
      setProcessError(err?.message || 'Error al procesar la imagen seleccionada.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectPreset = (preset: GenericAvatarPreset) => {
    onChange(preset.emoji);
    setCompressionFeedback(null);
    setProcessError(null);
  };

  const handleClear = () => {
    onChange('');
    setCompressionFeedback(null);
    setProcessError(null);
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={labelStyle}>
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            style={clearBtnStyle}
            title="Quitar avatar y volver al valor predeterminado"
          >
            <Trash2 size={13} />
            <span>Quitar</span>
          </button>
        )}
      </div>

      {/* Main Avatar Showcase & Upload Action */}
      <div style={showcaseBox}>
        {/* Preview Bubble */}
        <div style={{
          ...avatarBubbleStyle,
          borderRadius: type === 'player' ? '50%' : '18px'
        }}>
          {isImage ? (
            <img 
              src={value} 
              alt="Avatar" 
              style={avatarImgStyle} 
            />
          ) : value ? (
            <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>{value}</span>
          ) : (
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-dim)' }}>
              {fallbackLetter.toUpperCase()}
            </span>
          )}

          {isProcessing && (
            <div style={processingOverlay}>
              <div className="spinner-small" style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--team1-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}
        </div>

        {/* Upload Button & Action */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              style={uploadBtnStyle}
            >
              <Camera size={16} />
              <span>{isImage ? 'Cambiar Foto' : 'Subir Foto'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              style={secondaryUploadBtn}
            >
              <Upload size={14} />
              <span>Desde Galería o Archivos</span>
            </button>
          </div>

          <p style={{ margin: '8px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            Ajuste y recorte cuadrado 1:1 automático. Se optimiza y comprime al instante sin demoras de carga.
          </p>
        </div>
      </div>

      {/* Compression & Error Feedback */}
      {compressionFeedback && (
        <div style={feedbackBanner}>
          <Check size={15} color="var(--team1-primary)" />
          <span style={{ flex: 1 }}>{compressionFeedback}</span>
        </div>
      )}

      {processError && (
        <div style={errorBannerStyle}>
          <AlertCircle size={15} color="#ff5252" />
          <span style={{ flex: 1 }}>{processError}</span>
        </div>
      )}

      {/* Generic Preset Grid */}
      <div style={{ marginTop: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Sparkles size={14} color="var(--gold-primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            O Elige un Avatar de Pádel Predefinido:
          </span>
        </div>

        <div style={presetGrid}>
          {presets.map((preset) => {
            const isSelected = value === preset.emoji;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                title={preset.label}
                style={{
                  ...presetBtnStyle,
                  borderColor: isSelected ? 'var(--team1-primary)' : 'rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(0, 230, 118, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                  transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                  boxShadow: isSelected ? '0 0 14px rgba(0, 230, 118, 0.35)' : 'none'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{preset.emoji}</span>
                <span style={{ fontSize: '0.64rem', color: isSelected ? 'var(--team1-primary)' : 'var(--text-dim)', fontWeight: 700, marginTop: '2px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '64px' }}>
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// STYLES
// ==========================================

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '14px',
  borderRadius: '14px',
  background: 'rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 800,
  color: 'var(--text-muted)'
};

const clearBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  background: 'transparent',
  border: 'none',
  color: '#ff5252',
  fontSize: '0.74rem',
  fontWeight: 700,
  cursor: 'pointer',
  padding: '2px 6px'
};

const showcaseBox: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap'
};

const avatarBubbleStyle: React.CSSProperties = {
  width: '74px',
  height: '74px',
  border: '2px solid var(--team1-primary)',
  background: 'rgba(255, 255, 255, 0.04)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flexShrink: 0,
  position: 'relative',
  boxShadow: '0 4px 18px rgba(0, 230, 118, 0.25)'
};

const avatarImgStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const processingOverlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const uploadBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: '8px',
  background: 'linear-gradient(135deg, var(--team1-primary), #00b0ff)',
  color: '#070a10',
  fontWeight: 800,
  fontSize: '0.8rem',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 2px 10px rgba(0, 230, 118, 0.25)'
};

const secondaryUploadBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: 'var(--text-main)',
  fontSize: '0.78rem',
  fontWeight: 700,
  cursor: 'pointer'
};

const feedbackBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '10px',
  padding: '8px 12px',
  borderRadius: '8px',
  background: 'rgba(0, 230, 118, 0.12)',
  border: '1px solid rgba(0, 230, 118, 0.3)',
  color: 'var(--team1-primary)',
  fontSize: '0.75rem',
  lineHeight: 1.35
};

const errorBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '10px',
  padding: '8px 12px',
  borderRadius: '8px',
  background: 'rgba(255, 82, 82, 0.12)',
  border: '1px solid rgba(255, 82, 82, 0.3)',
  color: '#ff5252',
  fontSize: '0.75rem'
};

const presetGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
  gap: '8px'
};

const presetBtnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 4px',
  borderRadius: '10px',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'all 0.18s ease'
};
