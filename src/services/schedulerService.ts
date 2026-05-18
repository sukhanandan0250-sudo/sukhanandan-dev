// src/services/schedulerService.ts - Node.js compatible (no bun:sqlite)
import Database from "better-sqlite3";
import { batchService } from "./batchService";
import { emailService } from "./emailService";
import { notificationService } from "./notificationService";
import type { EmailJob, BatchConfig, ScheduledJob } from "../types";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

class SchedulerService {
  private db: Database.Database;
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor() {
    const dbPath = "./data/scheduler.db";
    const dbDir = dirname(dbPath);

    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
      console.log("📁 Created data directory for scheduler database");
    }

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initDatabase();
    this.startScheduler();
  }

  private initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scheduled_jobs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email_job TEXT NOT NULL,
        batch_config TEXT,
        scheduled_time TEXT NOT NULL,
        notify_email TEXT,
        notify_browser INTEGER DEFAULT 0,
        status TEXT DEFAULT 'scheduled',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        started_at TEXT,
        completed_at TEXT,
        contact_count INTEGER,
        subject TEXT,
        use_batch INTEGER DEFAULT 0,
        config_name TEXT
      )
    `);

    try {
      this.db.exec(`ALTER TABLE scheduled_jobs ADD COLUMN user_id TEXT`);
    } catch {}
    try {
      this.db.exec(`ALTER TABLE scheduled_jobs ADD COLUMN config_name TEXT`);
    } catch {}

    console.log("✅ Scheduler database initialized");
  }

  async scheduleJob(
    userId: string,
    emailJob: EmailJob,
    batchConfig: BatchConfig | null,
    scheduledTime: Date,
    configName: string,
    notifyEmail?: string,
    notifyBrowser?: boolean
  ): Promise<string> {
    const jobId = `sched_${Date.now()}`;
    this.db
      .prepare(
        `INSERT INTO scheduled_jobs 
        (id, user_id, email_job, batch_config, scheduled_time, notify_email, notify_browser, contact_count, subject, use_batch, config_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        jobId,
        userId,
        JSON.stringify(emailJob),
        batchConfig ? JSON.stringify(batchConfig) : null,
        scheduledTime.toISOString(),
        notifyEmail || null,
        notifyBrowser ? 1 : 0,
        emailJob.contacts.length,
        emailJob.subject,
        batchConfig ? 1 : 0,
        configName || "Default Config"
      );
    console.log(
      `📅 Job scheduled: ${jobId} for user ${userId} at ${scheduledTime.toLocaleString()}`
    );
    return jobId;
  }

  private startScheduler() {
    this.schedulerInterval = setInterval(() => {
      this.checkDueJobs();
    }, 60000);
    console.log("⏰ Scheduler started - checking every minute for due jobs");
  }

  private async checkDueJobs() {
    const now = new Date().toISOString();
    const dueJobs = this.db
      .prepare(
        `SELECT * FROM scheduled_jobs WHERE scheduled_time <= ? AND status = 'scheduled' ORDER BY scheduled_time ASC`
      )
      .all(now);
    for (const job of dueJobs) {
      await this.executeScheduledJob(job);
    }
  }

  private async executeScheduledJob(job: any) {
    console.log(
      `🚀 Executing scheduled job: ${job.id} for user: ${job.user_id}`
    );
    try {
      this.db
        .prepare(
          `UPDATE scheduled_jobs SET status = 'running', started_at = ? WHERE id = ?`
        )
        .run(new Date().toISOString(), job.id);

      const emailJob: EmailJob = JSON.parse(job.email_job);
      const batchConfig: BatchConfig | null = job.batch_config
        ? JSON.parse(job.batch_config)
        : null;

      emailService.createTransport(emailJob.config);

      if (job.use_batch && batchConfig) {
        const notificationSettings = job.notify_email
          ? {
              email: job.notify_email,
              userId: job.user_id,
              configName: job.config_name || "Scheduled Batch Job",
            }
          : undefined;
        await batchService.startBatchJob(
          emailJob,
          batchConfig,
          notificationSettings
        );
        this.monitorBatchJobCompletionOnly(job.id);
      } else {
        const notificationSettings = job.notify_email
          ? {
              email: job.notify_email,
              userId: job.user_id,
              configName: job.config_name || "Scheduled Bulk Job",
            }
          : undefined;
        await emailService.sendBulkEmails(emailJob, notificationSettings);
        await this.completeScheduledJobWithNotification(
          job.id,
          job.notify_email,
          job.notify_browser,
          job.user_id,
          job.config_name
        );
      }
    } catch (error) {
      console.error(`❌ Scheduled job ${job.id} failed:`, error);
      this.db
        .prepare(`UPDATE scheduled_jobs SET status = 'failed' WHERE id = ?`)
        .run(job.id);
    }
  }

  private async monitorBatchJobCompletionOnly(jobId: string) {
    const checkCompletion = async () => {
      const batchStatus = batchService.getBatchStatus();
      if (!batchStatus.isRunning) {
        this.db
          .prepare(
            `UPDATE scheduled_jobs SET status = 'completed', completed_at = ? WHERE id = ?`
          )
          .run(new Date().toISOString(), jobId);
        return;
      }
      setTimeout(checkCompletion, 30000);
    };
    setTimeout(checkCompletion, 30000);
  }

  private async completeScheduledJobWithNotification(
    jobId: string,
    notifyEmail?: string,
    notifyBrowser?: boolean,
    userId?: string,
    configName?: string
  ) {
    const completedAt = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE scheduled_jobs SET status = 'completed', completed_at = ? WHERE id = ?`
      )
      .run(completedAt, jobId);
    console.log(`✅ Scheduled job ${jobId} completed`);
    if (notifyEmail && userId) {
      const job = this.db
        .prepare(`SELECT * FROM scheduled_jobs WHERE id = ?`)
        .get(jobId);
      await this.sendAdvancedCompletionNotification(
        jobId,
        notifyEmail,
        job,
        userId,
        configName
      );
    }
  }

  private async sendAdvancedCompletionNotification(
    jobId: string,
    notifyEmail: string,
    job: any,
    userId: string,
    configName?: string
  ): Promise<void> {
    try {
      const stats = notificationService.getCampaignStats(jobId);
      const jobDetails = {
        id: jobId,
        subject: job.subject || "Scheduled Email Campaign",
        startTime: job.started_at,
        endTime: job.completed_at,
        configUsed:
          configName || job.config_name || "Scheduled Job Configuration",
        batchMode: false,
      };
      await notificationService.sendJobCompletionNotification(
        userId,
        notifyEmail,
        stats,
        jobDetails,
        jobDetails.configUsed
      );
    } catch (error) {
      console.error("❌ Failed to send notification:", error);
    }
  }

  getScheduledJobs(): any[] {
    return this.db
      .prepare(
        `SELECT id, user_id, scheduled_time, status, contact_count, subject, use_batch, notify_email, config_name
         FROM scheduled_jobs WHERE status IN ('scheduled', 'running') ORDER BY scheduled_time ASC`
      )
      .all();
  }

  async cancelScheduledJob(jobId: string): Promise<boolean> {
    try {
      const result = this.db
        .prepare(
          `UPDATE scheduled_jobs SET status = 'cancelled' WHERE id = ? AND status = 'scheduled'`
        )
        .run(jobId);
      return (result as any).changes > 0;
    } catch {
      return false;
    }
  }

  getJobHistory(limit: number = 50): any[] {
    return this.db
      .prepare(
        `SELECT * FROM scheduled_jobs ORDER BY created_at DESC LIMIT ?`
      )
      .all(limit);
  }

  getUserScheduledJobs(userId: string): any[] {
    return this.db
      .prepare(
        `SELECT id, scheduled_time, status, contact_count, subject, use_batch, notify_email, config_name
         FROM scheduled_jobs WHERE user_id = ? AND status IN ('scheduled', 'running') ORDER BY scheduled_time ASC`
      )
      .all(userId);
  }
}

export const schedulerService = new SchedulerService();
