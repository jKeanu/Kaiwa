import { Redis } from 'ioredis';
import { logger } from "./cloudwatchConfig";

const isProduction = process.env.NODE_ENV === 'production'

const redisConfig = isProduction?{
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: function(retries){
    if(retries > 10){
      logger.error("Too many Redis connection retries, stopping retries.");
      return null
    }
    return 5000*retries; // Delay for the next reconnect attempt in milliseconds
  }}:{
  // Default configuration for development (local Redis server)
  host: 'localhost',
  port: 6379
}
  
const redisClient = new Redis(redisConfig)

export default redisClient