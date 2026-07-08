import logger from '../utils/logger';

/**
 * Simple in-process job queue with concurrency, retries and exponential backoff.
 *
 * Purpose: FBR invoice submission (Module 14 of the spec) — we don't want the
 * HTTP request-response cycle to block on network latency to gw.fbr.gov.pk,
 * and we need automatic retry for transient failures.
 *
 * NOT suitable for cluster deployments (state is per-process). If we scale
 * horizontally later, swap this for BullMQ / Redis without changing callers.
 */

export type JobHandler<T> = (data: T) => Promise<void>;

export interface JobOptions {
  maxAttempts?: number;
  backoffMs?: number;
}

interface Job<T> {
  id: number;
  name: string;
  data: T;
  attempts: number;
  maxAttempts: number;
  backoffMs: number;
}

export class Queue<T = unknown> {
  private handler: JobHandler<T>;
  private queued: Job<T>[] = [];
  private running = 0;
  private concurrency: number;
  private nextId = 1;

  constructor(handler: JobHandler<T>, concurrency = 2) {
    this.handler = handler;
    this.concurrency = concurrency;
  }

  add(name: string, data: T, opts: JobOptions = {}): number {
    const job: Job<T> = {
      id: this.nextId++,
      name,
      data,
      attempts: 0,
      maxAttempts: opts.maxAttempts ?? 3,
      backoffMs: opts.backoffMs ?? 2000,
    };
    this.queued.push(job);
    setImmediate(() => this.pump());
    return job.id;
  }

  private async pump(): Promise<void> {
    while (this.running < this.concurrency && this.queued.length > 0) {
      const job = this.queued.shift()!;
      this.running++;
      void this.execute(job).finally(() => {
        this.running--;
        this.pump();
      });
    }
  }

  private async execute(job: Job<T>): Promise<void> {
    job.attempts++;
    try {
      await this.handler(job.data);
      logger.info(`Job "${job.name}" #${job.id} completed`, { attempts: job.attempts });
    } catch (err) {
      const msg = (err as Error).message;
      logger.error(`Job "${job.name}" #${job.id} failed (attempt ${job.attempts})`, { err: msg });

      if (job.attempts < job.maxAttempts) {
        const delay = job.backoffMs * Math.pow(2, job.attempts - 1);
        logger.warn(`Retrying job #${job.id} in ${delay}ms`);
        setTimeout(() => {
          this.queued.push(job);
          this.pump();
        }, delay);
      } else {
        logger.error(`Job "${job.name}" #${job.id} exhausted retries`, { data: job.data });
      }
    }
  }

  get stats() {
    return { queued: this.queued.length, running: this.running };
  }
}
