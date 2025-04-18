import { Redis } from 'ioredis';
import { errLogger, infoLogger } from './cloudwatchConfig.js';

const isProduction = process.env.NODE_ENV === 'production';

const redisConfig = isProduction
    ? {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
          retryStrategy: function (retries) {
              if (retries > 10) {
                  errLogger.error('Too many Redis connection retries, stopping retries.');
                  return null;
              }
              return 5000 * retries; // Delay for the next reconnect attempt in milliseconds
          },
      }
    : {
          // Default configuration for development (local Redis server)
          host: 'localhost',
          port: 6379,
      };

const redisClient = new Redis(redisConfig);

// Flush all data during server restart.
// Since we only use redis for updating user status, this works.
// Users who were online during this time will remain online even if they dont
// Unless they actually went online again and went offline, that's when it would
// updated the DB user status
const clearRedisData = async () => {
    try {
        await redisClient.flushall();
        infoLogger.info('Redis data cleared on restart as configured');
    } catch (err) {
        errLogger.error('Redis Flush All Error', { message: err.message });
    }
};

if (process.env.ALLOW_REDIS_FLUSH_ON_RESTART === 'true' && redisClient) {
    await clearRedisData();
}

export default redisClient;
