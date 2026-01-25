/**
 * Configuration for Deadlock Detector
 */

import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  port: number;
  socketPort: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  socketPort: parseInt(process.env.SOCKET_PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/deadlock_detector',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
};

export default config;
