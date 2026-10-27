/**
 * PadelMatch - Smartwatch & Apple Watch Remote Controller Service
 * 
 * Works with watchOS (Apple Watch Series 1, 2, 3, 4, 5, 6, 7, 8, Ultra, SE)
 * and Wear OS / HarmonyOS via HTML5 Media Session API + Background Audio Loop.
 * 
 * Technical Fix for Apple Watch Series 1 & iOS Safari:
 * 1. An actual audio file (/silence.wav) with real duration is required so iOS Safari
 *    recognizes it as a seekable media track.
 * 2. setPositionState({ duration: 600, position: 300 }) is set so iOS/watchOS leaves
 *    BOTH [⏮] Previous and [⏭] Next buttons permanently enabled (not greyed out).
 * 3. Both previoustrack/seekbackward and nexttrack/seekforward are bound to ensure
 *    compatibility whether watchOS is in Track mode or Scrub/Podcast mode.
 * 4. Pause and Play are bound with immediate playback resumption so iOS never drops
 *    the active audio session.
 */

import { ttsService } from './ttsService';

export interface SmartwatchState {
  isActive: boolean;
  isAudioPlaying: boolean;
  lastCommand: string | null;
  lastCommandTime: number | null;
}

type CommandListener = (command: 'team1' | 'team2' | 'undo' | 'repeat') => void;
type StateListener = (state: SmartwatchState) => void;

class SmartwatchService {
  private audioElement: HTMLAudioElement | null = null;
  private isActive: boolean = false;
  private commandListeners: Set<CommandListener> = new Set();
  private stateListeners: Set<StateListener> = new Set();
  private lastCommand: string | null = null;
  private lastCommandTime: number | null = null;

  // 5-second PCM 8kHz mono silent WAV base64 fallback
  private readonly FALLBACK_SILENT_WAV = 
    'data:audio/wav;base64,UklGRiRxAgBXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQBxAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

  constructor() {
    this.initAudioElement();
    this.setupTTSSync();
  }

  private setupTTSSync() {
    if (typeof window === 'undefined') return;
    try {
      ttsService.subscribeSpeakingState(isSpeaking => {
        // When speech finishes, if background audio was paused by iOS system ducking, resume it immediately
        if (!isSpeaking && this.isActive && this.audioElement && this.audioElement.paused) {
          setTimeout(() => {
            if (this.isActive && this.audioElement && this.audioElement.paused) {
              this.audioElement.play().catch(() => {});
              this.forceKeepPlayingState();
            }
          }, 80);
        }
      });
    } catch (e) {
      console.warn('SmartwatchService: TTS sync setup error', e);
    }
  }

  private initAudioElement() {
    if (typeof window === 'undefined') return;

    try {
      const audio = new Audio();
      // Prefer real public URL /silence.wav for proper range headers & duration
      audio.src = '/silence.wav';
      audio.loop = true;
      audio.volume = 0.05; // Audible enough for iOS audio daemon, practically silent
      audio.preload = 'auto';
      (audio as any).playsInline = true;
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');

      audio.onerror = () => {
        // Fallback to data URI if offline / path issues
        audio.src = this.FALLBACK_SILENT_WAV;
      };

      this.audioElement = audio;
    } catch (e) {
      console.warn('SmartwatchService: audio element init error', e);
    }
  }

  /**
   * Activates Apple Watch background sync.
   * MUST be called from a user gesture (e.g. click/tap) so iOS Safari permits audio playback.
   */
  public async activate(): Promise<boolean> {
    if (!this.audioElement) {
      this.initAudioElement();
    }

    try {
      if (this.audioElement) {
        // Seek to 1 second so iOS knows it has duration and position
        try {
          this.audioElement.currentTime = 1.0;
        } catch {
          // ignore
        }
        await this.audioElement.play();
      }
      this.isActive = true;
      this.setupMediaSessionHandlers();
      this.forceKeepPlayingState();
      this.notifyState();
      return true;
    } catch (err) {
      console.warn('SmartwatchService: audio play error', err);
      this.isActive = true;
      this.setupMediaSessionHandlers();
      this.notifyState();
      return false;
    }
  }

  public deactivate() {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
      } catch {
        // ignore
      }
    }
    this.isActive = false;
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
    this.notifyState();
  }

  public toggle(): Promise<boolean> {
    if (this.isActive) {
      this.deactivate();
      return Promise.resolve(false);
    } else {
      return this.activate();
    }
  }

  public getState(): SmartwatchState {
    return {
      isActive: this.isActive,
      isAudioPlaying: !!(this.audioElement && !this.audioElement.paused),
      lastCommand: this.lastCommand,
      lastCommandTime: this.lastCommandTime
    };
  }

  /**
   * Updates the live score text displayed on the Apple Watch / lock screen.
   */
  public updateScoreDisplay(params: {
    team1Name: string;
    team2Name: string;
    team1Score: string;
    team2Score: string;
    team1Games: number;
    team2Games: number;
    currentSetNum: number;
    courtName: string;
    isGoldenPoint?: boolean;
    isTieBreak?: boolean;
    isResting?: boolean;
    restSecondsRemaining?: number;
    isPaused?: boolean;
    servingTeamName?: string;
  }) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      let title = '';
      let artist = '';
      let album = '';

      if (params.isPaused) {
        title = '⏸ PARTIDO EN PAUSA';
        artist = `${params.team1Name} vs ${params.team2Name} • Toca para reanudar`;
        album = `${params.courtName} | PadelMatch`;
      } else if (params.isResting && (params.restSecondsRemaining ?? 0) > 0) {
        const remaining = params.restSecondsRemaining || 0;
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        title = `⏱ DESCANSO: ${timeFormatted}`;
        artist = `Al saque: ${params.servingTeamName || params.team1Name} • Toca para jugar ya`;
        album = `Cambio de Lado | ${params.courtName}`;
      } else {
        const stateSuffix = params.isGoldenPoint 
          ? ' [PUNTO DE ORO]' 
          : params.isTieBreak 
            ? ' [TIE-BREAK]' 
            : '';

        title = `🎾 ${params.team1Score} - ${params.team2Score}${stateSuffix}`;
        artist = `${params.team1Name} (${params.team1Games}) vs ${params.team2Name} (${params.team2Games}) • Set ${params.currentSetNum}`;
        album = `${params.courtName} | PadelMatch`;
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: [
          { src: '/favicon.svg', sizes: '96x96', type: 'image/svg+xml' },
          { src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' }
        ]
      });

      this.forceKeepPlayingState();
    } catch (e) {
      // mediaSession metadata might fail on older browsers
    }
  }

  /**
   * Forces iOS / watchOS to see an active playing track in the middle of playback.
   * This ensures the Previous and Next track buttons are ALWAYS ACTIVE and never disabled.
   */
  private forceKeepPlayingState() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.playbackState = 'playing';

      if ('setPositionState' in navigator.mediaSession) {
        navigator.mediaSession.setPositionState({
          duration: 600, // 10 minutes simulated duration
          playbackRate: 1.0,
          position: 300  // Exactly in the middle so [⏮] and [⏭] are both enabled!
        });
      }
    } catch {
      // ignore
    }
  }

  private setupMediaSessionHandlers() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      // 1. Previous Track [⏮] -> Point Team 1
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.triggerCommand('team1');
        this.forceKeepPlayingState();
      });

      // 2. Seek Backward (watchOS Scrub Mode [↺15]) -> Point Team 1
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        this.triggerCommand('team1');
        this.forceKeepPlayingState();
      });

      // 3. Next Track [⏭] -> Point Team 2
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        this.triggerCommand('team2');
        this.forceKeepPlayingState();
      });

      // 4. Seek Forward (watchOS Scrub Mode [↻15]) -> Point Team 2
      navigator.mediaSession.setActionHandler('seekforward', () => {
        this.triggerCommand('team2');
        this.forceKeepPlayingState();
      });

      // 5. Pause Button [⏸] / OS Audio Interruption -> Maintain playback (NEVER trigger undo!)
      navigator.mediaSession.setActionHandler('pause', () => {
        // CRITICAL BUGFIX: In iOS Safari and Android/WearOS, system audio ducking
        // (triggered whenever TTS speaks the score) automatically dispatches 'pause'.
        // Mapping 'pause' to 'undo' caused every scored point to be immediately undone.
        // We now safely resume background playback so the watch connection stays alive.
        if (this.isActive && this.audioElement) {
          setTimeout(() => {
            if (this.isActive && this.audioElement && this.audioElement.paused) {
              this.audioElement.play().catch(() => {});
              this.forceKeepPlayingState();
            }
          }, 120);
        }
      });

      // 6. Play Button [▶] -> Repeat score announcement (and resume playback)
      navigator.mediaSession.setActionHandler('play', () => {
        this.triggerCommand('repeat');
        if (this.isActive && this.audioElement) {
          this.audioElement.play().catch(() => {});
          this.forceKeepPlayingState();
        }
      });

      // 7. Stop Button -> Repeat score announcement
      navigator.mediaSession.setActionHandler('stop', () => {
        this.triggerCommand('repeat');
        this.forceKeepPlayingState();
      });

    } catch (e) {
      console.warn('SmartwatchService: media session handlers setup error', e);
    }
  }

  private readonly DEBOUNCE_MS = 500; // Protection against Apple Watch duplicate events (nexttrack + seekforward) and crown scrub bursts

  private triggerCommand(command: 'team1' | 'team2' | 'undo' | 'repeat') {
    const now = Date.now();
    // Debounce guard: Drop duplicate commands arriving within 500ms
    if (this.lastCommandTime && now - this.lastCommandTime < this.DEBOUNCE_MS) {
      console.warn(`[SmartwatchService] Command '${command}' debounced (${now - this.lastCommandTime}ms since last event)`);
      return;
    }

    this.lastCommand = command;
    this.lastCommandTime = now;

    // Haptic feedback on phone
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(command === 'undo' ? [60, 40, 60] : [80]);
      } catch {
        // ignore
      }
    }

    this.commandListeners.forEach(listener => {
      try {
        listener(command);
      } catch (err) {
        console.error('Error in smartwatch command listener:', err);
      }
    });

    this.notifyState();
  }

  public subscribeCommand(listener: CommandListener): () => void {
    this.commandListeners.add(listener);
    return () => this.commandListeners.delete(listener);
  }

  public subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => this.stateListeners.delete(listener);
  }

  private notifyState() {
    const s = this.getState();
    this.stateListeners.forEach(l => l(s));
  }
}

export const smartwatchService = new SmartwatchService();
