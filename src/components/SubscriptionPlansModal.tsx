import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import type { SubscriptionTier } from '../types/padel';
import { authService, type UserSession } from '../services/authService';
import { 
  CheckCircle2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Flame, 
  Crown, 
  Users, 
  ArrowRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onSuccess?: () => void;
}

interface PlanCardData {
  id: SubscriptionTier;
  title: string;
  tagline: string;
  priceClp: number;
  periodLabel: string;
  monthlyEquivalentClp?: number;
  badge?: string;
  badgeColor?: string;
  isPopular?: boolean;
  isFounder?: boolean;
}

const PLANS: PlanCardData[] = [
  {
    id: 'season_6m',
    title: 'Plan Temporada',
    tagline: 'Ideal para la temporada oficial de pádel',
    priceClp: 9990,
    periodLabel: 'por 6 meses',
    monthlyEquivalentClp: 1665,
    badge: 'MÁS POPULAR',
    badgeColor: 'var(--team1-primary)',
    isPopular: true
  },
  {
    id: 'annual_12m',
    title: 'Plan Anual',
    tagline: 'Máximo ahorro para jugadores recurrentes',
    priceClp: 16990,
    periodLabel: 'por 1 año completo',
    monthlyEquivalentClp: 1415,
    badge: 'MEJOR VALOR',
    badgeColor: '#38bdf8'
  },
  {
    id: 'monthly',
    title: 'Mensual Flexible',
    tagline: 'Sin compromiso, renueva mes a mes',
    priceClp: 1990,
    periodLabel: 'por mes',
    monthlyEquivalentClp: 1990
  },
  {
    id: 'pro_founder',
    title: 'Pase Fundador',
    tagline: 'Pago único de por vida • Solo 250 cupos',
    priceClp: 24990,
    periodLabel: 'pago único vitalicio',
    badge: '👑 EDICIÓN LIMITADA',
    badgeColor: 'var(--gold-primary)',
    isFounder: true
  }
];

export const SubscriptionPlansModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionTier>('season_6m');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successPlanName, setSuccessPlanName] = useState('');

  if (!isOpen) return null;

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[0];
  const remainingFree = authService.getHostedMatchesRemaining(currentUser);

  const handleActivate = () => {
    if (!currentUser) return;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        authService.upgradeSubscription(selectedPlanId);
        setIsProcessing(false);
        setIsSuccess(true);
        setSuccessPlanName(selectedPlan.title);

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00e676', '#ffd600', '#00b0ff', '#ffffff']
        });

        if (onSuccess) onSuccess();
      } catch (err) {
        console.error(err);
        setIsProcessing(false);
      }
    }, 800);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalCardStyle} className="glass-panel">
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Crown size={22} color="var(--gold-primary)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--gold-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                PadelMatch Pro Host
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', margin: 0 }}>
              Suscripción Simple de Jugador
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Organiza partidos, gestiona grupos y lidera la comunidad con estadísticas profesionales.
            </p>
          </div>

          <button onClick={onClose} style={closeBtnStyle} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Free courtesy badge if applicable */}
        {remainingFree !== Infinity && (
          <div style={courtesyAlertBox}>
            <Flame size={16} color="var(--gold-primary)" />
            <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
              {remainingFree > 0 ? (
                <>Te quedan <strong>{remainingFree} de 3 partidos de cortesía gratuitos</strong> como Host.</>
              ) : (
                <>Has completado tus 3 partidos gratuitos de prueba como Host. <strong>Suscríbete para continuar organizando.</strong></>
              )}
            </span>
          </div>
        )}

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0, 230, 118, 0.15)', border: '2px solid var(--team1-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShieldCheck size={36} color="var(--team1-primary)" />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
              ¡Felicitaciones! Ya eres {successPlanName}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 24px' }}>
              Tu cuenta ahora cuenta con permisos ilimitados para crear partidos, convocar grupos en múltiplos de 4 y acceder a todas las analíticas de juego.
            </p>
            <button onClick={onClose} style={primaryActionBtnStyle}>
              <span>Empezar a Usar PadelMatch Pro</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <>
            {/* Plans Grid */}
            <div style={plansGridStyle}>
              {PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    style={{
                      ...planCardStyle,
                      borderColor: isSelected 
                        ? (plan.isFounder ? 'var(--gold-primary)' : 'var(--team1-primary)')
                        : 'var(--border-subtle)',
                      background: isSelected 
                        ? (plan.isFounder ? 'rgba(255, 214, 0, 0.08)' : 'rgba(0, 230, 118, 0.08)')
                        : 'var(--bg-elevated)',
                      boxShadow: isSelected 
                        ? (plan.isFounder ? '0 0 20px rgba(255, 214, 0, 0.2)' : '0 0 20px rgba(0, 230, 118, 0.2)')
                        : 'none'
                    }}
                  >
                    {plan.badge && (
                      <span 
                        style={{
                          ...badgeStyle,
                          background: plan.badgeColor || 'var(--team1-primary)',
                          color: '#070a10'
                        }}
                      >
                        {plan.badge}
                      </span>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: plan.badge ? '6px' : '0' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                        {plan.title}
                      </h3>
                      <input 
                        type="radio" 
                        name="plan" 
                        checked={isSelected} 
                        onChange={() => setSelectedPlanId(plan.id)}
                        style={{ accentColor: 'var(--team1-primary)', width: '18px', height: '18px' }}
                      />
                    </div>

                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 10px' }}>
                      {plan.tagline}
                    </p>

                    <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '1.45rem', fontWeight: 900, color: plan.isFounder ? 'var(--gold-primary)' : 'var(--team1-primary)', fontFamily: 'var(--font-mono)' }}>
                          ${plan.priceClp.toLocaleString('es-CL')}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          CLP {plan.periodLabel}
                        </span>
                      </div>
                      {plan.monthlyEquivalentClp && plan.id !== 'monthly' && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', fontWeight: 700, marginTop: '2px' }}>
                          ⚡ Equivale a solo ${plan.monthlyEquivalentClp.toLocaleString('es-CL')} CLP / mes
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Included Features Checklist */}
            <div style={featuresCardStyle}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                Tu suscripción incluye todo esto:
              </div>

              <div style={featuresGridStyle}>
                <div style={featureItemStyle}>
                  <CheckCircle2 size={16} color="var(--team1-primary)" />
                  <span><strong>Crear y programar partidos</strong> ilimitados</span>
                </div>
                <div style={featureItemStyle}>
                  <CheckCircle2 size={16} color="var(--team1-primary)" />
                  <span><strong>Árbitro por voz inteligente</strong> en tiempo real</span>
                </div>
                <div style={featureItemStyle}>
                  <CheckCircle2 size={16} color="var(--team1-primary)" />
                  <span><strong>Conexión Apple Watch & Samsung</strong></span>
                </div>
                <div style={featureItemStyle}>
                  <CheckCircle2 size={16} color="var(--team1-primary)" />
                  <span><strong>Módulo de Grupos</strong> con Múltiplos de 4</span>
                </div>
                <div style={featureItemStyle}>
                  <CheckCircle2 size={16} color="var(--team1-primary)" />
                  <span><strong>Analítica Situacional:</strong> Día vs Noche</span>
                </div>
                <div style={featureItemStyle}>
                  <CheckCircle2 size={16} color="var(--team1-primary)" />
                  <span><strong>Algoritmo de Pareja Ideal</strong> y Némesis</span>
                </div>
              </div>

              {/* Guest Freedom Guarantee */}
              <div style={guestGuaranteeBoxStyle}>
                <Users size={16} color="var(--gold-primary)" />
                <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                  <strong>Cero fricción en cancha:</strong> Tus compañeros de juego invitados se suman gratis escaneando el QR, sin requerir pago ni registro obligatorio.
                </span>
              </div>
            </div>

            {/* Action Checkout Button */}
            <div style={{ marginTop: '16px' }}>
              <button 
                onClick={handleActivate}
                disabled={isProcessing}
                style={primaryActionBtnStyle}
              >
                {isProcessing ? (
                  <span className="pulsing-dot" style={{ width: '16px', height: '16px', color: '#070a10' }} />
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Activar {selectedPlan.title} (${selectedPlan.priceClp.toLocaleString('es-CL')} CLP)</span>
                  </>
                )}
              </button>
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                🔒 Activación instantánea • Transbank WebPay & MercadoPago seguro
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(5, 8, 15, 0.88)',
  backdropFilter: 'blur(10px)',
  zIndex: 1200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const modalCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '640px',
  maxHeight: '92vh',
  overflowY: 'auto',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '22px'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const courtesyAlertBox: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  background: 'rgba(255, 214, 0, 0.1)',
  border: '1px solid rgba(255, 214, 0, 0.25)',
  borderRadius: '8px',
  padding: '8px 12px',
  marginBottom: '14px'
};

const plansGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '10px',
  marginBottom: '14px'
};

const planCardStyle: React.CSSProperties = {
  border: '1.5px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column'
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-10px',
  right: '12px',
  fontSize: '0.62rem',
  fontWeight: 900,
  padding: '2px 8px',
  borderRadius: '10px',
  letterSpacing: '0.04em'
};

const featuresCardStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '12px 14px'
};

const featuresGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '8px',
  fontSize: '0.8rem',
  color: '#e2e8f0',
  marginBottom: '10px'
};

const featureItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const guestGuaranteeBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(0, 176, 255, 0.08)',
  border: '1px solid rgba(0, 176, 255, 0.2)',
  borderRadius: '8px',
  padding: '8px 10px',
  marginTop: '8px'
};

const primaryActionBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px',
  borderRadius: '12px',
  background: 'var(--team1-primary)',
  color: '#070a10',
  fontWeight: 900,
  fontSize: '0.98rem',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: '0 4px 16px rgba(0, 230, 118, 0.3)'
};
