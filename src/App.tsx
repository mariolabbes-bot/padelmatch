import { useState, useEffect, useCallback } from 'react';
import type { 
  MatchRules, 
  MatchScoreState, 
  Team, 
  HardwareKeyMapping, 
  TTSSettings, 
  MatchSnapshot,
  AppViewMode
} from './types/padel';
import { createInitialMatchState, scorePoint } from './engine/padelEngine';
import { ttsService } from './services/ttsService';
import { loadSavedKeyMapping } from './services/hardwareInput';
import { wakeLockService } from './services/wakeLock';
import { communityService } from './services/communityService';
import { Scoreboard } from './components/Scoreboard';
import { CourtEnrollmentView } from './components/CourtEnrollmentView';
import { CommunityDashboard } from './components/CommunityDashboard';
import { CourtTvDisplay } from './components/CourtTvDisplay';
import { BluetoothCalibrationModal } from './components/BluetoothCalibrationModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { MatchSetupModal } from './components/MatchSetupModal';
import { QrShareModal } from './components/QrShareModal';
import { MatchVictoryModal } from './components/MatchVictoryModal';

export function App() {
  // 1. Initial Default Match Configuration
  const [rules, setRules] = useState<MatchRules>({
    format: 'best_of_3',
    gameRule: 'golden_point',
    tieBreakRule: 'standard',
    thirdSetRule: 'super_tiebreak',
    superTieBreakTarget: 10,
    courtName: 'Cancha Central - Club Padel Pro'
  });

  const [teams, setTeams] = useState<{ team1: Team; team2: Team }>({
    team1: {
      id: 'team1',
      name: 'Pareja 1',
      color: '#00e676',
      player1: { id: 'p1', name: 'Jugador 1', position: 'drive', elo: 1200 },
      player2: { id: 'p2', name: 'Jugador 2', position: 'reves', elo: 1200 }
    },
    team2: {
      id: 'team2',
      name: 'Pareja 2',
      color: '#00b0ff',
      player1: { id: 'p3', name: 'Jugador 3', position: 'drive', elo: 1200 },
      player2: { id: 'p4', name: 'Jugador 4', position: 'reves', elo: 1200 }
    }
  });

  // 2. Navigation View Mode
  const [currentView, setCurrentView] = useState<AppViewMode>('scoreboard');

  // Check URL hash for direct QR match join
  useEffect(() => {
    if (window.location.hash.includes('match=')) {
      setCurrentView('court_enrollment');
    }
  }, []);

  // 3. Score State & History Stack
  const [state, setState] = useState<MatchScoreState>(() => createInitialMatchState(rules));
  const [history, setHistory] = useState<MatchSnapshot[]>([]);

  // 4. Modals & Settings
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);

  // 5. Audio & Hardware Mapping State
  const [keyMapping, setKeyMapping] = useState<HardwareKeyMapping>(loadSavedKeyMapping);
  const [ttsSettings, setTtsSettings] = useState<TTSSettings>({
    enabled: true,
    voiceName: '',
    pitch: 1.0,
    rate: 1.05,
    volume: 1.0,
    announcePlayerNames: true
  });
  const [isAudioSpeaking, setIsAudioSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [matchId] = useState(() => 'PADEL-' + Math.random().toString(36).substring(2, 8).toUpperCase());

  // Subscribe to speech synthesis state
  useEffect(() => {
    const unsubscribe = ttsService.subscribeSpeakingState(setIsAudioSpeaking);
    return () => unsubscribe();
  }, []);

  // Request Screen Wake Lock on mount
  useEffect(() => {
    wakeLockService.requestLock();
    return () => wakeLockService.releaseLock();
  }, []);

  // Handle Match Over / Victory Modal & Save to Community History
  useEffect(() => {
    if (state.isMatchOver && state.winner) {
      setIsVictoryModalOpen(true);

      // Auto-save to Community History
      communityService.saveMatchResult(
        rules.courtName || 'Cancha Central',
        teams.team1.name,
        [teams.team1.player1.name, teams.team1.player2.name],
        teams.team2.name,
        [teams.team2.player1.name, teams.team2.player2.name],
        state.sets,
        state.winner,
        18 // ELO delta average
      );
    }
  }, [state.isMatchOver, state.winner, rules.courtName, teams, state.sets]);

  // Core Scoring Callback
  const handleScore = useCallback((scoringTeam: 'team1' | 'team2') => {
    ttsService.unlockAudioContext();

    setState(prevState => {
      setHistory(prevHistory => [
        ...prevHistory,
        {
          state: JSON.parse(JSON.stringify(prevState)),
          timestamp: Date.now(),
          description: `Punto para ${teams[scoringTeam].name}`
        }
      ]);

      const result = scorePoint(prevState, scoringTeam, rules, teams);

      if (result.announcement) {
        ttsService.speak(result.announcement, ttsSettings);
      }

      return result.nextState;
    });
  }, [rules, teams, ttsSettings]);

  // Undo Callback
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    ttsService.unlockAudioContext();
    const lastSnapshot = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    setState(lastSnapshot.state);

    const undoMsg = 'Punto deshecho. Marcador corregido.';
    ttsService.speak(undoMsg, ttsSettings);
  }, [history, ttsSettings]);

  // Repeat Score Announcement
  const handleRepeatAnnouncement = useCallback(() => {
    ttsService.unlockAudioContext();
    if (state.lastEventAnnouncement) {
      ttsService.speak(state.lastEventAnnouncement, ttsSettings);
    }
  }, [state.lastEventAnnouncement, ttsSettings]);

  // Register Hardware Bluetooth & Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      const code = e.code;
      const key = e.key;

      const matches = (keysList: string[]) => keysList.includes(code) || keysList.includes(key);

      if (matches(keyMapping.team1PointKeys)) {
        e.preventDefault();
        handleScore('team1');
      } else if (matches(keyMapping.team2PointKeys)) {
        e.preventDefault();
        handleScore('team2');
      } else if (matches(keyMapping.undoKeys)) {
        e.preventDefault();
        handleUndo();
      } else if (matches(keyMapping.repeatScoreKeys)) {
        e.preventDefault();
        handleRepeatAnnouncement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyMapping, handleScore, handleUndo, handleRepeatAnnouncement]);

  // MediaSession API Integration (For Bluetooth Headset / Media Remotes)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${teams.team1.name} vs ${teams.team2.name}`,
          artist: 'PadelMatch Live Court Engine',
          album: rules.courtName || 'Padel Match'
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => handleScore('team1'));
        navigator.mediaSession.setActionHandler('nexttrack', () => handleScore('team2'));
        navigator.mediaSession.setActionHandler('seekbackward', () => handleUndo());
      } catch {
        // Ignored if media session action unsupported
      }
    }
  }, [teams, rules, handleScore, handleUndo]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Start New Match Handler
  const handleStartMatch = (newRules: MatchRules, newTeams: { team1: Team; team2: Team }) => {
    setRules(newRules);
    setTeams(newTeams);
    setState(createInitialMatchState(newRules));
    setHistory([]);
    setIsVictoryModalOpen(false);
    setCurrentView('scoreboard');

    const startMsg = `Inicia nuevo partido. ${newTeams.team1.name} contra ${newTeams.team2.name}.`;
    ttsService.speak(startMsg, ttsSettings);
  };

  // Rematch Handler
  const handleRematch = () => {
    setState(createInitialMatchState(rules));
    setHistory([]);
    setIsVictoryModalOpen(false);
    ttsService.speak('Comienza la revancha. ¡A jugar!', ttsSettings);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      {/* VIEW 1: Main Court Scoreboard */}
      {currentView === 'scoreboard' && (
        <Scoreboard
          state={state}
          teams={teams}
          rules={rules}
          onScorePoint={handleScore}
          onUndo={handleUndo}
          onRepeatAnnouncement={handleRepeatAnnouncement}
          onOpenBluetoothModal={() => setIsBluetoothModalOpen(true)}
          onOpenAudioModal={() => setIsAudioModalOpen(true)}
          onOpenSetupModal={() => setIsSetupModalOpen(true)}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          onNavigateToView={setCurrentView}
          isAudioSpeaking={isAudioSpeaking}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* VIEW 2: 2D Court Alignment & Self-Enrollment (Módulo B) */}
      {currentView === 'court_enrollment' && (
        <CourtEnrollmentView
          teams={teams}
          onUpdateTeams={setTeams}
          onProceedToScoreboard={() => setCurrentView('scoreboard')}
          courtName={rules.courtName || 'Pista Central'}
        />
      )}

      {/* VIEW 3: Community & ELO Leaderboard (Módulo D) */}
      {currentView === 'community' && (
        <CommunityDashboard
          onBackToScoreboard={() => setCurrentView('scoreboard')}
        />
      )}

      {/* VIEW 4: Court Giant TV Broadcast Display (SaaS B2B) */}
      {currentView === 'court_tv' && (
        <CourtTvDisplay
          state={state}
          teams={teams}
          rules={rules}
          onExitTvMode={() => setCurrentView('scoreboard')}
        />
      )}

      {/* Hardware Bluetooth Shutter & Ring Remote Calibration Modal */}
      <BluetoothCalibrationModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
        currentMapping={keyMapping}
        onUpdateMapping={setKeyMapping}
      />

      {/* Audio / Voice TTS Settings Modal */}
      <AudioSettingsModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        settings={ttsSettings}
        onUpdateSettings={setTtsSettings}
      />

      {/* Match Setup & Rules Configuration Modal */}
      <MatchSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        rules={rules}
        teams={teams}
        onStartMatch={handleStartMatch}
      />

      {/* QR Code Spectator / Self-Registration Modal */}
      <QrShareModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        matchId={matchId}
        courtName={rules.courtName || 'Pista Central'}
        team1Name={teams.team1.name}
        team2Name={teams.team2.name}
      />

      {/* Match Victory, Confetti & ELO Ratings Modal */}
      <MatchVictoryModal
        isOpen={isVictoryModalOpen}
        state={state}
        teams={teams}
        onRematch={handleRematch}
        onNewMatch={() => {
          setIsVictoryModalOpen(false);
          setIsSetupModalOpen(true);
        }}
      />
    </div>
  );
}

export default App;
