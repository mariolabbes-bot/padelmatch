import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { MatchScoreState, Team } from '../types/padel';
import { calculatePadelElo } from '../engine/eloEngine';
import { Trophy, RefreshCw, Flame, Clock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  state: MatchScoreState;
  teams: { team1: Team; team2: Team };
  onRematch: () => void;
  onNewMatch: () => void;
}

export const MatchVictoryModal: React.FC<Props> = ({
  isOpen,
  state,
  teams,
  onRematch,
  onNewMatch
}) => {
  useEffect(() => {
    if (isOpen && state.winner) {
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#00e676', '#00b0ff', '#ffd600', '#ffffff'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 65,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 65,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen, state.winner]);

  if (!isOpen) return null;

  // Render Incomplete / Unfinished Match Summary
  if (!state.winner) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle} className="glass-panel">
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ ...trophyCircleStyle, background: 'rgba(255, 214, 0, 0.1)', borderColor: 'rgba(255, 214, 0, 0.3)' }}>
              <Clock size={44} color="var(--gold-primary)" />
            </div>
            <span className="badge badge-gold" style={{ marginTop: '12px' }}>
              Partido Inconcluso Registrado
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
              Tiempo de Cancha Cumplido
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {teams.team1.name} vs {teams.team2.name}
            </p>
          </div>

          {/* Final Sets Scoreboard Card */}
          <div style={setsCardStyle}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Marcador Alcanzado en Cancha
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              {state.sets.map((set, idx) => (
                <div key={idx} style={setScoreBadge}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SET {idx + 1}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                    <span style={{ color: set.team1 > set.team2 ? 'var(--team1-primary)' : '#94a3b8' }}>{set.team1}</span>
                    <span style={{ opacity: 0.4 }}> - </span>
                    <span style={{ color: set.team2 > set.team1 ? 'var(--team2-primary)' : '#94a3b8' }}>{set.team2}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-md)', margin: '16px 0', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              ℹ️ Este partido ha sido computado en el total de partidos jugados de los 4 participantes, preservando el puntaje ELO y las rachas invictas.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button onClick={onRematch} style={rematchBtnStyle}>
              <RefreshCw size={18} />
              <span>Continuar Partido</span>
            </button>
            <button onClick={onNewMatch} style={newMatchBtnStyle}>
              <span>Nuevo Partido</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const winnerTeam = teams[state.winner];

  // Calculate ELO progression
  const eloResults = calculatePadelElo(
    [teams.team1.player1, teams.team1.player2],
    [teams.team2.player1, teams.team2.player2],
    state.winner,
    state.sets
  );

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} className="glass-panel">
        {/* Trophy icon */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={trophyCircleStyle}>
            <Trophy size={48} color="var(--gold-primary)" />
          </div>
          <span className="badge badge-gold" style={{ marginTop: '12px' }}>
            ¡Victoria de Partido!
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px', color: '#fff' }}>
            {winnerTeam.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {winnerTeam.player1.name} & {winnerTeam.player2.name}
          </p>
        </div>

        {/* Final Sets Scoreboard Card */}
        <div style={setsCardStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Resultado Final Oficial
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            {state.sets.map((set, idx) => (
              <div key={idx} style={setScoreBadge}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SET {idx + 1}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                  <span style={{ color: set.team1 > set.team2 ? 'var(--team1-primary)' : '#94a3b8' }}>{set.team1}</span>
                  <span style={{ opacity: 0.4 }}> - </span>
                  <span style={{ color: set.team2 > set.team1 ? 'var(--team2-primary)' : '#94a3b8' }}>{set.team2}</span>
                </div>
                {set.tiebreakPoints && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--gold-primary)' }}>
                    ({set.tiebreakPoints.team1}-{set.tiebreakPoints.team2})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ELO Rating Changes (Módulo D: Ranking Dinámico) */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Flame size={16} color="var(--gold-primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold-primary)' }}>
              Ajuste de Ranking ELO de Comunidad
            </span>
          </div>

          <div style={eloGridStyle}>
            {/* Team 1 Players */}
            <div style={{ ...eloTeamCard, borderColor: state.winner === 'team1' ? 'var(--team1-primary)' : 'var(--border-subtle)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--team1-primary)', marginBottom: '6px' }}>
                {teams.team1.name}
              </div>
              <div style={eloPlayerRow}>
                <span>{teams.team1.player1.name}</span>
                <span style={{ color: eloResults.team1Delta >= 0 ? '#00e676' : '#ff3d71', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {eloResults.team1Delta >= 0 ? `+${eloResults.team1Delta}` : eloResults.team1Delta} pts
                </span>
              </div>
              <div style={eloPlayerRow}>
                <span>{teams.team1.player2.name}</span>
                <span style={{ color: eloResults.team1Delta >= 0 ? '#00e676' : '#ff3d71', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {eloResults.team1Delta >= 0 ? `+${eloResults.team1Delta}` : eloResults.team1Delta} pts
                </span>
              </div>
            </div>

            {/* Team 2 Players */}
            <div style={{ ...eloTeamCard, borderColor: state.winner === 'team2' ? 'var(--team2-primary)' : 'var(--border-subtle)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--team2-primary)', marginBottom: '6px' }}>
                {teams.team2.name}
              </div>
              <div style={eloPlayerRow}>
                <span>{teams.team2.player1.name}</span>
                <span style={{ color: eloResults.team2Delta >= 0 ? '#00e676' : '#ff3d71', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {eloResults.team2Delta >= 0 ? `+${eloResults.team2Delta}` : eloResults.team2Delta} pts
                </span>
              </div>
              <div style={eloPlayerRow}>
                <span>{teams.team2.player2.name}</span>
                <span style={{ color: eloResults.team2Delta >= 0 ? '#00e676' : '#ff3d71', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {eloResults.team2Delta >= 0 ? `+${eloResults.team2Delta}` : eloResults.team2Delta} pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button onClick={onRematch} style={rematchBtnStyle}>
            <RefreshCw size={16} /> Jugar Revancha
          </button>
          <button onClick={onNewMatch} style={newMatchBtnStyle}>
            Nuevo Partido
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
  backgroundColor: 'rgba(5, 8, 15, 0.9)',
  backdropFilter: 'blur(12px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '520px',
  background: '#0d1424',
  border: '1px solid rgba(255, 214, 0, 0.3)',
  borderRadius: '24px',
  padding: '28px',
  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(255, 214, 0, 0.15)',
  animation: 'slideDown 0.3s ease-out'
};

const trophyCircleStyle: React.CSSProperties = {
  width: '84px',
  height: '84px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255, 214, 0, 0.25) 0%, rgba(255, 214, 0, 0.05) 70%)',
  border: '2px solid rgba(255, 214, 0, 0.5)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 30px rgba(255, 214, 0, 0.35)'
};

const setsCardStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.35)',
  borderRadius: '16px',
  padding: '16px',
  textAlign: 'center',
  marginBottom: '20px',
  border: '1px solid var(--border-subtle)'
};

const setScoreBadge: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  padding: '8px 14px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)',
  minWidth: '70px'
};

const eloGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px'
};

const eloTeamCard: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid',
  borderRadius: '12px',
  padding: '12px'
};

const eloPlayerRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.8rem',
  color: '#e2e8f0',
  marginTop: '4px'
};

const rematchBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '14px',
  borderRadius: '12px',
  background: 'var(--bg-elevated)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '0.95rem',
  border: '1px solid var(--border-subtle)'
};

const newMatchBtnStyle: React.CSSProperties = {
  padding: '14px',
  borderRadius: '12px',
  background: 'var(--team1-gradient)',
  color: '#050c18',
  fontWeight: 900,
  fontSize: '0.95rem',
  boxShadow: '0 4px 16px var(--team1-glow)'
};
