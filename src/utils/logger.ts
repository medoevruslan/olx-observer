import util from "util";
// src/utils/logger.ts

const Color = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",

  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",
} as const;

type LogLevel = "debug" | "info" | "warn" | "error" | "success";

const levelColor: Record<LogLevel, string> = {
  debug: Color.FgCyan,
  info: Color.FgBlue,
  warn: Color.FgYellow,
  error: Color.FgRed,
  success: Color.FgGreen,
};

function getTimestamp() {
  return new Date().toLocaleString("uk-UA");
}

function toPrettyMessage(msg: unknown): string {
  // Strings stay as-is
  if (typeof msg === "string") return msg;

  // Erorrs get stack trace
  if (msg instanceof Error) {
    return msg.stack || msg.message;
  }

  // Objects & arrays: pretty print
  if (msg && typeof msg === "object") {
    // First try pretty JSON
    return util.inspect(msg, {
      depth: null,
      colors: true,
      compact: false,
    });
  }

  // Numbers, booleans, null, undefined
  return String(msg);
}

function formatMessage(level: LogLevel, msg: unknown) {
  let message = toPrettyMessage(msg);

  const color = levelColor[level];
  const ts = getTimestamp();
  const label = level.toUpperCase().padEnd(7, " ");

  return `${Color.Bright}${Color.FgWhite}[${ts}]${Color.Reset} ${color}${label}${Color.Reset} ${message}`;
}

function log(level: LogLevel, msg: unknown, ...meta: unknown[]) {
  const formatted = formatMessage(level, msg);

  switch (level) {
    case "error":
      console.error(formatted, ...meta);
      break;
    case "warn":
      console.warn(formatted, ...meta);
      break;
    default:
      console.log(formatted, ...meta);
  }
}

export const logger = {
  debug: (msg: unknown, ...meta: unknown[]) => log("debug", msg, ...meta),
  info: (msg: unknown, ...meta: unknown[]) => log("info", msg, ...meta),
  warn: (msg: unknown, ...meta: unknown[]) => log("warn", msg, ...meta),
  error: (msg: unknown, ...meta: unknown[]) => log("error", msg, ...meta),
  success: (msg: unknown, ...meta: unknown[]) => log("success", msg, ...meta),
};
