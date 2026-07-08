import morgan, { StreamOptions } from 'morgan';
import logger from '../utils/logger';
import config from '../config';

const stream: StreamOptions = {
  write: (message: string) => logger.http?.(message.trim()) ?? logger.info(message.trim()),
};

const skip = () => config.env === 'test';

export const httpLogger = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream, skip },
);
