const redis = require('redis');

class CacheService {
  constructor() {
    this._client = redis.createClient({
      socket: {
        host: process.env.REDIS_SERVER,
      },
    });

    this._client.on('error', (error) => {
      console.error('Redis Client Error', error);
    });

    (async () => {
      try {
        await this._client.connect();
        console.log('Redis connected');
      } catch (err) {
        console.error('Redis connection failed:', err);
      }
    })();
  }

  async set(key, value, expirationInSecond = 1800) {
    await this._client.set(key, value, {
      EX: expirationInSecond,
    });
  }

  async get(key) {
    const result = await this._client.get(key);
    if (result === null) throw new Error(`Cache untuk key "${key}" tidak ditemukan`);
    return result;
  }

  async delete(key) {
    return this._client.del(key);
  }
}

module.exports = CacheService;
