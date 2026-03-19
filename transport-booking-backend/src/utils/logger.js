import fs from "node:fs";
import path from "node:path";

const logsDir = path.resolve(process.cwd(), "logs");
const appLogPath = path.join(logsDir, "app.log");
const errorLogPath = path.join(logsDir, "error.log");

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function serialize(details) {
  if (!details) return "";
  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

function writeLine(filePath, level, message, details) {
  ensureLogsDir();
  const line = `${new Date().toISOString()} [${level}] ${message}${details ? ` ${serialize(details)}` : ""}\n`;
  fs.appendFileSync(filePath, line, "utf8");
}

export function logInfo(message, details) {
  writeLine(appLogPath, "INFO", message, details);
}

export function logWarn(message, details) {
  writeLine(appLogPath, "WARN", message, details);
}

export function logError(message, details) {
  writeLine(errorLogPath, "ERROR", message, details);
  writeLine(appLogPath, "ERROR", message, details);
}

export function logPaymentEvent(event, details) {
  logInfo(`payment.${event}`, details);
}
