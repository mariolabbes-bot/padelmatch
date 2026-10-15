import { useState, useEffect, useCallback } from 'react';
import type { 
  MatchRules, 
  MatchScoreState, 
  Team, 
  HardwareKeyMapping, 
  TTSSettings, 
  MatchSnapshot,
  AppViewMode,
  CommunityPlayer
} from './types/padel';
import { createInitialMatchState, scorePoint } from './engine/padelEngine';
import { ttsService } from './services/ttsService';
import { loadSavedKeyMapping } from './services/hardwareInput';
import { wakeLockService } from './services/wakeLock';
import { communityService } from './services/communityService';
import { authService } from './services/authService';
import type { UserSession } from './services/authService';
import { smartwatchService } from './services/smartwatchService';

// Flow Views
import { AuthScreen } from './components/AuthScreen';
import { HostDashboardView } from './components/HostDashboardView';
import { MatchLobbyQrView } from './components/MatchLobbyQrView';
import { CourtEnrollmentView } from './components/CourtEnrollmentView';
import { Scoreboard } from './components/Scoreboard';
import { CommunityDashboard } from './components/CommunityDashboard';
import { CourtTvDisplay } from './components/CourtTvDisplay';

// Modals
import { BluetoothCalibrationModal } from './components/BluetoothCalibrationModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { MatchSetupModal } from './components/MatchSetupModal';
import { QrShareModal } from './components/QrShareModal';
import { MatchVictoryModal } from './components/MatchVictoryModal';

export function App() {
  // 1. User Authentication Session
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => authService.getCurrentUser());

  useEffect(() => {
    const unsubscribe = authService.subscribe(setCurrentUser);
    return () => unsubscribe();
  }, []);

  // 2. Active View Navigation
  const [currentView, setCurrentView] = useState<AppViewMode>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('match=')) {
      return 'lobby_qr';
    }
    return authService.isAuthenticated() ? 'host_dashboard' : 'auth';
  });

  // 3. Match Rules & Configuration
  const [rules, setRules] = useState<MatchRules>({
    format: 'best_of_3',
    gameRule: 'golden_point',
    tieBreakRule: 'standard',
    thirdSetRule: 'super_tiebreak',
    superTieBreakTarget: 10,
    courtName: 'Pista Central - Club Padel Pro'
  });

  // 4. Teams & Players
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

  // 5. Match ID
  const [matchId] = useState(() => 'PADEL-' + Math.random().toString(36).substring(2, 7).toUpperCase());

  // 6. Score State & Undo History
  const [state, setState] = useState<MatchScoreState>(() => createInitialMatchState(rules));
  const [history, setHistory] = useState<MatchSnapshot[]>([]);

  // 7. Modals
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);

  // 8. Hardware & Audio State
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
  const [isSmartwatchActive, setIsSmartwatchActive] = useState(false);

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

  // Subscribe to Smartwatch Service state
  useEffect(() => {
    const unsubscribe = smartwatchService.subscribeState(s => {
      setIsSmartwatchActive(s.isActive);
    });
    return () => unsubscribe();
  }, []);

  // Update Apple Watch display whenever score changes
  useEffect(() => {
    const curSet = state.sets[state.currentSetIndex] || { team1: 0, team2: 0 };
    smartwatchService.updateScoreDisplay({
      team1Name: teams.team1.name,
      team2Name: teams.team2.name,
      team1Score: String(state.currentGame.team1),
      team2Score: String(state.currentGame.team2),
      team1Games: curSet.team1,
      team2Games: curSet.team2,
      currentSetNum: state.currentSetIndex + 1,
      courtName: rules.courtName || 'PadelMatch',
      isGoldenPoint: !state.isTieBreak && rules.gameRule === 'golden_point' && state.currentGame.team1 === '40' && state.currentGame.team2 === '40',
      isTieBreak: state.isTieBreak
    });
  }, [state, teams, rules]);

  // Handle Match Over & Save to Community History
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
        18 // ELO delta
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

  // Connect Smartwatch Commands
  useEffect(() => {
    const unsubscribe = smartwatchService.subscribeCommand(cmd => {
      if (cmd === 'team1') {
        handleScore('team1');
      } else if (cmd === 'team2') {
        handleScore('team2');
      } else if (cmd === 'undo') {
        handleUndo();
      } else if (cmd === 'repeat') {
        handleRepeatAnnouncement();
      }
    });
    return () => unsubscribe();
  }, [handleScore, handleUndo, handleRepeatAnnouncement]);

  // Hardware Bluetooth Keyboard & Shutter Remote Listeners
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

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Toggle Smartwatch Background Audio Mode
  const handleToggleSmartwatch = async () => {
    ttsService.unlockAudioContext();
    const active = await smartwatchService.toggle();
    if (active) {
      ttsService.speak('Modo Apple Watch activado. Abre En Reproducción en tu reloj.', ttsSettings);
    } else {
      ttsService.speak('Modo Apple Watch desactivado.', ttsSettings);
    }
  };

  // Flow Step 1: User logs in or registers
  const handleUserAuthenticated = (user: UserSession) => {
    setCurrentUser(user);
    setCurrentView('host_dashboard');
  };

  // Flow Step 2: Host confirms match parameters and goes to QR Lobby
  const handleProceedToLobby = () => {
    setCurrentView('lobby_qr');
  };

  // Flow Step 3: All 4 players confirmed in Lobby, setup pairs and go to 2D court alignment
  const handleConfirmLobbyPlayers = (selectedPlayers: [CommunityPlayer, CommunityPlayer, CommunityPlayer, CommunityPlayer]) => {
    const [p1, p2, p3, p4] = selectedPlayers;

    const newTeams: { team1: Team; team2: Team } = {
      team1: {
        id: 'team1',
        name: `${p1.name.split(' ')[0]} / ${p2.name.split(' ')[0]}`,
        color: '#00e676',
        player1: { id: p1.id, name: p1.name, position: 'drive', elo: p1.elo, category: p1.category },
        player2: { id: p2.id, name: p2.name, position: 'reves', elo: p2.elo, category: p2.category }
      },
      team2: {
        id: 'team2',
        name: `${p3.name.split(' ')[0]} / ${p4.name.split(' ')[0]}`,
        color: '#00b0ff',
        player1: { id: p3.id, name: p3.name, position: 'drive', elo: p3.elo, category: p3.category },
        player2: { id: p4.id, name: p4.name, position: 'reves', elo: p4.elo, category: p4.category }
      }
    };

    setTeams(newTeams);
    setCurrentView('court_enrollment');
  };

  // Flow Step 4: Court alignment confirmed -> Start live match!
  const handleStartMatchFromCourt = () => {
    setState(createInitialMatchState(rules));
    setHistory([]);
    setIsVictoryModalOpen(false);
    setCurrentView('scoreboard');

    const startMsg = `Alineación confirmada. Inicia el partido. ${teams.team1.name} contra ${teams.team2.name}. ¡A jugar!`;
    ttsService.speak(startMsg, ttsSettings);
  };

  // Rematch Handler
  const handleRematch = () => {
    setState(createInitialMatchState(rules));
    setHistory([]);
    setIsVictoryModalOpen(false);
    ttsService.speak('Comienza la revancha. ¡Al saque!', ttsSettings);
  };

  // Reset Score to 0-0
  const handleResetMatch = () => {
    setState(createInitialMatchState(rules));
    setHistory([]);
    ttsService.speak('Marcador reiniciado a cero iguales.', ttsSettings);
  };

  // Log out
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentView('auth');
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-deep)' }}>
      {/* FLOW 1: Auth Screen (Login / Register) */}
      {currentView === 'auth' && (
        <AuthScreen onAuthenticated={handleUserAuthenticated} />
      )}

      {/* FLOW 2: Host Dashboard (Profile, Metrics, Match Setup) */}
      {currentView === 'host_dashboard' && currentUser && (
        <HostDashboardView
          user={currentUser}
          rules={rules}
          onUpdateRules={setRules}
          onProceedToLobby={handleProceedToLobby}
          onOpenCommunity={() => setCurrentView('community')}
          onOpenBluetoothModal={() => setIsBluetoothModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* FLOW 3: Real-Time Court QR Lobby (4 Player Slots) */}
      {currentView === 'lobby_qr' && (
        <MatchLobbyQrView
          rules={rules}
          hostUser={currentUser || {
            id: 'guest',
            name: 'Anfitrión',
            email: 'host@padel.cl',
            category: '4ta',
            favoritePosition: 'drive',
            elo: 1200,
            loggedInAt: Date.now()
          }}
          matchId={matchId}
          onConfirmPlayers={handleConfirmLobbyPlayers}
          onBackToDashboard={() => setCurrentView(currentUser ? 'host_dashboard' : 'auth')}
        />
      )}

      {/* FLOW 4: 2D Court Alignment & Partner Assignment */}
      {currentView === 'court_enrollment' && (
        <CourtEnrollmentView
          teams={teams}
          onUpdateTeams={setTeams}
          onProceedToScoreboard={handleStartMatchFromCourt}
          courtName={rules.courtName || 'Pista Central'}
        />
      )}

      {/* FLOW 5: Mobile-First In-Court Live Scoreboard */}
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
          currentUser={currentUser}
          onResetMatch={handleResetMatch}
          onNewMatch={() => setCurrentView('host_dashboard')}
          onLogout={handleLogout}
          isSmartwatchActive={isSmartwatchActive}
          onToggleSmartwatch={handleToggleSmartwatch}
        />
      )}

      {/* VIEW: Community Leaderboard & ELO Rankings */}
      {currentView === 'community' && (
        <CommunityDashboard
          onBackToScoreboard={() => setCurrentView(currentUser ? 'host_dashboard' : 'scoreboard')}
        />
      )}

      {/* VIEW: Giant Court TV Display (B2B Club Mode) */}
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
        onStartMatch={(newRules, newTeams) => {
          setRules(newRules);
          setTeams(newTeams);
          setState(createInitialMatchState(newRules));
          setHistory([]);
          setIsSetupModalOpen(false);
          setCurrentView('scoreboard');
        }}
      />

      {/* QR Code Share Modal */}
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
          setCurrentView('host_dashboard');
        }}
      />
    </div>
  );
}

export default App;
