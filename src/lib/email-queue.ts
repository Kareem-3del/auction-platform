/**
 * Production-Ready Email Queue System
 * Uses BullMQ for reliable email sending with retry logic
 */

import { Queue, Worker, type Job } from 'bullmq';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export interface EmailJob {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailJobResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

// Email queue configuration
const QUEUE_NAME = process.env.REDIS_EMAIL_QUEUE_NAME || 'email-queue';
const MAX_RETRIES = parseInt(process.env.EMAIL_MAX_RETRIES || '3');
const RETRY_DELAY = parseInt(process.env.EMAIL_RETRY_DELAY || '60000'); // 1 minute

/**
 * Create email transporter based on environment configuration
 */
function createTransporter(): Transporter {
  // Production SMTP configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    logger.info('Using SMTP transporter', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
    });

    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // SendGrid fallback
  if (process.env.SENDGRID_API_KEY) {
    logger.info('Using SendGrid transporter');

    return nodemailer.createTransporter({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Development/testing configuration
  logger.warn('Using development email transporter (MailHog/localhost)');

  return nodemailer.createTransporter({
    host: 'localhost',
    port: 1025,
    secure: false,
    ignoreTLS: true,
  });
}

/**
 * Email queue for processing email jobs
 */
export class EmailQueue {
  private queue: Queue;
  private worker: Worker | null = null;
  private transporter: Transporter;

  constructor() {
    this.transporter = createTransporter();

    // Create BullMQ queue
    this.queue = new Queue(QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        attempts: MAX_RETRIES,
        backoff: {
          type: 'exponential',
          delay: RETRY_DELAY,
        },
        removeOnComplete: {
          age: 7 * 24 * 3600, // Keep completed jobs for 7 days
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 30 * 24 * 3600, // Keep failed jobs for 30 days
        },
      },
    });

    logger.info('Email queue initialized', { queueName: QUEUE_NAME });
  }

  /**
   * Add email to queue
   */
  async add(emailData: EmailJob, options?: { priority?: number; delay?: number }): Promise<void> {
    try {
      const job = await this.queue.add('send-email', emailData, {
        priority: options?.priority,
        delay: options?.delay,
      });

      logger.email('Email queued', emailData.to, {
        jobId: job.id,
        subject: emailData.subject,
      });
    } catch (error) {
      logger.error('Failed to queue email', error, {
        to: emailData.to,
        subject: emailData.subject,
      });
      throw error;
    }
  }

  /**
   * Start worker to process email jobs
   */
  startWorker() {
    if (this.worker) {
      logger.warn('Email worker already started');
      return;
    }

    this.worker = new Worker(
      QUEUE_NAME,
      async (job: Job<EmailJob>) => {
        return this.processEmailJob(job);
      },
      {
        connection: redis,
        concurrency: 5, // Process 5 emails concurrently
      }
    );

    this.worker.on('completed', (job: Job, result: EmailJobResult) => {
      logger.email('Email sent successfully', job.data.to, {
        jobId: job.id,
        messageId: result.messageId,
        subject: job.data.subject,
      });
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      logger.error('Email job failed', error, {
        jobId: job?.id,
        to: job?.data?.to,
        subject: job?.data?.subject,
        attempts: job?.attemptsMade,
      });
    });

    logger.info('Email worker started');
  }

  /**
   * Process individual email job
   */
  private async processEmailJob(job: Job<EmailJob>): Promise<EmailJobResult> {
    const { to, subject, text, html, from, replyTo, attachments } = job.data;

    try {
      const result = await this.transporter.sendMail({
        from: from || process.env.SMTP_FROM || 'Lebanon Auction <noreply@lebanon-auction.bdaya.tech>',
        to,
        subject,
        text,
        html,
        replyTo,
        attachments,
      });

      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log but don't throw - let BullMQ handle retries
      logger.error('Failed to send email', error, {
        to,
        subject,
        attempt: job.attemptsMade + 1,
        maxAttempts: MAX_RETRIES,
      });

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Stop worker
   */
  async stopWorker() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      logger.info('Email worker stopped');
    }
  }

  /**
   * Get queue stats
   */
  async getStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Close queue connection
   */
  async close() {
    await this.stopWorker();
    await this.queue.close();
    logger.info('Email queue closed');
  }
}

// Singleton instance
let emailQueue: EmailQueue | null = null;

/**
 * Get email queue instance
 */
export function getEmailQueue(): EmailQueue {
  if (!emailQueue) {
    emailQueue = new EmailQueue();

    // Auto-start worker in production
    if (process.env.NODE_ENV === 'production') {
      emailQueue.startWorker();
    }
  }

  return emailQueue;
}

/**
 * Send email (adds to queue)
 */
export async function sendEmail(emailData: EmailJob): Promise<void> {
  const queue = getEmailQueue();
  await queue.add(emailData);
}

/**
 * Send email with high priority
 */
export async function sendPriorityEmail(emailData: EmailJob): Promise<void> {
  const queue = getEmailQueue();
  await queue.add(emailData, { priority: 1 });
}

/**
 * Schedule email for later delivery
 */
export async function scheduleEmail(emailData: EmailJob, delayMs: number): Promise<void> {
  const queue = getEmailQueue();
  await queue.add(emailData, { delay: delayMs });
}
