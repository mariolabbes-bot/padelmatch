import React, { useState } from 'react';
import type { MatchScoreState, Team } from '../types/padel';
import { Clock, ShieldAlert, Flag, CheckCircle2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: MatchScoreState;
  teams: { team1: Team; team2: Team };
  onConfirmFinish: (params: {
    status: 'unfinished' | 'completed' | 'retired';
    winner: 'team1' | 'team2' | 'none';
    reasonText: string;
  }) => void;
}

export const FinishMatchEarlyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  state,
  teams,
  onConfirmFinish
}) => {
  const [selectedOption, setSelectedOption] = useState<'time_expired' | 'leader_wins' | 't1_retire' | 't2_retire'>('time_expired');

  if (!isOpen) return null;

  const currentSet = state.sets[state.currentSetIndex] || { team1: 0, team2: 0 };

  const handleFinish = () => {
    if (selectedOption === 'time_expired') {
      onConfirmFinish({
        status: 'unfinished',
        winner: 'none',
        reasonText: 'Finalizado por tiempo de cancha cumplido.'
      });
    } else if (selectedOption === 'leader_wins') {
      // Determine who has more sets or games
      const t1Sets = state.sets.filter(s => s.team1 > s.team2).length;
      const t2Sets = state.sets.filter(s => s.team2 > s.team1).length;
      let winner: 'team1' | 'team2' = 'team1';
      if (t2Sets > t1Sets) winner = 'team2';
      else if (t1Sets === t2Sets) {
        winner = currentSet.team2 > currentSet.team1 ? 'team2' : 'team1';
      }

      onConfirmFinish({
        status: 'completed',
        winner,
        reasonText: `Finalizado por tiempo. Ganador por ventaja de marcador: ${teams[winner].name}.`
      });
    } else if (selectedOption === 't1_retire') {
      onConfirmFinish({
        status: 'retired',
        winner: 'team2',
        reasonText: `Retiro de ${teams.team1.name}. Victoria para ${teams.team2.name}.`
      });
    } else if (selectedOption === 't2_retire') {
      onConfirmFinish({
        status: 'retired',
        winner: 'team1',
        reasonText: `Retiro de ${teams.team2.name}. Victoria para ${teams.team1.name}.`
      });
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} className="glass-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={iconBadgeStyle}>
              <Clock size={20} color="var(--gold-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                Finalizar Partido Inconcluso
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Guarda el resultado actual en el historial de los 4 jugadores
              </p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle} aria-label="Cerrar">
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        {/* Current Score Summary */}
        <div style={scoreSummaryCard}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Marcador Actual al Momento de Finalizar
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, color: 'var(--team1-primary)', fontSize: '0.95rem' }}>
              {teams.team1.name}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {state.sets.map((s, idx) => (
                <span key={idx} style={setChipStyle}>
                  {s.team1}-{s.team2}
                </span>
              ))}
            </div>
            <span style={{ fontWeight: 800, color: 'var(--team2-primary)', fontSize: '0.95rem' }}>
              {teams.team2.name}
            </span>
          </div>
        </div>

        {/* Reason / Option Selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '16px 0' }}>
          {/* Option 1: Time expired / Match incomplete */}
          <div 
            onClick={() => setSelectedOption('time_expired')}
            style={{
              ...optionCardStyle,
              borderColor: selectedOption === 'time_expired' ? 'var(--gold-primary)' : 'var(--border-subtle)',
              background: selectedOption === 'time_expired' ? 'rgba(255, 214, 0, 0.08)' : 'var(--bg-elevated)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={18} color="var(--gold-primary)" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Tiempo de Cancha Cumplido (Inconcluso)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Se guarda el marcador exacto sin declarar ganador ficticio. No descuenta ELO.
                </div>
              </div>
            </div>
            {selectedOption === 'time_expired' && <CheckCircle2 size={18} color="var(--gold-primary)" />}
          </div>

          {/* Option 2: Leader Wins */}
          <div 
            onClick={() => setSelectedOption('leader_wins')}
            style={{
              ...optionCardStyle,
              borderColor: selectedOption === 'leader_wins' ? 'var(--team1-primary)' : 'var(--border-subtle)',
              background: selectedOption === 'leader_wins' ? 'rgba(0, 230, 118, 0.08)' : 'var(--bg-elevated)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Flag size={18} color="var(--team1-primary)" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Declarar Ganador al Líder Actual
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Gana la pareja que va arriba en sets/games en este instante.
                </div>
              </div>
            </div>
            {selectedOption === 'leader_wins' && <CheckCircle2 size={18} color="var(--team1-primary)" />}
          </div>

          {/* Option 3: Team 1 Retires */}
          <div 
            onClick={() => setSelectedOption('t1_retire')}
            style={{
              ...optionCardStyle,
              borderColor: selectedOption === 't1_retire' ? 'var(--danger-primary)' : 'var(--border-subtle)',
              background: selectedOption === 't1_retire' ? 'rgba(255, 61, 113, 0.08)' : 'var(--bg-elevated)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={18} color="var(--danger-primary)" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Retiro o Lesión de {teams.team1.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Victoria adjudicada a {teams.team2.name}.
                </div>
              </div>
            </div>
            {selectedOption === 't1_retire' && <CheckCircle2 size={18} color="var(--danger-primary)" />}
          </div>

          {/* Option 4: Team 2 Retires */}
          <div 
            onClick={() => setSelectedOption('t2_retire')}
            style={{
              ...optionCardStyle,
              borderColor: selectedOption === 't2_retire' ? 'var(--danger-primary)' : 'var(--border-subtle)',
              background: selectedOption === 't2_retire' ? 'rgba(255, 61, 113, 0.08)' : 'var(--bg-elevated)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={18} color="var(--danger-primary)" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Retiro o Lesión de {teams.team2.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Victoria adjudicada a {teams.team1.name}.
                </div>
              </div>
            </div>
            {selectedOption === 't2_retire' && <CheckCircle2 size={18} color="var(--danger-primary)" />}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button onClick={onClose} style={cancelBtnStyle}>
            Continuar Partido
          </button>
          <button onClick={handleFinish} style={confirmBtnStyle}>
            Finalizar y Guardar
          </button>
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
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'clamp(14px, 4vw, 24px)',
  zIndex: 10000,
  animation: 'fadeIn 0.2s ease-out'
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '460px',
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg)',
  padding: 'clamp(18px, 4.5vw, 26px)',
  border: '1px solid var(--border-medium)',
  boxShadow: 'var(--shadow-lg)'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
};

const iconBadgeStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '10px',
  background: 'rgba(255, 214, 0, 0.12)',
  border: '1px solid rgba(255, 214, 0, 0.3)'
};

const closeBtnStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '8px',
  background: 'var(--bg-elevated)'
};

const scoreSummaryCard: React.CSSProperties = {
  padding: '12px 14px',
  background: 'var(--bg-elevated)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-subtle)'
};

const setChipStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontWeight: 800,
  fontSize: '0.85rem',
  padding: '2px 8px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '6px',
  color: 'var(--text-main)'
};

const optionCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)'
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-main)',
  fontWeight: 700,
  fontSize: '0.85rem'
};

const confirmBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  background: 'linear-gradient(135deg, #ffd600 0%, #ff9100 100%)',
  color: '#070a10',
  borderRadius: 'var(--radius-md)',
  fontWeight: 900,
  fontSize: '0.85rem',
  boxShadow: '0 4px 15px rgba(255, 214, 0, 0.35)'
};
