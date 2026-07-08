import { Sequelize } from 'sequelize';
import config from '../config';
import logger from '../utils/logger';

/**
 * Central Sequelize instance used by the application at runtime.
 * (Migrations use src/database/config.js via sequelize-cli.)
 */
export const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging ? (msg) => logger.debug(msg) : false,
    pool: config.database.pool,
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      underscored: true,
      timestamps: true,
    },
    timezone: '+05:00', // Pakistan Standard Time
  },
);

/** Test the DB connection. Call this at boot; throws on failure. */
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established');
  } catch (err) {
    logger.error('❌ Unable to connect to the database', err as Error);
    throw err;
  }
};

/** Gracefully close DB pool on shutdown */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (err) {
    logger.error('Error closing database connection', err as Error);
  }
};

export default sequelize;
