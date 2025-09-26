# MCP Rate Limiting Implementation Plans

## 🎯 **Objective**
Implement rate limiting for MCP CRUD operations (create, modify) with a maximum of **1 operation per second per PAT (Personal Access Token)**.

---

# 📋 **Plan A: Simple In-Memory Solution**
**(Can be implemented immediately by Cursor without external dependencies)**

## 🚀 **Implementation Approach**
- **In-memory storage** using JavaScript Map objects
- **Process-local rate limiting** (per serverless function instance)
- **Simple time-window tracking** with automatic cleanup
- **No external dependencies** or infrastructure setup required
- **Mock/fake distributed behavior** for development

## 🏗️ **Architecture**

### **File Structure**:
```
app/lib/rate-limiter/
├── SimpleRateLimiter.ts          # In-memory rate limiter
├── RateLimitMiddleware.ts         # MCP tool wrapper
├── types.ts                       # Type definitions
└── index.ts                       # Exports
```

### **Core Implementation**:

#### **SimpleRateLimiter.ts** (~80 lines)
```typescript
interface RateLimitEntry {
  count: number
  windowStart: number
  lastRequest: number
}

export class SimpleRateLimiter {
  private static instance: SimpleRateLimiter
  private rateLimitMap = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  private constructor() {
    // Cleanup expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000)
  }

  static getInstance(): SimpleRateLimiter {
    if (!SimpleRateLimiter.instance) {
      SimpleRateLimiter.instance = new SimpleRateLimiter()
    }
    return SimpleRateLimiter.instance
  }

  async checkRateLimit(patHash: string, operation: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    const key = `${patHash}:${operation}`
    const now = Date.now()
    const windowSize = 1000 // 1 second
    const maxRequests = 1

    const entry = this.rateLimitMap.get(key)

    if (!entry) {
      // First request
      this.rateLimitMap.set(key, {
        count: 1,
        windowStart: now,
        lastRequest: now
      })
      return {
        allowed: true,
        remaining: 0,
        resetTime: now + windowSize
      }
    }

    // Check if we're in a new window
    if (now - entry.windowStart >= windowSize) {
      // New window, reset counter
      entry.count = 1
      entry.windowStart = now
      entry.lastRequest = now
      return {
        allowed: true,
        remaining: 0,
        resetTime: now + windowSize
      }
    }

    // Same window, check limit
    if (entry.count >= maxRequests) {
      const resetTime = entry.windowStart + windowSize
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      }
    }

    // Allow request
    entry.count++
    entry.lastRequest = now
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.windowStart + windowSize
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const expireTime = 5 * 60 * 1000 // 5 minutes

    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (now - entry.lastRequest > expireTime) {
        this.rateLimitMap.delete(key)
      }
    }
  }

  // For testing/debugging
  getStats(): { totalKeys: number; entries: Array<{ key: string; count: number }> } {
    return {
      totalKeys: this.rateLimitMap.size,
      entries: Array.from(this.rateLimitMap.entries()).map(([key, entry]) => ({
        key: key.substring(0, 20) + '...', // Truncate for privacy
        count: entry.count
      }))
    }
  }
}
```

#### **RateLimitMiddleware.ts** (~60 lines)
```typescript
import crypto from 'crypto'
import { SimpleRateLimiter } from './SimpleRateLimiter'

export interface RateLimitedResponse {
  success: boolean
  message: string
  retryAfter?: number
  rateLimitInfo?: {
    remaining: number
    resetTime: number
    limit: number
  }
}

export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  toolFunction: T,
  operationName: string
): T {
  return (async (...args: Parameters<T>) => {
    const rateLimiter = SimpleRateLimiter.getInstance()

    // Extract PAT from environment (simplified for single-user scenario)
    const pat = process.env.GITHUB_TOKEN
    if (!pat) {
      return {
        success: false,
        message: 'GitHub token not available'
      }
    }

    // Hash PAT for privacy
    const patHash = crypto.createHash('sha256').update(pat).digest('hex').substring(0, 16)

    // Check rate limit
    const rateLimitResult = await rateLimiter.checkRateLimit(patHash, operationName)

    if (!rateLimitResult.allowed) {
      console.log(`[Rate Limit] Blocked ${operationName} for PAT ${patHash.substring(0, 8)}...`)

      return {
        success: false,
        message: `Rate limit exceeded. Please wait ${rateLimitResult.retryAfter} seconds before trying again.`,
        retryAfter: rateLimitResult.retryAfter,
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          limit: 1
        }
      } as RateLimitedResponse
    }

    console.log(`[Rate Limit] Allowed ${operationName} for PAT ${patHash.substring(0, 8)}...`)

    // Execute the original function
    try {
      const result = await toolFunction(...args)
      return result
    } catch (error) {
      // Don't count failed operations against rate limit (optional behavior)
      console.error(`[Rate Limit] Operation ${operationName} failed:`, error)
      throw error
    }
  }) as T
}

// Utility function to get rate limiter stats (for debugging)
export function getRateLimiterStats() {
  const rateLimiter = SimpleRateLimiter.getInstance()
  return rateLimiter.getStats()
}
```

#### **Integration Example** (~20 lines)
```typescript
// app/api/mcp/tools/ai-operations.ts
import { withRateLimit } from '@/lib/rate-limiter'

// Original functions
const originalCreateProject = async (params: CreateProjectParams) => { /* ... */ }
const originalModifyProject = async (params: ModifyProjectParams) => { /* ... */ }

// Rate-limited exports
export const aiOperations = {
  // Rate limited operations (1 per second)
  create_project_with_ai: withRateLimit(originalCreateProject, 'create_project'),
  intelligent_project_setup: withRateLimit(originalCreateProject, 'create_project'),
  generate_modification_plan: withRateLimit(originalModifyProject, 'modify_project'),

  // Non-rate limited operations (read-only)
  analyze_project_request: originalAnalyzeProject,
  analyze_existing_project: originalAnalyzeExisting,
  analyze_and_optimize: originalAnalyzeOptimize
}
```

## 📊 **Simple Solution Characteristics**

### **✅ Advantages**:
- **Zero external dependencies** - works immediately
- **No infrastructure setup** required
- **Simple to understand and debug**
- **Fast implementation** (~2 hours of coding)
- **Works in development** without any configuration
- **Automatic cleanup** prevents memory leaks

### **⚠️ Limitations**:
- **Per-instance rate limiting** (each serverless function has its own limits)
- **No persistence** across function cold starts
- **Memory usage** grows with unique PATs (but auto-cleaned)
- **Not truly distributed** - could allow burst across multiple instances
- **Development-focused** - not ideal for high-scale production

### **🎯 Use Cases**:
- **Development and testing**
- **Single-user or low-traffic scenarios**
- **Proof of concept implementation**
- **Quick deployment without infrastructure changes**

---

# 🏢 **Plan B: Production-Grade Distributed Solution**
**(Requires infrastructure setup and external services)**

## 🚀 **Implementation Approach**
- **Distributed rate limiting** using Vercel KV (Redis)
- **Atomic operations** with proper race condition handling
- **Multi-level rate limiting** (per-PAT, burst, global)
- **Comprehensive monitoring** and observability
- **Production-ready error handling** and fallbacks

## 🏗️ **Architecture**

### **Infrastructure Requirements**:
1. **Vercel KV Database** (Redis-compatible)
   - Setup: Enable in Vercel dashboard
   - Cost: ~$20/month for basic tier
   - Configuration: Environment variables

2. **Environment Variables**:
   ```bash
   VERCEL_KV_URL=redis://...
   VERCEL_KV_REST_API_URL=https://...
   VERCEL_KV_REST_API_TOKEN=...
   RATE_LIMIT_ENABLED=true
   ```

### **File Structure**:
```
app/lib/rate-limiter/
├── core/
│   ├── DistributedRateLimiter.ts    # Redis-based rate limiter
│   ├── TokenExtractor.ts            # PAT extraction & validation
│   ├── RateLimitStorage.ts          # Vercel KV operations
│   └── RateLimitMetrics.ts          # Monitoring & analytics
├── middleware/
│   ├── RateLimitMiddleware.ts       # MCP tool wrapper
│   └── RateLimitHeaders.ts          # HTTP header management
├── config/
│   └── RateLimitConfig.ts           # Configuration management
├── types/
│   └── RateLimitTypes.ts            # Type definitions
└── index.ts                         # Service exports
```

### **Core Implementation**:

#### **DistributedRateLimiter.ts** (~200 lines)
```typescript
import { kv } from '@vercel/kv'

export class DistributedRateLimiter {
  async checkRateLimit(
    patHash: string,
    operation: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs
    const key = `rate_limit:${patHash}:${operation}:${windowStart}`

    try {
      // Atomic increment with expiration
      const pipeline = kv.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, Math.ceil(config.windowMs / 1000))

      const results = await pipeline.exec()
      const currentCount = results[0] as number

      const allowed = currentCount <= config.maxRequests
      const remaining = Math.max(0, config.maxRequests - currentCount)
      const resetTime = windowStart + config.windowMs

      if (!allowed) {
        await this.recordRateLimitHit(patHash, operation, false)
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000)
        }
      }

      await this.recordRateLimitHit(patHash, operation, true)
      return {
        allowed: true,
        remaining,
        resetTime
      }
    } catch (error) {
      console.error('[Rate Limiter] Redis error:', error)
      // Fallback to allow request if Redis is down
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      }
    }
  }

  private async recordRateLimitHit(
    patHash: string,
    operation: string,
    allowed: boolean
  ): Promise<void> {
    // Record metrics for monitoring
    const metricsKey = `metrics:${patHash.substring(0, 8)}:${operation}:${Date.now()}`
    await kv.setex(metricsKey, 3600, JSON.stringify({
      timestamp: Date.now(),
      operation,
      allowed,
      patHash: patHash.substring(0, 8) // Partial hash for privacy
    }))
  }
}
```

#### **Multi-Level Rate Limiting** (~150 lines)
```typescript
export class MultiLevelRateLimiter {
  async checkAllLimits(
    patHash: string,
    operation: string
  ): Promise<RateLimitResult> {
    // Check in order of restrictiveness

    // 1. Per-PAT limit (1/second)
    const perPATResult = await this.rateLimiter.checkRateLimit(
      patHash,
      operation,
      RATE_LIMITS.perPAT
    )
    if (!perPATResult.allowed) return perPATResult

    // 2. Per-PAT burst limit (30/minute)
    const burstResult = await this.rateLimiter.checkRateLimit(
      patHash,
      `${operation}_burst`,
      RATE_LIMITS.perPATBurst
    )
    if (!burstResult.allowed) return burstResult

    // 3. Global limit (100/second across all PATs)
    const globalResult = await this.rateLimiter.checkRateLimit(
      'global',
      operation,
      RATE_LIMITS.global
    )
    if (!globalResult.allowed) return globalResult

    return perPATResult // Return the most restrictive successful result
  }
}
```

#### **Comprehensive Monitoring** (~100 lines)
```typescript
export class RateLimitMonitoring {
  async getUsageStats(patHash: string, timeRange: TimeRange): Promise<UsageStats> {
    // Query rate limit usage from Redis
    const pattern = `metrics:${patHash.substring(0, 8)}:*`
    const keys = await kv.keys(pattern)

    const metrics = await Promise.all(
      keys.map(key => kv.get(key))
    )

    return this.aggregateMetrics(metrics, timeRange)
  }

  async getSystemHealth(): Promise<SystemHealth> {
    // Check Redis connectivity, error rates, etc.
    try {
      const testKey = `health_check_${Date.now()}`
      await kv.setex(testKey, 1, 'test')
      await kv.del(testKey)

      return {
        status: 'healthy',
        redis: 'connected',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'degraded',
        redis: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}
```

## 📊 **Production Solution Characteristics**

### **✅ Advantages**:
- **True distributed rate limiting** across all serverless instances
- **Persistent state** survives function cold starts
- **Atomic operations** prevent race conditions
- **Multi-level protection** (per-PAT, burst, global)
- **Comprehensive monitoring** and observability
- **Production-ready** error handling and fallbacks
- **Scalable** to high traffic volumes

### **⚠️ Requirements**:
- **Vercel KV setup** (~$20/month)
- **Environment configuration** (3-4 variables)
- **More complex implementation** (~1-2 weeks)
- **Redis knowledge** for troubleshooting
- **Monitoring setup** for production observability

### **🎯 Use Cases**:
- **Production deployments**
- **Multi-user applications**
- **High-traffic scenarios**
- **Enterprise-grade rate limiting**
- **Compliance requirements**

---

# 🚀 **Implementation Recommendations**

## **Phase 1: Start with Simple Solution** (Immediate)
1. **Implement Plan A** for immediate rate limiting
2. **Test with current usage patterns**
3. **Validate rate limiting behavior**
4. **Gather usage metrics**

## **Phase 2: Upgrade to Production** (When needed)
1. **Setup Vercel KV** when ready for production
2. **Migrate to Plan B** with proper infrastructure
3. **Add comprehensive monitoring**
4. **Implement advanced features**

## **Decision Matrix**:
| Scenario | Recommended Plan | Reasoning |
|----------|------------------|-----------|
| **Development/Testing** | Plan A | No setup required, immediate implementation |
| **Single User** | Plan A | Simple solution sufficient |
| **Low Traffic (<100 ops/day)** | Plan A | Overhead not justified |
| **Production Ready** | Plan B | Proper distributed rate limiting |
| **Multi-User** | Plan B | Consistent limits across users |
| **High Traffic (>1000 ops/day)** | Plan B | Scalable architecture required |
| **Enterprise/Compliance** | Plan B | Audit trails and monitoring required |

---

**🎯 Recommendation**: Start with **Plan A** for immediate implementation, then upgrade to **Plan B** when production requirements demand it. Plan A can be implemented by Cursor in ~2 hours without any external dependencies or user involvement.
