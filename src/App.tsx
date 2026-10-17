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
import { matchSyncService } from './services/matchSyncService';
import type { SyncedMatchRoom } from './services/matchSyncService';

// Flow Views
import { AuthScreen } from './components/AuthScreen';
import { HostDashboardView } from './components/HostDashboardView';
import { MatchLobbyQrView } from './components/MatchLobbyQrView';
import { CourtEnrollmentView } from './components/CourtEnrollmentView';
import { Scoreboard } from './components/Scoreboard';
import { MatchParticipantJoinView } from './components/MatchParticipantJoinView';
import { CommunityDashboard } from './components/CommunityDashboard';
import { CourtTvDisplay } from './components/CourtTvDisplay';

// Modals
import { BluetoothCalibrationModal } from './components/BluetoothCalibrationModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { MatchSetupModal } from './components/MatchSetupModal';
import { QrShareModal } from './components/QrShareModal';
import { MatchVictoryModal } from './components/MatchVictoryModal';
import { FinishMatchEarlyModal } from './components/FinishMatchEarlyModal';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import { NotificationsModal } from './components/NotificationsModal';

function parseMatchIdFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const match = window.location.hash.match(/match=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function App() {
  // 1. User Authentication Session
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => authService.getCurrentUser());

  useEffect(() => {
    const unsubscribe = authService.subscribe(setCurrentUser);
    return () => unsubscribe();
  }, []);

  // 2. Match Identification & Host/Guest Differentiation
  const [hostCreatedMatchId, setHostCreatedMatchId] = useState<string>(() => {
    const hashId = parseMatchIdFromHash();
    const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('padel_created_match_id') : null;
    if (hashId && hashId !== saved) {
      return ''; // User scanned someone else's match QR code
    }
    if (saved) return saved;
    const newId = 'PADEL-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('padel_created_match_id', newId);
    }
    return newId;
  });

  const [hashMatchId, setHashMatchId] = useState<string | null>(parseMatchIdFromHash);
  const activeMatchId = hashMatchId || hostCreatedMatchId;

  // Synced Room State from Firestore
  const [syncedRoom, setSyncedRoom] = useState<SyncedMatchRoom | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState<boolean>(() => !!parseMatchIdFromHash());

  // Determine whether this client is the host or an invited participant
  const isHost = !hashMatchId || 
                 hashMatchId === hostCreatedMatchId || 
                 (!!syncedRoom && !!currentUser && syncedRoom.hostId === currentUser.id);

  // 3. Active View Navigation
  const [currentView, setCurrentView] = useState<AppViewMode>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.includes('match=')) {
      const hId = parseMatchIdFromHash();
      const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('padel_created_match_id') : null;
      if (hId && hId === saved) {
        return 'lobby_qr';
      }
      return 'participant_join';
    }
    return authService.isAuthenticated() ? 'host_dashboard' : 'auth';
  });

  // Listen to hash changes (e.g. scanning QR code while app tab is open)
  useEffect(() => {
    const handleHashChange = () => {
      const newHashId = parseMatchIdFromHash();
      setHashMatchId(newHashId);
      if (newHashId) {
        const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('padel_created_match_id') : null;
        if (newHashId !== saved) {
          setCurrentView('participant_join');
          setIsLoadingRoom(true);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 4. Match Rules & Configuration
  const [rules, setRules] = useState<MatchRules>({
    format: 'best_of_3',
    gameRule: 'golden_point',
    tieBreakRule: 'standard',
    thirdSetRule: 'super_tiebreak',
    superTieBreakTarget: 10,
    courtName: 'Pista Central - Club Padel Pro'
  });

  // 5. Teams & Players
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

  // 6. Score State & Undo History
  const [state, setState] = useState<MatchScoreState>(() => createInitialMatchState(rules));
  const [history, setHistory] = useState<MatchSnapshot[]>([]);

  // 7. Modals
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [isFinishEarlyModalOpen, setIsFinishEarlyModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

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
  const [matchElapsedSeconds, setMatchElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (currentView === 'scoreboard' && !state.isPaused && !state.isMatchOver) {
      timer = setInterval(() => {
        setMatchElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentView, state.isPaused, state.isMatchOver]);

  // Real-time synchronization of match room
  useEffect(() => {
    if (!activeMatchId) return;

    const unsubscribe = matchSyncService.subscribeMatchRoom(activeMatchId, (room) => {
      setSyncedRoom(room);
      setIsLoadingRoom(false);

      if (!room) return;

      // For participants (invited devices), automatically follow host updates
      if (!isHost) {
        if (room.rules) {
          setRules(room.rules);
        }
        if (room.teams) {
          setTeams(room.teams);
        }
        if (room.scoreState) {
          setState(room.scoreState);
        }

        // Automatic transitions
        if (room.status === 'scoreboard') {
          setCurrentView(prev => prev !== 'scoreboard' ? 'scoreboard' : prev);
        } else if (room.status === 'lobby' && currentView !== 'scoreboard') {
          setCurrentView(prev => prev !== 'participant_join' ? 'participant_join' : prev);
        }
      }
    });

    return () => unsubscribe();
  }, [activeMatchId, isHost, currentView]);

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

  // Update Apple Watch display whenever score, rest or pause changes
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
      isTieBreak: state.isTieBreak,
      isResting: state.isResting,
      restSecondsRemaining: state.restSecondsRemaining,
      isPaused: state.isPaused,
      servingTeamName: teams[state.servingTeam].name
    });
  }, [state, teams, rules]);

  // Rest countdown timer (decrements every 1 second during side change rest)
  useEffect(() => {
    if (!state.isResting || state.isPaused || state.isMatchOver) return;

    if ((state.restSecondsRemaining ?? 0) <= 0) {
      setState(s => ({ ...s, isResting: false, restSecondsRemaining: 0 }));
      const serverTeamName = teams[state.servingTeam].name;
      ttsService.speak(`Tiempo cumplido. A jugar. Al saque ${serverTeamName}.`, ttsSettings);
      return;
    }

    const timer = setInterval(() => {
      setState(s => {
        if (!s.isResting || s.isPaused) return s;
        const nextRemaining = (s.restSecondsRemaining ?? 1) - 1;
        if (nextRemaining <= 0) {
          const serverTeamName = teams[s.servingTeam].name;
          ttsService.speak(`Tiempo cumplido. A jugar. Al saque ${serverTeamName}.`, ttsSettings);
          const nextState = {
            ...s,
            isResting: false,
            restSecondsRemaining: 0,
            sideChangeNeeded: false
          };
          if (isHost && activeMatchId) {
            matchSyncService.updateMatchScore(activeMatchId, nextState);
          }
          return nextState;
        }
        return {
          ...s,
          restSecondsRemaining: nextRemaining
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.isResting, state.isPaused, state.isMatchOver, teams, ttsSettings, isHost, activeMatchId]);

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
        18,
        'completed'
      );
    }
  }, [state.isMatchOver, state.winner, rules.courtName, teams, state.sets]);

  // Skip Rest immediately (from phone button or Apple Watch button)
  const handleSkipRest = useCallback(() => {
    ttsService.unlockAudioContext();
    setState(s => {
      const next = {
        ...s,
        isResting: false,
        restSecondsRemaining: 0,
        sideChangeNeeded: false
      };
      if (activeMatchId) {
        matchSyncService.updateMatchScore(activeMatchId, next);
      }
      return next;
    });
    const serverTeamName = teams[state.servingTeam].name;
    ttsService.speak(`A jugar. Al saque ${serverTeamName}.`, ttsSettings);
  }, [teams, state.servingTeam, ttsSettings, activeMatchId]);

  // Toggle Pause match
  const handleTogglePause = useCallback(() => {
    ttsService.unlockAudioContext();
    setState(s => {
      const willBePaused = !s.isPaused;
      if (willBePaused) {
        ttsService.speak('Partido en pausa.', ttsSettings);
      } else {
        const serverTeamName = teams[s.servingTeam].name;
        ttsService.speak(`Partido reanudado. Al saque ${serverTeamName}.`, ttsSettings);
      }
      const next = {
        ...s,
        isPaused: willBePaused
      };
      if (activeMatchId) {
        matchSyncService.updateMatchScore(activeMatchId, next);
      }
      return next;
    });
  }, [teams, ttsSettings, activeMatchId]);

  // Finish match early with custom status (e.g. unfinished, time expired, retired)
  const handleConfirmEarlyFinish = useCallback((params: {
    status: 'unfinished' | 'completed' | 'retired';
    winner: 'team1' | 'team2' | 'none';
    reasonText: string;
  }) => {
    ttsService.unlockAudioContext();
    setIsFinishEarlyModalOpen(false);

    const finalState: MatchScoreState = {
      ...state,
      isMatchOver: true,
      winner: params.winner === 'none' ? undefined : params.winner,
      isResting: false,
      isPaused: false,
      lastEventAnnouncement: params.reasonText
    };

    setState(finalState);
    if (activeMatchId) {
      matchSyncService.updateMatchStatus(activeMatchId, 'completed');
      matchSyncService.updateMatchScore(activeMatchId, finalState);
    }

    communityService.saveMatchResult(
      rules.courtName || 'Cancha Central',
      teams.team1.name,
      [teams.team1.player1.name, teams.team1.player2.name],
      teams.team2.name,
      [teams.team2.player1.name, teams.team2.player2.name],
      state.sets,
      params.winner,
      18,
      params.status
    );

    ttsService.speak(params.reasonText, ttsSettings);
    setIsVictoryModalOpen(true);
  }, [rules.courtName, teams, state, ttsSettings, activeMatchId]);

  // Core Scoring Callback
  const handleScore = useCallback((scoringTeam: 'team1' | 'team2') => {
    ttsService.unlockAudioContext();

    if (state.isPaused) {
      ttsService.speak('Partido en pausa. Reanuda para continuar.', ttsSettings);
      return;
    }

    // If resting when user taps score, clear rest and proceed with point
    if (state.isResting) {
      handleSkipRest();
    }

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

      if (activeMatchId) {
        matchSyncService.updateMatchScore(activeMatchId, result.nextState);
      }

      return result.nextState;
    });
  }, [state.isPaused, state.isResting, handleSkipRest, rules, teams, ttsSettings, activeMatchId]);

  // Undo Callback
  const handleUndo = useCallback(() => {
    ttsService.unlockAudioContext();
    if (history.length === 0) {
      ttsService.speak('Marcador en cero iguales. Sin puntos para deshacer.', ttsSettings);
      return;
    }

    const lastSnapshot = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    setState(lastSnapshot.state);

    if (activeMatchId) {
      matchSyncService.updateMatchScore(activeMatchId, lastSnapshot.state);
    }

    const undoMsg = 'Punto deshecho. Marcador corregido.';
    ttsService.speak(undoMsg, ttsSettings);
  }, [history, ttsSettings, activeMatchId]);

  // Repeat Score Announcement
  const handleRepeatAnnouncement = useCallback(() => {
    ttsService.unlockAudioContext();
    const curSet = state.sets[state.currentSetIndex] || { team1: 0, team2: 0 };
    const scoreText = state.lastEventAnnouncement || 
      `Marcador actual: ${teams.team1.name} ${state.currentGame.team1}, ${teams.team2.name} ${state.currentGame.team2}. Games: ${curSet.team1} a ${curSet.team2}.`;
    ttsService.speak(scoreText, ttsSettings);
  }, [state, teams, ttsSettings]);

  // Connect Smartwatch Commands
  useEffect(() => {
    const unsubscribe = smartwatchService.subscribeCommand(cmd => {
      if (state.isResting) {
        handleSkipRest();
        return;
      }
      if (state.isPaused) {
        handleTogglePause();
        return;
      }

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
  }, [state.isResting, state.isPaused, handleScore, handleUndo, handleRepeatAnnouncement, handleSkipRest, handleTogglePause]);

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
    if (!hashMatchId) {
      setCurrentView('host_dashboard');
    }
  };

  // Flow Step 2: Host confirms match parameters and goes to QR Lobby
  const handleProceedToLobby = () => {
    let mId = hostCreatedMatchId;
    if (!mId) {
      mId = 'PADEL-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      setHostCreatedMatchId(mId);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('padel_created_match_id', mId);
      }
    }
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
    if (activeMatchId) {
      matchSyncService.updateMatchStatus(activeMatchId, 'court_enrollment', newTeams);
    }
    setCurrentView('court_enrollment');
  };

  // Flow Step 4: Court alignment confirmed -> Start live match!
  const handleStartMatchFromCourt = () => {
    const initialState = createInitialMatchState(rules);
    setState(initialState);
    setHistory([]);
    setIsVictoryModalOpen(false);
    setCurrentView('scoreboard');

    if (activeMatchId) {
      matchSyncService.updateMatchStatus(activeMatchId, 'scoreboard', teams);
      matchSyncService.updateMatchScore(activeMatchId, initialState);
    }

    const startMsg = `Alineación confirmada. Inicia el partido. ${teams.team1.name} contra ${teams.team2.name}. ¡A jugar!`;
    ttsService.speak(startMsg, ttsSettings);
  };

  // Rematch Handler
  const handleRematch = () => {
    const rematchState = createInitialMatchState(rules);
    setState(rematchState);
    setHistory([]);
    setIsVictoryModalOpen(false);
    if (activeMatchId) {
      matchSyncService.updateMatchScore(activeMatchId, rematchState);
    }
    ttsService.speak('Comienza la revancha. ¡Al saque!', ttsSettings);
  };

  // Reset Score to 0-0
  const handleResetMatch = () => {
    const resetState = createInitialMatchState(rules);
    setState(resetState);
    setHistory([]);
    if (activeMatchId) {
      matchSyncService.updateMatchScore(activeMatchId, resetState);
    }
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
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
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
          matchId={activeMatchId}
          onConfirmPlayers={handleConfirmLobbyPlayers}
          onBackToDashboard={() => setCurrentView(currentUser ? 'host_dashboard' : 'auth')}
        />
      )}

      {/* FLOW 4: 2D Court Alignment & Partner Assignment */}
      {currentView === 'court_enrollment' && (
        <CourtEnrollmentView
          teams={teams}
          onUpdateTeams={(newTeams) => {
            setTeams(newTeams);
            if (activeMatchId) {
              matchSyncService.updateMatchStatus(activeMatchId, 'court_enrollment', newTeams);
            }
          }}
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
          onNewMatch={() => {
            if (!isHost && typeof window !== 'undefined') {
              window.location.hash = '';
            }
            setCurrentView(currentUser ? 'host_dashboard' : 'auth');
          }}
          onLogout={handleLogout}
          isSmartwatchActive={isSmartwatchActive}
          onToggleSmartwatch={handleToggleSmartwatch}
          onSkipRest={handleSkipRest}
          onTogglePause={handleTogglePause}
          onOpenFinishEarlyModal={() => setIsFinishEarlyModalOpen(true)}
          isGuestViewer={!isHost}
          hostName={syncedRoom?.hostName}
        />
      )}

      {/* FLOW 6: Participant Join View for QR Scans */}
      {currentView === 'participant_join' && (
        syncedRoom ? (
          <MatchParticipantJoinView
            room={syncedRoom}
            currentUser={currentUser}
            onViewLiveScoreboard={() => setCurrentView('scoreboard')}
            onLogout={handleLogout}
            onExitRoom={() => {
              if (typeof window !== 'undefined') {
                window.location.hash = '';
              }
              setCurrentView(currentUser ? 'host_dashboard' : 'auth');
            }}
          />
        ) : (
          <div style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-deep)',
            color: '#fff',
            padding: '24px',
            textAlign: 'center'
          }}>
            {isLoadingRoom ? (
              <>
                <div className="pulsing-dot" style={{ width: '42px', height: '42px', color: 'var(--team1-primary)', marginBottom: '16px' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Conectando a la Cancha...</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
                  Sincronizando partido en tiempo real
                </p>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger-primary)', marginBottom: '8px' }}>
                  Partido no encontrado
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '360px', marginBottom: '20px' }}>
                  El código del partido no existe o la sala ya ha sido cerrada por el anfitrión.
                </p>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') window.location.hash = '';
                    setCurrentView(currentUser ? 'host_dashboard' : 'auth');
                  }}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', borderRadius: '10px' }}
                >
                  Ir al Inicio
                </button>
              </>
            )}
          </div>
        )
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
          const newInit = createInitialMatchState(newRules);
          setState(newInit);
          setHistory([]);
          setIsSetupModalOpen(false);
          if (activeMatchId) {
            matchSyncService.updateMatchStatus(activeMatchId, 'scoreboard', newTeams);
            matchSyncService.updateMatchScore(activeMatchId, newInit);
          }
          setCurrentView('scoreboard');
        }}
      />

      {/* QR Code Share Modal */}
      <QrShareModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        matchId={activeMatchId}
        courtName={rules.courtName || 'Pista Central'}
        team1Name={teams.team1.name}
        team2Name={teams.team2.name}
      />

      {/* Finish Match Early / Incomplete Match Modal */}
      <FinishMatchEarlyModal
        isOpen={isFinishEarlyModalOpen}
        onClose={() => setIsFinishEarlyModalOpen(false)}
        state={state}
        teams={teams}
        onConfirmFinish={handleConfirmEarlyFinish}
      />

      {/* Match Victory, Confetti & ELO Ratings Modal */}
      <MatchVictoryModal
        isOpen={isVictoryModalOpen}
        state={state}
        teams={teams}
        rules={rules}
        matchElapsedSeconds={matchElapsedSeconds}
        onRematch={handleRematch}
        onNewMatch={() => {
          setIsVictoryModalOpen(false);
          setCurrentView('host_dashboard');
        }}
      />

      {/* Notifications & Open Matches ("Falta 1") Center */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />

      {/* Automatic Guided PWA Installation Prompt (Android 1-Click & iOS Visual Guide) */}
      <InstallPwaPrompt />
    </div>
  );
}

export default App;
