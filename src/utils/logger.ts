import { message } from "telegraf/filters";
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

function formatMessage(level: LogLevel, msg: unknown) {
  const message =
    typeof msg === "string"
      ? msg
      : (msg as { toString: () => string }).toString();

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
