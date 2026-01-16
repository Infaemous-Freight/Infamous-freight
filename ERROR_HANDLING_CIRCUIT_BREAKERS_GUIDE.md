# Error Handling & Circuit Breakers Guide

## 1. Circuit Breaker Pattern

### Installation

```bash
pnpm add opossum
```

### Circuit Breaker Service

**File: `api/src/services/circuitBreakerService.js`**

```javascript
const CircuitBreaker = require('opossum');

class CircuitBreakerService {
  constructor() {
    this.breakers = new Map();
  }

  // Create circuit breaker
  createBreaker(name, fn, options = {}) {
    const defaultOptions = {
      timeout: options.timeout || 5000, // 5 second timeout
      errorThresholdPercentage: options.errorThresholdPercentage || 50,
      resetTimeout: options.resetTimeout || 30000, // 30 seconds
      name,
    };

    const breaker = new CircuitBreaker(fn, defaultOptions);

    // Log state changes
    breaker.on('open', () => {
      console.warn(`Circuit breaker ${name} OPEN`);
    });

    breaker.on('halfOpen', () => {
      console.info(`Circuit breaker ${name} HALF-OPEN`);
    });

    breaker.on('close', () => {
      console.info(`Circuit breaker ${name} CLOSED`);
    });

    breaker.on('timeout', () => {
      console.warn(`Circuit breaker ${name} TIMEOUT`);
    });

    breaker.on('failure', (error) => {
      console.error(`Circuit breaker ${name} FAILURE`, error.message);
    });

    this.breakers.set(name, breaker);
    return breaker;
  }

  // Get breaker
  getBreaker(name) {
    if (!this.breakers.has(name)) {
      throw new Error(`Circuit breaker ${name} not found`);
    }
    return this.breakers.get(name);
  }

  // Get all breaker stats
  getStats() {
    const stats = {};

    for (const [name, breaker] of this.breakers) {
      stats[name] = {
        state: breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF-OPEN' : 'CLOSED',
        failures: breaker.stats.failures,
        successes: breaker.stats.successes,
        timeouts: breaker.stats.timeouts,
        fires: breaker.stats.fires,
      };
    }

    return stats;
  }
}

module.exports = new CircuitBreakerService();
```

### Using Circuit Breakers

**File: `api/src/services/externalApiService.js`**

```javascript
const axios = require('axios');
const cbService = require('./circuitBreakerService');

// Create breaker for external API
const externalApiBreakerFn = async (endpoint, method = 'GET', data = null) => {
  const url = `https://external-api.example.com${endpoint}`;

  try {
    const config = {
      method,
      url,
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`,
      },
    };

    if (data) config.data = data;

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response?.status >= 500) {
      throw new Error(`External API error: ${error.response.status}`);
    }
    throw error;
  }
};

const externalApiBreaker = cbService.createBreaker(
  'external-api',
  externalApiBreakerFn,
  {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  }
);

// Wrap API call with circuit breaker
async function callExternalAPI(endpoint) {
  try {
    return await externalApiBreaker.fire(endpoint);
  } catch (error) {
    console.error('External API call failed', { endpoint, error: error.message });

    // Fallback behavior
    if (externalApiBreaker.opened) {
      throw new Error('External API is currently unavailable');
    }

    throw error;
  }
}

module.exports = { callExternalAPI, externalApiBreaker };
```

## 2. Retry Strategy with Exponential Backoff

### Retry Service

**File: `api/src/services/retryService.js`**

```javascript
class RetryService {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 100; // ms
    this.maxDelay = 10000; // ms
  }

  // Calculate exponential backoff delay
  calculateBackoff(attempt, baseDelay = this.baseDelay) {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitterFactor = 0.1 + Math.random() * 0.1; // 10-20% jitter
    const delayWithJitter = exponentialDelay * jitterFactor;

    return Math.min(delayWithJitter, this.maxDelay);
  }

  // Retry function with exponential backoff
  async retry(fn, options = {}) {
    const maxRetries = options.maxRetries || this.maxRetries;
    const baseDelay = options.baseDelay || this.baseDelay;
    const retryableErrors = options.retryableErrors || [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
    ];

    let lastError;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        const isRetryable =
          retryableErrors.includes(error.code) ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('timeout');

        if (!isRetryable || attempt > maxRetries) {
          throw error;
        }

        // Wait before retry
        const delay = this.calculateBackoff(attempt, baseDelay);
        console.warn(
          `Retry attempt ${attempt}/${maxRetries} after ${delay}ms`,
          {
            error: error.message,
          }
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Timeout wrapper
  async withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }
}

module.exports = new RetryService();
```

### Using Retry

```javascript
const retryService = require('./services/retryService');

async function fetchDataWithRetry() {
  return retryService.retry(
    async () => {
      const response = await axios.get('https://api.example.com/data');
      return response.data;
    },
    {
      maxRetries: 3,
      baseDelay: 100,
      retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT'],
    }
  );
}
```

## 3. Graceful Degradation

### Fallback Service

**File: `api/src/services/fallbackService.js`**

```javascript
class FallbackService {
  constructor() {
    this.fallbacks = new Map();
    this.cache = new Map();
  }

  // Register fallback handler
  registerFallback(key, fallbackFn) {
    this.fallbacks.set(key, fallbackFn);
  }

  // Get with fallback
  async getWithFallback(key, primaryFn, options = {}) {
    const ttl = options.ttl || 3600000; // 1 hour
    const useCachedOnFailure = options.useCachedOnFailure !== false;

    try {
      // Try primary function
      const result = await primaryFn();

      // Cache result
      this.cache.set(key, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.warn(`Primary function failed for ${key}`, error.message);

      // Try cached data
      if (useCachedOnFailure) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < ttl) {
          console.info(`Using cached data for ${key}`);
          return cached.data;
        }
      }

      // Try fallback function
      if (this.fallbacks.has(key)) {
        console.info(`Using fallback for ${key}`);
        return this.fallbacks.get(key)();
      }

      throw error;
    }
  }

  // Clear cache
  clearCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Get cache stats
  getCacheStats(key) {
    if (!key) return Array.from(this.cache.keys());

    const cached = this.cache.get(key);
    if (!cached) return null;

    return {
      key,
      timestamp: cached.timestamp,
      age: Date.now() - cached.timestamp,
    };
  }
}

module.exports = new FallbackService();
```

### Using Fallbacks

```javascript
const fallbackService = require('./services/fallbackService');

// Register fallback (cached data)
fallbackService.registerFallback('driver:ratings', async () => {
  return {
    averageRating: 4.5,
    totalRatings: 1000,
    source: 'fallback',
  };
});

// Use with fallback
router.get('/drivers/ratings', authenticate, async (req, res, next) => {
  try {
    const ratings = await fallbackService.getWithFallback(
      'driver:ratings',
      async () => {
        return await prisma.driver.aggregate({
          _avg: { rating: true },
          _count: true,
        });
      },
      { ttl: 300000 } // Cache for 5 minutes
    );

    res.json(ratings);
  } catch (err) {
    next(err);
  }
});
```

## 4. Error Handling Middleware

### Global Error Handler

**File: `api/src/middleware/errorHandler.js`**

```javascript
const Sentry = require('@sentry/node');
const logger = require('./logger');
const { HTTP_STATUS } = require('@infamous-freight/shared');

class ErrorHandler {
  constructor() {
    this.errorMap = {
      // Standard errors
      ValidationError: HTTP_STATUS.BAD_REQUEST,
      NotFoundError: HTTP_STATUS.NOT_FOUND,
      UnauthorizedError: HTTP_STATUS.UNAUTHORIZED,
      ForbiddenError: HTTP_STATUS.FORBIDDEN,
      ConflictError: HTTP_STATUS.CONFLICT,

      // Custom errors
      CircuitBreakerOpenError: HTTP_STATUS.SERVICE_UNAVAILABLE,
      TimeoutError: HTTP_STATUS.REQUEST_TIMEOUT,
      ExternalAPIError: HTTP_STATUS.BAD_GATEWAY,
    };
  }

  // Classify error
  classifyError(error) {
    const status = this.errorMap[error.constructor.name] || HTTP_STATUS.INTERNAL_SERVER_ERROR;

    return {
      status,
      message: error.message,
      code: error.code || 'INTERNAL_ERROR',
      isOperational: this.isOperationalError(error),
    };
  }

  // Check if error is operational (expected)
  isOperationalError(error) {
    if (error.isOperational) return true;

    const operationalErrors = [
      'ValidationError',
      'NotFoundError',
      'UnauthorizedError',
      'ConflictError',
    ];

    return operationalErrors.includes(error.constructor.name);
  }

  // Handle error
  handle(error, req, res, next) {
    const classification = this.classifyError(error);

    // Log error
    logger.error('Request error', {
      message: error.message,
      stack: error.stack,
      status: classification.status,
      path: req.path,
      method: req.method,
      correlationId: req.correlationId,
    });

    // Send to Sentry if not operational
    if (!classification.isOperational) {
      Sentry.captureException(error, {
        tags: {
          path: req.path,
          method: req.method,
          status: classification.status,
        },
        user: req.user ? { id: req.user.sub } : undefined,
      });
    }

    // Return error response
    res.status(classification.status).json({
      error: classification.message,
      code: classification.code,
      requestId: req.correlationId,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.details,
      }),
    });
  }
}

const errorHandler = new ErrorHandler();

module.exports = (err, req, res, next) => {
  errorHandler.handle(err, req, res, next);
};
```

## 5. Custom Error Classes

**File: `api/src/errors/index.js`**

```javascript
class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class CircuitBreakerOpenError extends AppError {
  constructor(service) {
    super(`${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE');
  }
}

class TimeoutError extends AppError {
  constructor(message = 'Request timeout') {
    super(message, 408, 'TIMEOUT');
  }
}

class ExternalAPIError extends AppError {
  constructor(service, statusCode) {
    super(`External API error from ${service}`, 502, 'BAD_GATEWAY');
    this.externalStatus = statusCode;
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  CircuitBreakerOpenError,
  TimeoutError,
  ExternalAPIError,
};
```

## 6. Error Recovery Patterns

### Pattern 1: Retry with Circuit Breaker

```javascript
const retryService = require('../services/retryService');
const cbService = require('../services/circuitBreakerService');

const breaker = cbService.createBreaker(
  'email-service',
  async (email, subject, body) => {
    return await retryService.retry(
      async () => {
        return await sendEmail(email, subject, body);
      },
      { maxRetries: 3 }
    );
  }
);

// Usage
router.post('/send-email', authenticate, async (req, res, next) => {
  try {
    const result = await breaker.fire(
      req.body.email,
      req.body.subject,
      req.body.body
    );
    res.json({ success: true, result });
  } catch (error) {
    if (breaker.opened) {
      return res.status(503).json({
        error: 'Email service unavailable, please try again later',
      });
    }
    next(error);
  }
});
```

### Pattern 2: Fallback to Cache

```javascript
const fallbackService = require('../services/fallbackService');

router.get('/user/:id', authenticate, async (req, res, next) => {
  try {
    const user = await fallbackService.getWithFallback(
      `user:${req.params.id}`,
      async () => {
        return await prisma.user.findUnique({
          where: { id: req.params.id },
        });
      },
      { ttl: 300000 }
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});
```

## 7. Testing Error Handling

**File: `api/src/routes/__tests__/errorHandling.test.js`**

```javascript
describe('Error Handling', () => {
  describe('Circuit Breaker', () => {
    it('should open breaker after threshold', async () => {
      const breaker = cbService.createBreaker(
        'test-breaker',
        async () => {
          throw new Error('Service error');
        }
      );

      // Trigger errors
      for (let i = 0; i < 10; i++) {
        try {
          await breaker.fire();
        } catch (e) {
          // Ignore
        }
      }

      expect(breaker.opened).toBe(true);
    });
  });

  describe('Retry', () => {
    it('should retry with exponential backoff', async () => {
      let attempts = 0;

      const result = await retryService.retry(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary error');
          }
          return 'success';
        },
        { maxRetries: 3 }
      );

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });

  describe('Graceful Degradation', () => {
    it('should use fallback when primary fails', async () => {
      fallbackService.registerFallback('test-key', () => ({
        fallback: true,
      }));

      const result = await fallbackService.getWithFallback(
        'test-key',
        async () => {
          throw new Error('Primary failed');
        }
      );

      expect(result.fallback).toBe(true);
    });
  });

  describe('Custom Errors', () => {
    it('should return correct status for ValidationError', async () => {
      const response = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${token}`)
        .send({}); // Missing required fields

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 503 for Circuit Breaker errors', async () => {
      // Force breaker open...
      const response = await request(app)
        .post('/api/email/send')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      // Should return 503 when breaker is open
    });
  });
});
```

## Best Practices

1. **Classify errors properly** - Distinguish operational vs. programmer errors
2. **Set reasonable timeouts** - Prevent hanging requests
3. **Circuit breaker thresholds** - 50% error rate is often good starting point
4. **Monitor error rates** - Alert when they spike
5. **Test error paths** - Don't just test happy path
6. **Document error codes** - Provide error reference for client developers
7. **Log with context** - Include request ID, user, etc. for debugging
8. **Graceful degradation** - Fall back to cached/partial data when possible

