import React, { useState } from 'react';
import { authService } from '../services/authService';
import type { UserSession } from '../services/authService';
import type { CommunityPlayer, DominantHand } from '../types/padel';
import { 
  Trophy, 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Play, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  MapPin,
  Hand
} from 'lucide-react';

interface Props {
  onAuthenticated: (user: UserSession) => void;
}

export const AuthScreen: React.FC<Props> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register State
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [category, setCategory] = useState<CommunityPlayer['category']>('4ta');
  const [favoritePosition, setFavoritePosition] = useState<'drive' | 'reves' | 'ambas'>('drive');
  const [dominantHand, setDominantHand] = useState<DominantHand>('diestro');
  const [registerCity, setRegisterCity] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const res = authService.login(loginEmail, loginPassword);
    if (res.success && res.user) {
      onAuthenticated(res.user);
    } else {
      setError(res.error || 'Credenciales inválidas.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (registerPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (registerPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    const res = authService.register({
      name: registerName,
      email: registerEmail,
      password: registerPassword,
      phone: registerPhone.trim() || undefined,
      dominantHand,
      city: registerCity.trim() || undefined,
      category,
      favoritePosition
    });

    if (res.success && res.user) {
      setSuccessMsg('¡Perfil registrado exitosamente!');
      setTimeout(() => {
        onAuthenticated(res.user!);
      }, 400);
    } else {
      setError(res.error || 'Error al registrar jugador.');
    }
  };

  const handleQuickDemoUser = () => {
    const demoEmail = 'mario@padelmatch.pro';
    let user = authService.login(demoEmail, 'padel123').user;
    if (!user) {
      user = authService.register({
        name: 'Mario Labbé',
        email: demoEmail,
        password: 'padel123',
        phone: '+56912345678',
        dominantHand: 'diestro',
        city: 'Santiago',
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
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <img 
            src="/logo.png" 
            alt="PadelMatch Logo" 
            style={{ 
              width: '72px', 
              height: '72px', 
              borderRadius: '50%', 
              objectFit: 'cover', 
              margin: '0 auto 12px',
              display: 'block',
              boxShadow: '0 0 30px rgba(255, 214, 0, 0.4), 0 0 10px rgba(0, 230, 118, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }} 
          />
          <div style={logoBadgeStyle}>
            <div className="pulsing-dot" style={{ color: 'var(--team1-primary)' }} />
            <span style={{ fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1.25rem', color: '#fff' }}>
              PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span>
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '12px', letterSpacing: '-0.02em', color: '#fff' }}>
            Marcador Inteligente en Cancha
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Arbitraje por voz, hardware smartwatch y comunidad competitiva
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={tabContainerStyle}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
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
            onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
            style={{
              ...tabBtnStyle,
              background: mode === 'register' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
              borderBottom: mode === 'register' ? '2px solid var(--team1-primary)' : '2px solid transparent'
            }}
          >
            Crear Perfil con Contraseña
          </button>
        </div>

        {error && (
          <div style={errorBannerStyle}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={successBannerStyle}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form: LOGIN */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>
                <Mail size={14} color="var(--team1-primary)" />
                Correo Electrónico (Tu Identificador)
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="ejemplo@padel.cl"
                style={inputStyle}
                autoComplete="email"
              />
            </div>

            <div>
              <label style={labelStyle}>
                <Lock size={14} color="var(--team1-primary)" />
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Tu contraseña registrada"
                  style={inputStyle}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={eyeIconBtnStyle}
                  title={showLoginPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label="Ver u ocultar contraseña"
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" style={primaryActionBtnStyle}>
              <span>Ingresar a la Cancha</span>
              <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          /* Form: REGISTER */
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>
                <User size={14} color="var(--team1-primary)" />
                Nombre Completo (Jugador Real)
              </label>
              <input
                type="text"
                required
                value={registerName}
                onChange={e => setRegisterName(e.target.value)}
                placeholder="Ej: Mario Labbé"
                style={inputStyle}
                autoComplete="name"
              />
            </div>

            <div>
              <label style={labelStyle}>
                <Mail size={14} color="var(--team1-primary)" />
                Correo Electrónico (Tu Usuario)
              </label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={e => setRegisterEmail(e.target.value)}
                placeholder="tu@correo.com"
                style={inputStyle}
                autoComplete="email"
              />
            </div>

            {/* Phone / WhatsApp for match recap delivery */}
            <div>
              <label style={labelStyle}>
                <Phone size={14} color="var(--team1-primary)" />
                WhatsApp / Teléfono Móvil
              </label>
              <input
                type="tel"
                value={registerPhone}
                onChange={e => setRegisterPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                style={inputStyle}
                autoComplete="tel"
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px', display: 'block' }}>
                📲 Te enviamos tu ficha de partido, estadísticas y tarjetas de juego
              </span>
            </div>

            {/* Passwords Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>
                  <Lock size={14} color="var(--team1-primary)" />
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    value={registerPassword}
                    onChange={e => setRegisterPassword(e.target.value)}
                    placeholder="Mínimo 4 car."
                    style={{ ...inputStyle, paddingRight: '36px' }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    style={eyeIconBtnStyle}
                    title="Mostrar contraseña"
                    aria-label="Mostrar contraseña"
                  >
                    {showRegisterPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  <Lock size={14} color="var(--team1-primary)" />
                  Repetir Contraseña
                </label>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar"
                  style={{
                    ...inputStyle,
                    borderColor: confirmPassword && registerPassword !== confirmPassword 
                      ? 'var(--danger-primary)' 
                      : confirmPassword && registerPassword === confirmPassword 
                        ? 'var(--team1-primary)' 
                        : 'var(--border-medium)'
                  }}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Category & Side of Play */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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

            {/* Dominant Hand & City */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>
                  <Hand size={14} color="var(--gold-primary)" />
                  Mano Hábil
                </label>
                <select
                  value={dominantHand}
                  onChange={e => setDominantHand(e.target.value as DominantHand)}
                  style={selectStyle}
                >
                  <option value="diestro">Diestro 🎾</option>
                  <option value="zurdo">Zurdo (¡Pareja Oro!) ⭐</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  <MapPin size={14} color="var(--team1-primary)" />
                  Ciudad / Club
                </label>
                <input
                  type="text"
                  value={registerCity}
                  onChange={e => setRegisterCity(e.target.value)}
                  placeholder="Ej: Santiago / Club Padel"
                  style={inputStyle}
                />
              </div>
            </div>

            <button type="submit" style={primaryActionBtnStyle}>
              <span>Crear Cuenta e Iniciar</span>
              <Sparkles size={18} />
            </button>
          </form>
        )}

        {/* Demo Shortcut */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
            ¿Acceso rápido para prueba en cancha?
          </p>
          <button
            type="button"
            onClick={handleQuickDemoUser}
            style={demoBtnStyle}
          >
            <Play size={14} color="var(--team1-primary)" />
            <span>Entrar como Mario Labbé (Anfitrión Rápido)</span>
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
  paddingTop: 'var(--safe-top)',
  paddingBottom: 'var(--safe-bottom)',
  paddingLeft: 'var(--safe-left)',
  paddingRight: 'var(--safe-right)',
  background: 'var(--bg-deep)',
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box'
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
  padding: 'clamp(20px, 4.5vw, 32px)',
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
  marginBottom: '18px'
};

const tabBtnStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  textAlign: 'center'
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '6px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-md)',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const eyeIconBtnStyle: React.CSSProperties = {
  position: 'absolute',
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: '4px'
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-md)',
  color: '#fff',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const primaryActionBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: '0.95rem',
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
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer'
};

const errorBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  background: 'rgba(255, 61, 113, 0.15)',
  border: '1px solid var(--danger-primary)',
  borderRadius: 'var(--radius-md)',
  color: '#ff80a0',
  fontSize: '0.82rem',
  fontWeight: 600,
  marginBottom: '16px'
};

const successBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  background: 'rgba(0, 230, 118, 0.15)',
  border: '1px solid var(--team1-primary)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--team1-primary)',
  fontSize: '0.82rem',
  fontWeight: 700,
  marginBottom: '16px'
};
