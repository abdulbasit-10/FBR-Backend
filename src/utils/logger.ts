import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import config from '../config';

const { combine, timestamp, printf, colorize, errors, json, splat } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}] ${level}: ${stack ?? message}${metaStr}`;
});

const logger = winston.createLogger({
  level: config.log.level,
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), splat()),
  defaultMeta: { service: config.appName },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat,
      ),
    }),
    new DailyRotateFile({
      filename: path.join(config.log.dir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(timestamp(), json()),
    }),
    new DailyRotateFile({
      level: 'error',
      filename: path.join(config.log.dir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: combine(timestamp(), json()),
    }),
  ],
  exitOnError: false,
});

// Silence file transport noise during test runs
if (config.env === 'test') {
  logger.transports.forEach((t) => {
    if (!(t instanceof winston.transports.Console)) {
      t.silent = true;
    }
  });
}

export default logger;
