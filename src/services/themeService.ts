export type AppTheme = 'day' | 'night';

const THEME_STORAGE_KEY = 'padelmatch_theme_mode';

class ThemeService {
  private currentTheme: AppTheme = 'day';
  private listeners: Set<(theme: AppTheme) => void> = new Set();

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
      if (saved === 'day' || saved === 'night') {
        this.currentTheme = saved;
      } else {
        // Default to day (Social Luminoso y Translúcido)
        this.currentTheme = 'day';
      }
    } catch {
      this.currentTheme = 'day';
    }

    this.applyToDOM(this.currentTheme);
  }

  private applyToDOM(theme: AppTheme) {
    if (typeof document === 'undefined') return;

    document.documentElement.setAttribute('data-theme', theme);

    // Update browser navigation and address bar color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'day' ? '#f1f5f9' : '#070a10');
    }
  }

  public getTheme(): AppTheme {
    return this.currentTheme;
  }

  public setTheme(theme: AppTheme) {
    this.currentTheme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
    this.applyToDOM(theme);
    this.listeners.forEach(l => l(this.currentTheme));
  }

  public toggleTheme(): AppTheme {
    const next = this.currentTheme === 'day' ? 'night' : 'day';
    this.setTheme(next);
    return next;
  }

  public subscribe(listener: (theme: AppTheme) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentTheme);
    return () => this.listeners.delete(listener);
  }
}

export const themeService = new ThemeService();
