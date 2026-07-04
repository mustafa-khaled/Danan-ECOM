import { ConsoleLogger } from "@nestjs/common";

interface LogEntry {
  timestamp: string;
  level: string;
  message: unknown;
  context?: string;
  stack?: unknown;
  [key: string]: unknown;
}

export class JsonLogger extends ConsoleLogger {
  format(pids: Record<string, unknown>): string {
    return JSON.stringify(pids);
  }

  log(message: unknown, ...optional: unknown[]) {
    this.write("info", message, ...optional);
  }

  error(message: unknown, ...optional: unknown[]) {
    this.write("error", message, ...optional);
  }

  warn(message: unknown, ...optional: unknown[]) {
    this.write("warn", message, ...optional);
  }

  debug(message: unknown, ...optional: unknown[]) {
    this.write("debug", message, ...optional);
  }

  verbose(message: unknown, ...optional: unknown[]) {
    this.write("verbose", message, ...optional);
  }

  private write(level: string, message: unknown, ...optional: unknown[]) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: typeof message === "object" ? message : String(message),
    };

    if (level === "error" && optional.length >= 2) {
      entry.stack = optional[0];
      entry.context = String(optional[1]);
    } else if (optional.length >= 1) {
      entry.context = String(optional[0]);
    }

    const output = JSON.stringify(entry) + "\n";
    if (level === "error") {
      process.stderr.write(output);
    } else {
      process.stdout.write(output);
    }
  }
}
