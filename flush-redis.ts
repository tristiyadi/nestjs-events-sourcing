import Redis from 'ioredis';
import 'dotenv/config';

async function flush() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || 'devpassword123',
  });

  try {
    console.log('Connecting to Redis...');
    await redis.flushall();
    console.log('Successfully flushed all Redis keys.');
  } catch (err) {
    console.error('Failed to flush Redis:', err);
  } finally {
    redis.disconnect();
  }
}

flush();
