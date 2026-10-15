import React, { useState } from 'react';
import { authService } from '../services/authService';
import type { UserSession } from '../services/authService';
import type { CommunityPlayer } from '../types/padel';
import { Trophy, User, Mail, Lock, ShieldCheck, Play, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  onAuthenticated: (user: UserSession) => void;
}

export const AuthScreen: React.FC<Props> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CommunityPlayer['category']>('4ta');
  const [favoritePosition, setFavoritePosition] = useState<'drive' | 'reves' | 'ambas'>('drive');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = authService.login(email, password);
    if (res.success && res.user) {
      onAuthenticated(res.user);
    } else {
      setError(res.error || 'Credenciales inválidas.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = authService.register({
      name,
      email,
      password,
      category,
      favoritePosition
    });
    if (res.success && res.user) {
      onAuthenticated(res.user);
    } else {
      setError(res.error || 'Error al registrar jugador.');
    }
  };

  const handleQuickDemoUser = () => {
    const demoEmail = 'mario@padelmatch.pro';
    let user = authService.login(demoEmail).user;
    if (!user) {
      user = authService.register({
        name: 'Mario Labbé',
        email: demoEmail,
        category: '4ta',
        favoritePosition: 'drive'
      }).user;
    }
    if (user) {
      onAuthenticated(user);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Background Court Lighting Ambience */}
      <div style={ambientGlowTop} />
      <div style={ambientGlowBottom} />

      <div style={cardStyle} className="glass-panel">
        {/* Header / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={logoBadgeStyle}>
            <div className="pulsing-dot" style={{ color: 'var(--team1-primary)' }} />
            <span style={{ fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
              PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span>
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '12px', letterSpacing: '-0.02em' }}>
            Marcador Inteligente en Cancha
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Arbitraje por voz, hardware smartwatch y comunidad competitiva
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={tabContainerStyle}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              ...tabBtnStyle,
              background: mode === 'login' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)',
              borderBottom: mode === 'login' ? '2px solid var(--team1-primary)' : '2px solid transparent'
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            style={{
              ...tabBtnStyle,
              background: mode === 'register' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
              borderBottom: mode === 'register' ? '2px solid var(--team1-primary)' : '2px solid transparent'
            }}
          >
            Crear Perfil
          </button>
        </div>

        {error && (
          <div style={errorBannerStyle}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>
                <Mail size={14} color="var(--team1-primary)" />
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ejemplo@padel.cl"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                <Lock size={14} color="var(--team1-primary)" />
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            <button type="submit" style={primaryActionBtnStyle}>
              <span>Ingresar a la Cancha</span>
              <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>
                <User size={14} color="var(--team1-primary)" />
                Nombre Completo (Jugador Real)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Mario Labbé"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                <Mail size={14} color="var(--team1-primary)" />
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>
                  <Trophy size={14} color="var(--gold-primary)" />
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  style={selectStyle}
                >
                  <option value="1ra">1ª Categoría (Pro)</option>
                  <option value="2da">2ª Categoría</option>
                  <option value="3ra">3ª Categoría</option>
                  <option value="4ta">4ª Categoría (Media)</option>
                  <option value="5ta">5ª Categoría</option>
                  <option value="6ta">6ª Categoría</option>
                  <option value="7ma">7ª Categoría (Iniciación)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  <ShieldCheck size={14} color="var(--team2-primary)" />
                  Lado de Juego
                </label>
                <select
                  value={favoritePosition}
                  onChange={e => setFavoritePosition(e.target.value as any)}
                  style={selectStyle}
                >
                  <option value="drive">Drive (Derecha)</option>
                  <option value="reves">Revés (Izquierda)</option>
                  <option value="ambas">Ambos lados</option>
                </select>
              </div>
            </div>

            <button type="submit" style={primaryActionBtnStyle}>
              <span>Crear Perfil e Iniciar</span>
              <Sparkles size={18} />
            </button>
          </form>
        )}

        {/* Demo Shortcut */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
            ¿Prueba rápida en cancha sin registrarse?
          </p>
          <button
            type="button"
            onClick={handleQuickDemoUser}
            style={demoBtnStyle}
          >
            <Play size={14} color="var(--team1-primary)" />
            <span>Entrar como Anfitrión Rápido</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'clamp(16px, 4vw, 32px)',
  background: 'var(--bg-deep)',
  position: 'relative',
  overflow: 'hidden'
};

const ambientGlowTop: React.CSSProperties = {
  position: 'absolute',
  top: '-15%',
  left: '20%',
  width: '60vw',
  height: '40vh',
  background: 'radial-gradient(circle, rgba(0, 230, 118, 0.12) 0%, transparent 70%)',
  pointerEvents: 'none'
};

const ambientGlowBottom: React.CSSProperties = {
  position: 'absolute',
  bottom: '-15%',
  right: '10%',
  width: '60vw',
  height: '40vh',
  background: 'radial-gradient(circle, rgba(0, 176, 255, 0.12) 0%, transparent 70%)',
  pointerEvents: 'none'
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '460px',
  padding: 'clamp(20px, 5vw, 36px)',
  zIndex: 1,
  boxShadow: 'var(--shadow-lg)',
  borderRadius: 'var(--radius-lg)'
};

const logoBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 14px',
  background: 'rgba(0, 0, 0, 0.4)',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-subtle)'
};

const tabContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: 'var(--radius-md)',
  padding: '4px',
  marginBottom: '20px'
};

const tabBtnStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-sm)',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)'
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '6px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-md)',
  color: '#fff',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color var(--transition-fast)'
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-md)',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none'
};

const primaryActionBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: '1rem',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  marginTop: '8px',
  cursor: 'pointer',
  boxShadow: '0 4px 20px var(--team1-glow)'
};

const demoBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-full)',
  color: 'var(--text-main)',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer'
};

const errorBannerStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'rgba(255, 61, 113, 0.15)',
  border: '1px solid var(--danger-primary)',
  borderRadius: 'var(--radius-md)',
  color: '#ff80a0',
  fontSize: '0.85rem',
  fontWeight: 600,
  marginBottom: '16px'
};
