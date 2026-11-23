import { getCorrelationId } from "./correlation.js";
import { redact, redactObject } from "./redact.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  correlationId: string;
  message: string;
  meta?: Record<string, unknown>;
}

export class Logger {
  constructor(private readonly serviceName: string) {}

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      correlationId: getCorrelationId(),
      message: redact(message),
      meta: meta ? redactObject(meta) : undefined,
    };

    const output = JSON.stringify(entry);
    if (level === "error") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }

    return entry;
  }

  debug(message: string, meta?: Record<string, unknown>): LogEntry {
    return this.write("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): LogEntry {
    return this.write("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): LogEntry {
    return this.write("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): LogEntry {
    return this.write("error", message, meta);
  }
}

export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}
