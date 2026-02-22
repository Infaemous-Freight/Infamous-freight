/**
 * Redis Cache Service Tests
 * Unit tests for RedisCache class and caching middleware
 */

const { describe, it, expect, beforeEach, afterEach, vi } = require("vitest");
const { RedisCache, getCache } = require("../redisCache");

describe("RedisCache", () => {
  let cache;

  beforeEach(() => {
    cache = new RedisCache("redis://localhost:6379");
    // Mock client methods
    cache.client = {
      get: vi.fn(),
      setEx: vi.fn(),
      del: vi.fn(),
      keys: vi.fn(),
      ping: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      on: vi.fn(),
      incrBy: vi.fn(),
      decrBy: vi.fn(),
      sAdd: vi.fn(),
      sIsMember: vi.fn(),
      sMembers: vi.fn(),
      flushAll: vi.fn(),
    };
    cache.connected = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("get()", () => {
    it("should return cached value", async () => {
      const testData = { id: 1, name: "Test" };
      cache.client.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cache.get("test:key");

      expect(result).toEqual(testData);
      expect(cache.stats.hits).toBe(1);
    });

    it("should return null for cache miss", async () => {
      cache.client.get.mockResolvedValue(null);

      const result = await cache.get("test:key");

      expect(result).toBeNull();
      expect(cache.stats.misses).toBe(1);
    });

    it("should handle errors gracefully", async () => {
      cache.client.get.mockRejectedValue(new Error("Redis error"));

      const result = await cache.get("test:key");

      expect(result).toBeNull();
      expect(cache.stats.errors).toBeGreaterThan(0);
    });
  });

  describe("set()", () => {
    it("should set value in cache", async () => {
      const testData = { id: 1, name: "Test" };
      cache.client.setEx.mockResolvedValue("OK");

      const result = await cache.set("test:key", testData);

      expect(result).toBe(true);
      expect(cache.stats.sets).toBe(1);
      expect(cache.client.setEx).toHaveBeenCalledWith(
        "test:key",
        3600,
        JSON.stringify(testData)
      );
    });

    it("should use custom TTL", async () => {
      const testData = { id: 1 };
      cache.client.setEx.mockResolvedValue("OK");

      await cache.set("test:key", testData, 600);

      expect(cache.client.setEx).toHaveBeenCalledWith(
        "test:key",
        600,
        JSON.stringify(testData)
      );
    });

    it("should return false on error", async () => {
      cache.client.setEx.mockRejectedValue(new Error("Redis error"));

      const result = await cache.set("test:key", {});

      expect(result).toBe(false);
      expect(cache.stats.errors).toBeGreaterThan(0);
    });
  });

  describe("getOrCompute()", () => {
    it("should return cached value without computing", async () => {
      const testData = { id: 1 };
      const computeFn = vi.fn();

      cache.client.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cache.getOrCompute("test:key", computeFn);

      expect(result).toEqual(testData);
      expect(computeFn).not.toHaveBeenCalled();
      expect(cache.stats.hits).toBe(1);
    });

    it("should compute and cache value on miss", async () => {
      const testData = { id: 1, computed: true };
      const computeFn = vi.fn().mockResolvedValue(testData);

      cache.client.get.mockResolvedValue(null);
      cache.client.setEx.mockResolvedValue("OK");

      const result = await cache.getOrCompute("test:key", computeFn);

      expect(result).toEqual(testData);
      expect(computeFn).toHaveBeenCalled();
      expect(cache.stats.misses).toBe(1);
      expect(cache.stats.sets).toBe(1);
    });
  });

  describe("delete()", () => {
    it("should delete key from cache", async () => {
      cache.client.del.mockResolvedValue(1);

      const result = await cache.delete("test:key");

      expect(result).toBe(true);
      expect(cache.stats.deletes).toBe(1);
    });

    it("should return false if key not found", async () => {
      cache.client.del.mockResolvedValue(0);

      const result = await cache.delete("test:key");

      expect(result).toBe(false);
    });
  });

  describe("deletePattern()", () => {
    it("should delete all matching keys", async () => {
      const keys = ["shipment:1", "shipment:2", "shipment:3"];
      cache.client.keys.mockResolvedValue(keys);
      cache.client.del.mockResolvedValue(3);

      const result = await cache.deletePattern("shipment:*");

      expect(result).toBe(true);
      expect(cache.stats.deletes).toBe(3);
      expect(cache.client.del).toHaveBeenCalledWith(keys);
    });

    it("should handle no matching keys", async () => {
      cache.client.keys.mockResolvedValue([]);

      const result = await cache.deletePattern("shipment:*");

      expect(result).toBe(true);
      expect(cache.client.del).not.toHaveBeenCalled();
    });
  });

  describe("invalidateEntity()", () => {
    it("should invalidate entity cache", async () => {
      cache.client.keys.mockResolvedValue(["shipment:1", "shipment:2"]);
      cache.client.del.mockResolvedValue(2);

      const result = await cache.invalidateEntity("shipment");

      expect(result).toBe(true);
      expect(cache.client.keys).toHaveBeenCalledWith("shipment:*");
    });

    it("should handle unknown entity types", async () => {
      const result = await cache.invalidateEntity("unknown");

      expect(result).toBe(false);
    });
  });

  describe("getEntity()", () => {
    it("should retrieve cached entity", async () => {
      const testData = { id: 1, name: "Test" };
      cache.client.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cache.getEntity("shipment", 1);

      expect(result).toEqual(testData);
      expect(cache.client.get).toHaveBeenCalledWith("shipment:1");
    });
  });

  describe("setEntity()", () => {
    it("should cache entity with correct TTL", async () => {
      const testData = { id: 1 };
      cache.client.setEx.mockResolvedValue("OK");

      await cache.setEntity("shipment", 1, testData);

      // Shipment TTL is 600 seconds
      expect(cache.client.setEx).toHaveBeenCalledWith(
        "shipment:1",
        600,
        JSON.stringify(testData)
      );
    });
  });

  describe("cacheQuery()", () => {
    it("should return cached query result", async () => {
      const queryResult = [{ id: 1 }, { id: 2 }];
      cache.client.get.mockResolvedValue(JSON.stringify(queryResult));

      const result = await cache.cacheQuery("users:all", async () => {
        throw new Error("Should not execute");
      });

      expect(result).toEqual(queryResult);
      expect(cache.stats.hits).toBe(1);
    });

    it("should execute and cache query on miss", async () => {
      const queryResult = [{ id: 1 }, { id: 2 }];
      const queryFn = vi.fn().mockResolvedValue(queryResult);

      cache.client.get.mockResolvedValue(null);
      cache.client.setEx.mockResolvedValue("OK");

      const result = await cache.cacheQuery("users:all", queryFn);

      expect(result).toEqual(queryResult);
      expect(queryFn).toHaveBeenCalled();
      expect(cache.stats.sets).toBe(1);
    });
  });

  describe("getBatch()", () => {
    it("should retrieve multiple entities", async () => {
      const entity1 = { id: 1 };
      const entity2 = { id: 2 };

      cache.client.get
        .mockResolvedValueOnce(JSON.stringify(entity1))
        .mockResolvedValueOnce(JSON.stringify(entity2));

      const results = await cache.getBatch("shipment", [1, 2]);

      expect(Object.values(results).length).toBe(2);
      expect(cache.stats.hits).toBe(2);
    });
  });

  describe("setBatch()", () => {
    it("should cache multiple entities", async () => {
      cache.client.setEx.mockResolvedValue("OK");

      const count = await cache.setBatch("shipment", {
        1: { id: 1 },
        2: { id: 2 },
      });

      expect(count).toBe(2);
      expect(cache.stats.sets).toBe(2);
    });
  });

  describe("increment()", () => {
    it("should increment counter", async () => {
      cache.client.incrBy.mockResolvedValue(5);

      const result = await cache.increment("counter", 1);

      expect(result).toBe(5);
    });
  });

  describe("decrement()", () => {
    it("should decrement counter", async () => {
      cache.client.decrBy.mockResolvedValue(3);

      const result = await cache.decrement("counter", 2);

      expect(result).toBe(3);
    });
  });

  describe("addToSet()", () => {
    it("should add members to set", async () => {
      cache.client.sAdd.mockResolvedValue(2);

      const result = await cache.addToSet("tags", "urgent", "shipment");

      expect(result).toBe(true);
      expect(cache.client.sAdd).toHaveBeenCalledWith("tags", "urgent", "shipment");
    });
  });

  describe("isMember()", () => {
    it("should check membership", async () => {
      cache.client.sIsMember.mockResolvedValue(true);

      const result = await cache.isMember("tags", "urgent");

      expect(result).toBe(true);
    });
  });

  describe("getStatistics()", () => {
    it("should return cache statistics", () => {
      cache.stats = {
        hits: 50,
        misses: 25,
        sets: 30,
        deletes: 5,
        errors: 0,
      };

      const stats = cache.getStats();

      expect(stats.total).toBe(75);
      expect(stats.hitRate).toBe("66.67%");
      expect(stats.sets).toBe(30);
    });
  });

  describe("isConnected()", () => {
    it("should return true when connected", () => {
      cache.connected = true;
      cache.client = {};

      expect(cache.isConnected()).toBe(true);
    });

    it("should return false when not connected", () => {
      cache.connected = false;

      expect(cache.isConnected()).toBe(false);
    });
  });

  describe("flushAll()", () => {
    it("should clear entire cache", async () => {
      cache.client.flushAll.mockResolvedValue("OK");

      const result = await cache.flushAll();

      expect(result).toBe(true);
      expect(cache.client.flushAll).toHaveBeenCalled();
    });
  });
});
