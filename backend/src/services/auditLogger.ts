import fs from 'fs';
import path from 'path';

export interface AuditLogEntry {
  timestamp: string;
  userId: string;
  action: string;
  details: any;
  agent: string;
  status: 'success' | 'failure';
  duration?: number;
  error?: string;
}

export class AuditLogger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'audit.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const logEntry = {
        ...entry,
        timestamp: new Date().toISOString()
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.promises.appendFile(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  async logAgentInteraction(
    userId: string,
    agent: string,
    action: string,
    details: any,
    status: 'success' | 'failure',
    duration?: number,
    error?: string
  ): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      userId,
      agent,
      action,
      details,
      status,
      duration,
      error
    });
  }

  async logTransaction(
    userId: string,
    action: string,
    details: any,
    status: 'success' | 'failure',
    error?: string
  ): Promise<void> {
    await this.logAgentInteraction(
      userId,
      'TransactionAgent',
      action,
      details,
      status,
      undefined,
      error
    );
  }

  async logFraudDetection(
    userId: string,
    action: string,
    details: any,
    status: 'success' | 'failure',
    error?: string
  ): Promise<void> {
    await this.logAgentInteraction(
      userId,
      'FraudDetectionAgent',
      action,
      details,
      status,
      undefined,
      error
    );
  }

  async logFinancialAdvice(
    userId: string,
    action: string,
    details: any,
    status: 'success' | 'failure',
    error?: string
  ): Promise<void> {
    await this.logAgentInteraction(
      userId,
      'AdvisorAgent',
      action,
      details,
      status,
      undefined,
      error
    );
  }

  async getRecentLogs(limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      const logContent = await fs.promises.readFile(this.logFile, 'utf-8');
      const logs = logContent
        .trim()
        .split('\n')
        .map(line => JSON.parse(line))
        .reverse()
        .slice(0, limit);
      return logs;
    } catch (error) {
      console.error('Failed to read audit logs:', error);
      return [];
    }
  }

  async getLogsByUserId(userId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      const logContent = await fs.promises.readFile(this.logFile, 'utf-8');
      const logs = logContent
        .trim()
        .split('\n')
        .map(line => JSON.parse(line))
        .filter((entry: AuditLogEntry) => entry.userId === userId)
        .reverse()
        .slice(0, limit);
      return logs;
    } catch (error) {
      console.error('Failed to read user audit logs:', error);
      return [];
    }
  }

  async getLogsByAgent(agent: string, limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      const logContent = await fs.promises.readFile(this.logFile, 'utf-8');
      const logs = logContent
        .trim()
        .split('\n')
        .map(line => JSON.parse(line))
        .filter((entry: AuditLogEntry) => entry.agent === agent)
        .reverse()
        .slice(0, limit);
      return logs;
    } catch (error) {
      console.error('Failed to read agent audit logs:', error);
      return [];
    }
  }
} 