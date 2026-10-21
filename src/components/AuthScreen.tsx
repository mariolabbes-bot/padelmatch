import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { UserSession } from '../services/authService';
import { themeService, type AppTheme } from '../services/themeService';
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
  Hand,
  Sun,
  Moon,
  KeyRound,
  RotateCcw
} from 'lucide-react';

interface Props {
  onAuthenticated: (user: UserSession) => void;
}

export const AuthScreen: React.FC<Props> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [theme, setTheme] = useState<AppTheme>(themeService.getTheme());

  useEffect(() => {
    return themeService.subscribe(setTheme);
  }, []);

  const handleToggleTheme = () => {
    themeService.toggleTheme();
  };
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Claiming Guest State from QR Scan
  const [claimingGuestName, setClaimingGuestName] = useState<string | null>(null);

  useEffect(() => {
    const handleUrlClaim = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      let foundGuest: string | null = null;
      if (hash.includes('claimGuest=')) {
        const match = hash.match(/claimGuest=([^&]+)/);
        if (match && match[1]) foundGuest = decodeURIComponent(match[1]);
      } else if (search.includes('claimGuest=')) {
        const params = new URLSearchParams(search);
        foundGuest = params.get('claimGuest');
      }

      if (foundGuest) {
        setMode('register');
        setRegisterName(foundGuest);
        setClaimingGuestName(foundGuest);
      }
    };

    handleUrlClaim();
    window.addEventListener('hashchange', handleUrlClaim);
    return () => window.removeEventListener('hashchange', handleUrlClaim);
  }, []);

  // Reset Password State
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

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
      setError(res.error || 'Credenciales inválidas. Puedes restablecer tu contraseña con 1 clic abajo.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    const res = authService.resetPassword(resetEmail, newPassword);
    if (res.success && res.user) {
      setSuccessMsg('¡Contraseña actualizada con éxito! Ingresando...');
      setTimeout(() => {
        onAuthenticated(res.user!);
      }, 400);
    } else {
      setError(res.error || 'No se pudo restablecer la contraseña.');
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
      // Auto-claim any guest history associated with this name or phone!
      authService.claimGuestHistory(registerName);
      if (registerPhone.trim()) {
        authService.claimGuestHistory(registerPhone.trim());
      }
      setSuccessMsg('¡Perfil registrado exitosamente! Hemos sincronizado tu historial de juego.');
      setTimeout(() => {
        onAuthenticated(res.user!);
      }, 400);
    } else {
      setError(res.error || 'Error al registrar jugador.');
    }
  };

  const handleQuickDemoUser = () => {
    const founderEmail = 'mariolabbes@gmail.com';
    let user = authService.login(founderEmail, 'padel123').user;
    if (!user) {
      user = authService.register({
        name: 'Mario Labbé',
        email: founderEmail,
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

      <div style={cardStyle} className="glass-panel apple-card">
        {/* Theme Mode Switcher in Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: 900, 
              letterSpacing: '0.08em', 
              textTransform: 'uppercase',
              color: 'var(--team1-primary)',
              background: 'rgba(0, 230, 118, 0.1)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(0, 230, 118, 0.25)'
            }}>
              PADELMATCH PASS
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleTheme}
            style={themeToggleBtnStyle}
            title={theme === 'day' ? 'Modo Noche (Estadio Neón)' : 'Modo Día (Luz Natural / Alto Contraste)'}
            aria-label="Cambiar tema de visualización día/noche"
          >
            {theme === 'day' ? (
              <>
                <Sun size={14} color="var(--gold-primary)" />
                <span style={{ fontWeight: 800, fontSize: '0.75rem' }}>Modo Día</span>
              </>
            ) : (
              <>
                <Moon size={14} color="var(--team2-primary)" />
                <span style={{ fontWeight: 800, fontSize: '0.75rem' }}>Modo Noche</span>
              </>
            )}
          </button>
        </div>

        {/* Header / Brand (Apple / Nike Athletic Elegance) */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
            <img 
              src="/logo.png" 
              alt="PadelMatch Logo" 
              style={{ 
                width: '76px', 
                height: '76px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                margin: '0 auto',
                display: 'block',
                boxShadow: '0 0 35px rgba(0, 230, 118, 0.35), 0 0 15px rgba(255, 214, 0, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.25)'
              }} 
            />
          </div>

          <div style={logoBadgeStyle}>
            <div className="pulsing-dot" style={{ color: 'var(--team1-primary)' }} />
            <span style={{ fontWeight: 900, letterSpacing: '-0.03em', fontSize: '1.35rem', color: 'var(--text-main)' }}>
              PADEL<span style={{ color: 'var(--team1-primary)' }}>MATCH</span>
            </span>
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '10px', letterSpacing: '-0.02em', color: 'var(--text-main)', lineHeight: 1.2 }}>
            Experiencia de Élite en Cancha
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px', maxWidth: '340px', margin: '4px auto 0' }}>
            Arbitraje por voz profesional, sincronización en vivo y estadísticas de alto rendimiento
          </p>
        </div>

        {/* Apple-Style Segmented Control */}
        {!isResetMode && (
          <div style={tabContainerStyle}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
              style={{
                ...tabBtnStyle,
                background: mode === 'login' ? 'var(--bg-elevated)' : 'transparent',
                color: mode === 'login' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: mode === 'login' ? '0 2px 10px rgba(0, 0, 0, 0.4)' : 'none',
                fontWeight: mode === 'login' ? 900 : 700
              }}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
              style={{
                ...tabBtnStyle,
                background: mode === 'register' ? 'var(--bg-elevated)' : 'transparent',
                color: mode === 'register' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: mode === 'register' ? '0 2px 10px rgba(0, 0, 0, 0.4)' : 'none',
                fontWeight: mode === 'register' ? 900 : 700
              }}
            >
              Crear Perfil de Jugador
            </button>
          </div>
        )}

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

        {/* MODE: RESET PASSWORD */}
        {isResetMode ? (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '50%', background: 'rgba(255, 214, 0, 0.15)', color: 'var(--gold-primary)', marginBottom: '6px' }}>
                <KeyRound size={24} />
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>
                Restablecer Contraseña
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Ingresa tu correo y tu nueva contraseña para ingresar sin bloqueos
              </p>
            </div>

            <div>
              <label style={labelStyle}>
                <Mail size={14} color="var(--team1-primary)" />
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="mariolabbes@gmail.com"
                style={inputStyle}
                autoComplete="email"
              />
            </div>

            <div>
              <label style={labelStyle}>
                <Lock size={14} color="var(--team1-primary)" />
                Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  style={{ ...inputStyle, paddingRight: '36px' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  style={eyeIconBtnStyle}
                  title="Mostrar contraseña"
                  aria-label="Mostrar contraseña"
                >
                  {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <Lock size={14} color="var(--team1-primary)" />
                Confirmar Nueva Contraseña
              </label>
              <input
                type={showResetPassword ? 'text' : 'password'}
                required
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                style={inputStyle}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" style={primaryActionBtnStyle}>
              <span>Guardar Contraseña e Ingresar</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setError(null);
                setSuccessMsg(null);
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '4px'
              }}
            >
              <RotateCcw size={14} />
              <span>Volver a Iniciar Sesión</span>
            </button>
          </form>
        ) : mode === 'login' ? (
          /* Form: LOGIN */
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>
                <Mail size={14} color="var(--team1-primary)" />
                Correo Electrónico (Tu Usuario)
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="mariolabbes@gmail.com"
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
                  placeholder="Tu contraseña registrada (ej: padel123)"
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setResetEmail(loginEmail || 'mariolabbes@gmail.com');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--team1-primary)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    fontWeight: 600
                  }}
                >
                  ¿Olvidaste o quieres cambiar tu contraseña?
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
            {/* Claim Guest Match Banner */}
            {claimingGuestName && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 214, 0, 0.12)',
                border: '1px solid rgba(255, 214, 0, 0.4)',
                borderRadius: '10px',
                padding: '10px 14px'
              }}>
                <Sparkles size={20} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 900, fontSize: '0.84rem', color: '#fff' }}>
                    ¡Reclamando Partido para {claimingGuestName}!
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Al completar tu registro, este partido, sus estadísticas y ELO inicial se sumarán a tu cuenta oficial.
                  </div>
                </div>
              </div>
            )}

            {/* Guest History Linking Notice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '8px',
              padding: '8px 12px'
            }}>
              <Trophy size={16} color="#38bdf8" />
              <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                ¿Jugaste antes por QR? Usa tu mismo nombre o teléfono y tus victorias se sincronizarán solas.
              </span>
            </div>

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

        {/* Quick Access Shortcut for Mario Labbé */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
            ¿Acceso instantáneo de anfitrión fundador?
          </p>
          <button
            type="button"
            onClick={handleQuickDemoUser}
            style={demoBtnStyle}
          >
            <Play size={14} color="var(--team1-primary)" />
            <span>Ingreso Rápido Mario Labbé (mariolabbes@gmail.com)</span>
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

const themeToggleBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-full)',
  color: 'var(--text-main)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)'
};

const logoBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 14px',
  background: 'var(--bg-elevated)',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-subtle)'
};

const tabContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  background: 'rgba(0, 0, 0, 0.4)',
  borderRadius: 'var(--radius-md)',
  padding: '4px',
  marginBottom: '20px',
  border: '1px solid var(--border-subtle)'
};

const tabBtnStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '10px',
  fontSize: '0.84rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
  letterSpacing: '-0.01em'
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.78rem',
  fontWeight: 800,
  color: 'var(--text-main)',
  marginBottom: '6px',
  letterSpacing: '0.02em'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(0, 0, 0, 0.35)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '12px',
  color: 'var(--text-main)',
  fontSize: '0.92rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
};

const eyeIconBtnStyle: React.CSSProperties = {
  position: 'absolute',
  right: '12px',
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
  padding: '12px 14px',
  background: 'rgba(0, 0, 0, 0.35)',
  border: '1.5px solid var(--border-medium)',
  borderRadius: '12px',
  color: 'var(--text-main)',
  fontSize: '0.88rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
};

const primaryActionBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '15px',
  background: 'var(--team1-gradient)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: '1rem',
  borderRadius: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  marginTop: '8px',
  cursor: 'pointer',
  boxShadow: '0 4px 22px var(--team1-glow)',
  letterSpacing: '0.02em',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
};

const demoBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 18px',
  background: 'linear-gradient(135deg, rgba(255, 214, 0, 0.12) 0%, rgba(0, 230, 118, 0.1) 100%)',
  border: '1.5px solid rgba(255, 214, 0, 0.4)',
  borderRadius: 'var(--radius-full)',
  color: 'var(--text-main)',
  fontSize: '0.82rem',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 2px 12px rgba(255, 214, 0, 0.15)'
};

const errorBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 14px',
  background: 'rgba(255, 61, 113, 0.15)',
  border: '1.5px solid var(--danger-primary)',
  borderRadius: '12px',
  color: '#ffa3ba',
  fontSize: '0.84rem',
  fontWeight: 700,
  marginBottom: '16px',
  lineHeight: 1.35
};

const successBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 14px',
  background: 'rgba(0, 230, 118, 0.15)',
  border: '1.5px solid var(--team1-primary)',
  borderRadius: '12px',
  color: 'var(--team1-primary)',
  fontSize: '0.84rem',
  fontWeight: 800,
  marginBottom: '16px',
  lineHeight: 1.35
};
