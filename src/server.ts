import app from './app';
import config from './config';
import logger from './utils/logger';
import { connectDatabase, disconnectDatabase } from './database/connection';
// Importing the models index registers all models & associations.
import './models';

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
  } catch (err) {
    logger.error('Startup aborted: database not reachable', err as Error);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    logger.info(`🚀 ${config.appName} running at http://localhost:${config.port}`);
    logger.info(`   Environment : ${config.env}`);
    logger.info(`   API prefix  : ${config.apiPrefix}`);
    logger.info(`   Health check: http://localhost:${config.port}/health`);
  });

  // ---------- Graceful shutdown ----------
  const shutdown = (signal: string): void => {
    logger.info(`${signal} received. Closing HTTP server...`);
    server.close(async (err) => {
      if (err) {
        logger.error('Error while closing server', err);
        process.exit(1);
      }
      await disconnectDatabase();
      logger.info('HTTP server closed. Bye 👋');
      process.exit(0);
    });

    // Force exit after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Kick off
void startServer();

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  if (config.env === 'production') process.exit(1);
});
