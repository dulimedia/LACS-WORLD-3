const LOG_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DEBUG === 'true';

const LOG_CATEGORIES = {
  CAMERA: false,
  GLB: false,
  FLOORPLAN: false,
  REQUEST: true,
  ERROR: true,
  PERFORMANCE: false,
  LOADING: false,
  UI: false,
};

type LogCategory = keyof typeof LOG_CATEGORIES;

class Logger {
  private enabled: boolean;
  private categories: Record<LogCategory, boolean>;

  constructor() {
    this.enabled = LOG_ENABLED;
    this.categories = { ...LOG_CATEGORIES };
  }

  enableCategory(category: LogCategory) {
    this.categories[category] = true;
  }

  disableCategory(category: LogCategory) {
    this.categories[category] = false;
  }

  log(category: LogCategory, emoji: string, ...args: any[]) {
    if (!this.enabled || !this.categories[category]) return;
    console.log(`${emoji}`, ...args);
  }

  warn(category: LogCategory, emoji: string, ...args: any[]) {
    if (!this.enabled || !this.categories[category]) return;
    console.warn(`${emoji}`, ...args);
  }

  error(...args: any[]) {
    if (!this.categories.ERROR) return;
    console.error('❌', ...args);
    // Persist errors to localStorage for mobile debugging
    this.persistError(args);
  }

  private persistError(args: any[]) {
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push({
        timestamp: new Date().toISOString(),
        message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
      });
      // Keep last 50 errors
      if (errors.length > 50) errors.shift();
      localStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (e) {
      // Silent fail if localStorage is full
    }
  }

  getPersistedErrors() {
    try {
      return JSON.parse(localStorage.getItem('app_errors') || '[]');
    } catch {
      return [];
    }
  }

  clearPersistedErrors() {
    localStorage.removeItem('app_errors');
  }

  group(category: LogCategory, emoji: string, label: string) {
    if (!this.enabled || !this.categories[category]) return;
    console.group(`${emoji} ${label}`);
  }

  groupEnd() {
    if (!this.enabled) return;
    console.groupEnd();
  }
}

export const logger = new Logger();
