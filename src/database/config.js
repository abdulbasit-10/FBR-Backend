const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

/**
 * sequelize-cli configuration. Kept as .js because sequelize-cli
 * runs plain Node and does not compile TypeScript.
 */
const common = {
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fbr_invoicing',
  logging: (process.env.DB_LOGGING || 'false').toLowerCase() === 'true' ? console.log : false,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    underscored: true,
    timestamps: true,
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    min: parseInt(process.env.DB_POOL_MIN || '0', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
  },
};

module.exports = {
  development: common,
  test: { ...common, database: `${common.database}_test`, logging: false },
  production: { ...common, logging: false },
};
