import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CacheManagerService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Guarda un valor en caché con una clave y TTL opcional.
   */
  async setCache<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl ? ttl : 0);
  }

  /**
   * Obtiene un valor desde el caché.
   */
  async getCache<T>(key: string): Promise<T | null> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Elimina una clave del caché.
   */
  async delCache(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Verifica si una clave existe en caché.
   */
  async hasKey(key: string): Promise<boolean> {
    const value = await this.cacheManager.get(key);
    return value !== null && value !== undefined;
  }

  /**
   * Guarda una sesión en Redis con un TTL opcional.
   */
  async setSession(userId: string, sessionData: any, ttl = 3600): Promise<void> {
    const sessionKey = `session:${userId}`;
    await this.cacheManager.set(sessionKey, sessionData, ttl );
  }

  /**
   * Obtiene una sesión desde Redis.
   */
  async getSession(userId: string): Promise<any | null> {
    const sessionKey = `session:${userId}`;
    return await this.cacheManager.get(sessionKey);
  }

  /**
   * Elimina una sesión de Redis.
   */
  async delSession(userId: string): Promise<void> {
    const sessionKey = `session:${userId}`;
    await this.cacheManager.del(sessionKey);
  }
}
