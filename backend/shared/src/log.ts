import { currentCorrelationId } from "./correlation.js";
import { redact } from "./redact.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  child(fields: LogFields): Logger;
}

export interface LogLine {
  ts: string;
  level: LogLevel;
  service: string;
  msg: string;
  correlationId?: string;
  [key: string]: unknown;
}

type Writer = (line: string) => void;

const writers: Record<LogLevel, Writer> = {
  debug: (line) => console.debug(line),
  info: (line) => console.info(line),
  warn: (line) => console.warn(line),
  error: (line) => console.error(line),
};

/**
 * One logger per service. Every line is a single JSON object on stdout/stderr
 * so an operator can grep by `correlationId` or `service` without a parser.
 */
export function createLogger(service: string, base: LogFields = {}): Logger {
  const write = (level: LogLevel, message: string, fields: LogFields = {}): void => {
    const correlationId = currentCorrelationId();
    const cleaned = redact({ ...base, ...fields }) as LogFields;

    const line: LogLine = {
      ts: new Date().toISOString(),
      level,
      service,
      msg: message,
      ...cleaned,
    };

    if (correlationId !== undefined) {
      line.correlationId = correlationId;
    }

    writers[level](JSON.stringify(line));
  };

  return {
    debug: (message, fields) => write("debug", message, fields),
    info: (message, fields) => write("info", message, fields),
    warn: (message, fields) => write("warn", message, fields),
    error: (message, fields) => write("error", message, fields),
    child: (fields) => createLogger(service, { ...base, ...fields }),
  };
}
