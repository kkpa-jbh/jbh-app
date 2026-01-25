import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  private readonly minLevel: LogLevel;
  private readonly isEnabled: boolean;

  constructor() {
    this.isEnabled = environment.features.enableLogging;

    if (environment.production) {
      this.minLevel = LogLevel.ERROR;
    } else if (environment.features.enableDebugMode) {
      this.minLevel = LogLevel.DEBUG;
    } else {
      this.minLevel = LogLevel.INFO;
    }
  }

  debug(message: string, context?: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, context, ...args);
  }

  info(message: string, context?: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, context, ...args);
  }

  warn(message: string, context?: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, context, ...args);
  }

  error(message: string, context?: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, context, ...args);
  }

  private log(level: LogLevel, message: string, context?: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const prefix = context
      ? `[${timestamp}] [${levelName}] [${context}]`
      : `[${timestamp}] [${levelName}]`;

    const consoleMethod = this.getConsoleMethod(level);
    consoleMethod(prefix, message, ...args);
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isEnabled && level !== LogLevel.ERROR) {
      return false;
    }
    return level >= this.minLevel;
  }

  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug.bind(console);
      case LogLevel.INFO:
        return console.info.bind(console);
      case LogLevel.WARN:
        return console.warn.bind(console);
      case LogLevel.ERROR:
        return console.error.bind(console);
      default:
        return console.log.bind(console);
    }
  }
}
