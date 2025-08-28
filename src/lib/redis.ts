import type { RedisClientType } from 'redis';

import { createClient } from 'redis';

// Redis client singleton
let redisClient: RedisClientType | null = null;
let isConnecting = false;

// Configuration
const REDIS_URL = process.env.REDIS_URL || (process.env.NODE_ENV === 'production' ? 'redis://redis:6379' : 'redis://localhost:6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0');

// Connection options
const redisConfig = {
  url: REDIS_URL,
  password: REDIS_PASSWORD,
  database: REDIS_DB,
  socket: {
    connectTimeout: 10000,
    lazyConnect: true,
    reconnectDelay: 1000,
  },
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
};

/**
 * Get Redis client instance (singleton pattern)
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (isConnecting) {
    // Wait for connection to complete
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (redisClient && redisClient.isOpen) {
      return redisClient;
    }
  }

  isConnecting = true;

  try {
    redisClient = createClient(redisConfig);

    // Error handling
    redisClient.on('error', (error) => {
      console.error('❌ Redis Client Error:', error);
    });

    redisClient.on('connect', () => {
      console.log('🔗 Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis Client Ready');
    });

    redisClient.on('end', () => {
      console.log('🔌 Redis Client Disconnected');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis Client Reconnecting');
    });

    // Connect to Redis
    await redisClient.connect();

    isConnecting = false;
    return redisClient;

  } catch (error) {
    isConnecting = false;
    console.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
      redisClient = null;
      console.log('✅ Redis Client Disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting from Redis:', error);
    }
  }
}

/**
 * Check Redis health
 */
export async function checkRedisHealth(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const client = await getRedisClient();
    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Session management utilities
export class RedisSessionManager {
  private static SESSION_PREFIX = 'session:';
  private static USER_SESSIONS_PREFIX = 'user_sessions:';
  private static DEFAULT_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

  /**
   * Store session data
   */
  static async setSession(sessionId: string, data: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = this.SESSION_PREFIX + sessionId;
      
      await client.setEx(key, ttl, JSON.stringify({
        ...data,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
      }));

      // Also maintain user sessions list
      if (data.userId) {
        const userSessionsKey = this.USER_SESSIONS_PREFIX + data.userId;
        await client.sAdd(userSessionsKey, sessionId);
        await client.expire(userSessionsKey, ttl);
      }

    } catch (error) {
      console.error('Error setting session:', error);
      throw error;
    }
  }

  /**
   * Get session data
   */
  static async getSession(sessionId: string): Promise<any | null> {
    try {
      const client = await getRedisClient();
      const key = this.SESSION_PREFIX + sessionId;
      
      const data = await client.get(key);
      if (!data) {
        return null;
      }

      return JSON.parse(data);

    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Delete session
   */
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = this.SESSION_PREFIX + sessionId;
      
      // Get session data to find userId
      const sessionData = await this.getSession(sessionId);
      
      // Delete session
      await client.del(key);

      // Remove from user sessions list
      if (sessionData?.userId) {
        const userSessionsKey = this.USER_SESSIONS_PREFIX + sessionData.userId;
        await client.sRem(userSessionsKey, sessionId);
      }

    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  /**
   * Delete all sessions for a user
   */
  static async deleteUserSessions(userId: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const userSessionsKey = this.USER_SESSIONS_PREFIX + userId;
      
      // Get all session IDs for the user
      const sessionIds = await client.sMembers(userSessionsKey);
      
      if (sessionIds.length > 0) {
        // Delete all sessions
        const sessionKeys = sessionIds.map(id => this.SESSION_PREFIX + id);
        if (sessionKeys.length > 0) {
          await client.del(sessionKeys);
        }
      }

      // Delete user sessions list
      await client.del(userSessionsKey);

    } catch (error) {
      console.error('Error deleting user sessions:', error);
    }
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<any[]> {
    try {
      const client = await getRedisClient();
      const userSessionsKey = this.USER_SESSIONS_PREFIX + userId;
      
      const sessionIds = await client.sMembers(userSessionsKey);
      const sessions = [];

      for (const sessionId of sessionIds) {
        const sessionData = await this.getSession(sessionId);
        if (sessionData) {
          sessions.push({
            sessionId,
            ...sessionData,
          });
        }
      }

      return sessions;

    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Extend session TTL
   */
  static async extendSession(sessionId: string, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = this.SESSION_PREFIX + sessionId;
      
      await client.expire(key, ttl);

    } catch (error) {
      console.error('Error extending session:', error);
    }
  }
}

// Cache utilities
export class RedisCache {
  private static CACHE_PREFIX = 'cache:';

  /**
   * Set cache value
   */
  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const client = await getRedisClient();
      const cacheKey = this.CACHE_PREFIX + key;
      
      await client.setEx(cacheKey, ttl, JSON.stringify(value));

    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  /**
   * Get cache value
   */
  static async get(key: string): Promise<any | null> {
    try {
      const client = await getRedisClient();
      const cacheKey = this.CACHE_PREFIX + key;
      
      const data = await client.get(cacheKey);
      if (!data) {
        return null;
      }

      return JSON.parse(data);

    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  /**
   * Delete cache value
   */
  static async delete(key: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const cacheKey = this.CACHE_PREFIX + key;
      
      await client.del(cacheKey);

    } catch (error) {
      console.error('Error deleting cache:', error);
    }
  }

  /**
   * Delete cache values by pattern
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const cachePattern = this.CACHE_PREFIX + pattern;
      
      const keys = await client.keys(cachePattern);
      if (keys.length > 0) {
        await client.del(keys);
      }

    } catch (error) {
      console.error('Error deleting cache pattern:', error);
    }
  }
}

// Rate limiting utilities
export class RedisRateLimit {
  private static RATE_LIMIT_PREFIX = 'rate_limit:';

  /**
   * Check and increment rate limit counter
   */
  static async checkRateLimit(
    identifier: string,
    windowSize: number = 900, // 15 minutes
    maxRequests: number = 100
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const client = await getRedisClient();
      const key = this.RATE_LIMIT_PREFIX + identifier;
      
      const current = await client.incr(key);
      
      if (current === 1) {
        await client.expire(key, windowSize);
      }

      const ttl = await client.ttl(key);
      const resetTime = Date.now() + (ttl * 1000);

      return {
        allowed: current <= maxRequests,
        remaining: Math.max(0, maxRequests - current),
        resetTime,
      };

    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: Date.now() + (windowSize * 1000),
      };
    }
  }

  /**
   * Reset rate limit counter
   */
  static async resetRateLimit(identifier: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = this.RATE_LIMIT_PREFIX + identifier;
      
      await client.del(key);

    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }
}

// Pub/Sub utilities for real-time features
export class RedisPubSub {
  private static subscriberClient: RedisClientType | null = null;
  private static publisherClient: RedisClientType | null = null;

  /**
   * Get subscriber client
   */
  private static async getSubscriberClient(): Promise<RedisClientType> {
    if (!this.subscriberClient) {
      this.subscriberClient = createClient(redisConfig);
      await this.subscriberClient.connect();
    }
    return this.subscriberClient;
  }

  /**
   * Get publisher client
   */
  private static async getPublisherClient(): Promise<RedisClientType> {
    if (!this.publisherClient) {
      this.publisherClient = createClient(redisConfig);
      await this.publisherClient.connect();
    }
    return this.publisherClient;
  }

  /**
   * Publish message to channel
   */
  static async publish(channel: string, message: any): Promise<void> {
    try {
      const client = await this.getPublisherClient();
      await client.publish(channel, JSON.stringify(message));
    } catch (error) {
      console.error('Error publishing message:', error);
    }
  }

  /**
   * Subscribe to channel
   */
  static async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      const client = await this.getSubscriberClient();
      await client.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          console.error('Error parsing message:', error);
          callback(message);
        }
      });
    } catch (error) {
      console.error('Error subscribing to channel:', error);
    }
  }

  /**
   * Unsubscribe from channel
   */
  static async unsubscribe(channel: string): Promise<void> {
    try {
      const client = await this.getSubscriberClient();
      await client.unsubscribe(channel);
    } catch (error) {
      console.error('Error unsubscribing from channel:', error);
    }
  }
}

export default redisClient;