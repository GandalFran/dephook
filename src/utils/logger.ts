export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

class Logger {
  private currentLevel: LogLevel =
    process.env.NODE_ENV === "test" ? LogLevel.SILENT : LogLevel.INFO;

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  debug(...args: any[]) {
    if (this.currentLevel <= LogLevel.DEBUG) {
      console.debug(...args);
    }
  }

  info(...args: any[]) {
    if (this.currentLevel <= LogLevel.INFO) {
      console.info(...args);
    }
  }

  warn(...args: any[]) {
    if (this.currentLevel <= LogLevel.WARN) {
      console.warn(...args);
    }
  }

  error(...args: any[]) {
    if (this.currentLevel <= LogLevel.ERROR) {
      console.error(...args);
    }
  }
}

export const logger = new Logger();
