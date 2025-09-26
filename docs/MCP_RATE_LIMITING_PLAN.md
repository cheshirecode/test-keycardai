# MCP Rate Limiting Implementation Plan

## 🎯 **Objective**
Implement rate limiting for MCP CRUD operations (create, modify) with a maximum of **1 operation per second per PAT (Personal Access Token)** within the current Vercel deployment setup.

## 📊 **Current State Analysis**

### **MCP Operations Requiring Rate Limiting**:
1. **Project Creation**: `create_project_with_ai`, `intelligent_project_setup`
2. **Project Modification**: `generate_modification_plan`, `modify_project_with_ai`
3. **Repository Operations**: `create_repository`, `modify_repository`
4. **GitHub Operations**: Repository creation, file commits, bulk operations

### **Current Architecture**:
- **Deployment**: Vercel serverless functions
- **Authentication**: GitHub PAT via environment variables
- **MCP Tools**: Located in `app/api/mcp/tools/`
- **GitHub Service**: Recently decomposed into focused services
- **No existing rate limiting**: Operations run without throttling

## 🏗️ **Proposed Architecture**

### **1. Rate Limiting Strategy**

#### **Token-Based Rate Limiting**:
- **Key**: GitHub PAT (extracted from request headers or environment)
- **Limit**: 1 operation per second per unique PAT
- **Scope**: CRUD operations only (create, modify, delete)
- **Storage**: Vercel KV (Redis-compatible) for rate limit state

#### **Rate Limiting Levels**:
```typescript
interface RateLimitConfig {
  // Primary limit: 1 operation per second per PAT
  perPAT: {
    windowMs: 1000,     // 1 second
    maxRequests: 1      // 1 operation
  }
  
  // Secondary limit: Burst protection
  perPATBurst: {
    windowMs: 60000,    // 1 minute  
    maxRequests: 30     // 30 operations max per minute
  }
  
  // Global limit: Platform protection
  global: {
    windowMs: 1000,     // 1 second
    maxRequests: 100    // 100 total operations across all PATs
  }
}
```

### **2. Implementation Components**

#### **A. Rate Limiter Service** (`app/lib/rate-limiter/`)
```
app/lib/rate-limiter/
├── core/
│   ├── RateLimiterService.ts     # Main rate limiting logic
│   ├── TokenExtractor.ts         # PAT extraction from requests
│   └── RateLimitStorage.ts       # Vercel KV integration
├── middleware/
│   └── RateLimitMiddleware.ts    # Next.js middleware integration
├── types/
│   └── RateLimitTypes.ts         # Type definitions
└── index.ts                      # Service exports
```

#### **B. Vercel KV Integration**
- **Storage**: Use `@vercel/kv` for rate limit counters
- **Keys**: `rate_limit:${patHash}:${operation}:${window}`
- **TTL**: Automatic expiration based on time windows
- **Atomic Operations**: Increment with expiration

#### **C. MCP Tool Wrapper**
- **Decorator Pattern**: Wrap existing MCP tools with rate limiting
- **Transparent Integration**: No changes to existing tool logic
- **Error Handling**: Return standardized rate limit exceeded responses

### **3. Technical Implementation**

#### **A. Rate Limiter Service**
```typescript
// app/lib/rate-limiter/core/RateLimiterService.ts
export class RateLimiterService {
  constructor(private storage: RateLimitStorage) {}
  
  async checkRateLimit(
    pat: string, 
    operation: string, 
    config: RateLimitConfig
  ): Promise<RateLimitResult>
  
  async consumeRateLimit(
    pat: string, 
    operation: string
  ): Promise<RateLimitResult>
  
  private hashPAT(pat: string): string // SHA-256 hash for privacy
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}
```

#### **B. Token Extraction**
```typescript
// app/lib/rate-limiter/core/TokenExtractor.ts
export class TokenExtractor {
  static extractPAT(request: NextRequest): string | null {
    // 1. Check Authorization header
    // 2. Check custom X-GitHub-Token header  
    // 3. Fall back to environment GITHUB_TOKEN
    // 4. Return null if no token found
  }
  
  static validatePAT(pat: string): boolean {
    // Basic PAT format validation
  }
}
```

#### **C. Vercel KV Storage**
```typescript
// app/lib/rate-limiter/core/RateLimitStorage.ts
export class RateLimitStorage {
  constructor(private kv: VercelKV) {}
  
  async increment(
    key: string, 
    ttl: number
  ): Promise<{ count: number; ttl: number }>
  
  async get(key: string): Promise<number | null>
  
  async reset(key: string): Promise<void>
  
  private generateKey(
    patHash: string, 
    operation: string, 
    window: number
  ): string
}
```

#### **D. MCP Tool Integration**
```typescript
// app/lib/rate-limiter/middleware/RateLimitMiddleware.ts
export function withRateLimit<T extends MCPTool>(
  tool: T,
  config: RateLimitConfig
): T {
  return async (params: any) => {
    const pat = TokenExtractor.extractPAT(request)
    if (!pat) {
      return { success: false, message: 'Authentication required' }
    }
    
    const rateLimitResult = await rateLimiter.consumeRateLimit(
      pat, 
      tool.name, 
      config
    )
    
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining,
          'X-RateLimit-Reset': rateLimitResult.resetTime,
          'Retry-After': rateLimitResult.retryAfter
        }
      }
    }
    
    return await tool(params)
  }
}
```

### **4. Integration Points**

#### **A. MCP Tool Wrapping**
```typescript
// app/api/mcp/tools/ai-operations.ts
import { withRateLimit } from '@/lib/rate-limiter'

export const aiOperations = {
  // Rate limited operations
  create_project_with_ai: withRateLimit(
    originalCreateProject, 
    CRUD_RATE_LIMIT_CONFIG
  ),
  
  generate_modification_plan: withRateLimit(
    originalGenerateModification,
    CRUD_RATE_LIMIT_CONFIG  
  ),
  
  // Non-rate limited operations (read-only)
  analyze_project_request: originalAnalyzeProject,
  analyze_existing_project: originalAnalyzeExisting
}
```

#### **B. GitHub Service Integration**
```typescript
// app/lib/github/core/GitHubAPIClient.ts
export class GitHubAPIClient {
  constructor(
    private config: GitHubServiceConfig,
    private rateLimiter?: RateLimiterService
  ) {}
  
  async request<T>(endpoint: string, options: RequestOptions): Promise<APIResponse<T>> {
    // Apply rate limiting for write operations
    if (this.isWriteOperation(options.method)) {
      const rateLimitResult = await this.rateLimiter?.consumeRateLimit(
        this.token,
        `github_${options.method}_${endpoint}`
      )
      
      if (rateLimitResult && !rateLimitResult.allowed) {
        return {
          success: false,
          message: 'Rate limit exceeded',
          error: 'RATE_LIMIT_EXCEEDED'
        }
      }
    }
    
    // Continue with normal request...
  }
}
```

### **5. Configuration Management**

#### **A. Environment Variables**
```bash
# Vercel Environment Variables
VERCEL_KV_URL=redis://...           # Vercel KV connection
VERCEL_KV_REST_API_URL=https://...  # KV REST API
VERCEL_KV_REST_API_TOKEN=...        # KV API token

# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true             # Feature flag
RATE_LIMIT_PER_PAT_WINDOW=1000      # 1 second
RATE_LIMIT_PER_PAT_MAX=1            # 1 operation
RATE_LIMIT_BURST_WINDOW=60000       # 1 minute
RATE_LIMIT_BURST_MAX=30             # 30 operations
```

#### **B. Rate Limit Configuration**
```typescript
// app/lib/rate-limiter/config.ts
export const RATE_LIMIT_CONFIGS = {
  CRUD_OPERATIONS: {
    perPAT: { windowMs: 1000, maxRequests: 1 },
    perPATBurst: { windowMs: 60000, maxRequests: 30 },
    global: { windowMs: 1000, maxRequests: 100 }
  },
  
  READ_OPERATIONS: {
    // More lenient limits for read operations
    perPAT: { windowMs: 1000, maxRequests: 10 },
    perPATBurst: { windowMs: 60000, maxRequests: 300 }
  }
} as const
```

### **6. Error Handling & User Experience**

#### **A. Rate Limit Response Format**
```typescript
interface RateLimitErrorResponse {
  success: false
  message: string
  error: 'RATE_LIMIT_EXCEEDED'
  retryAfter: number        // Seconds until next allowed request
  rateLimitInfo: {
    limit: number           // Max requests per window
    remaining: number       // Requests remaining in current window
    reset: number          // Unix timestamp when window resets
    window: number         // Window size in milliseconds
  }
}
```

#### **B. Client-Side Handling**
```typescript
// Frontend rate limit handling
export class MCPClient {
  async callTool(toolName: string, params: any): Promise<MCPResponse> {
    const response = await fetch(`/api/mcp/tools/${toolName}`, {
      method: 'POST',
      body: JSON.stringify(params)
    })
    
    if (response.status === 429) {
      const rateLimitInfo = await response.json()
      
      // Show user-friendly rate limit message
      throw new RateLimitError(
        `Rate limit exceeded. Please wait ${rateLimitInfo.retryAfter} seconds.`,
        rateLimitInfo
      )
    }
    
    return response.json()
  }
}
```

### **7. Monitoring & Observability**

#### **A. Rate Limit Metrics**
```typescript
// app/lib/rate-limiter/monitoring/RateLimitMetrics.ts
export class RateLimitMetrics {
  static async recordRateLimitHit(
    patHash: string,
    operation: string,
    allowed: boolean
  ): Promise<void> {
    // Log to Vercel Analytics or external monitoring
    console.log('[Rate Limit]', {
      patHash: patHash.substring(0, 8) + '...', // Partial hash for privacy
      operation,
      allowed,
      timestamp: new Date().toISOString()
    })
  }
  
  static async getUsageStats(
    patHash: string,
    timeRange: TimeRange
  ): Promise<UsageStats> {
    // Query rate limit usage statistics
  }
}
```

#### **B. Health Checks**
```typescript
// app/api/health/rate-limiter/route.ts
export async function GET() {
  try {
    const storage = new RateLimitStorage(kv)
    const testKey = `health_check_${Date.now()}`
    
    // Test KV connectivity
    await storage.increment(testKey, 1)
    await storage.reset(testKey)
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      storage: 'connected'
    })
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 })
  }
}
```

### **8. Testing Strategy**

#### **A. Unit Tests**
```typescript
// app/lib/rate-limiter/__tests__/RateLimiterService.test.ts
describe('RateLimiterService', () => {
  test('should allow request within rate limit', async () => {
    const mockStorage = new MockRateLimitStorage()
    const rateLimiter = new RateLimiterService(mockStorage)
    
    const result = await rateLimiter.consumeRateLimit('test-pat', 'create')
    
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
  })
  
  test('should deny request exceeding rate limit', async () => {
    const mockStorage = new MockRateLimitStorage()
    const rateLimiter = new RateLimiterService(mockStorage)
    
    // First request should succeed
    await rateLimiter.consumeRateLimit('test-pat', 'create')
    
    // Second request within 1 second should fail
    const result = await rateLimiter.consumeRateLimit('test-pat', 'create')
    
    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBeGreaterThan(0)
  })
})
```

#### **B. Integration Tests**
```typescript
// e2e/rate-limiting.spec.ts
test('MCP operations respect rate limits', async ({ page }) => {
  // First operation should succeed
  const response1 = await page.request.post('/api/mcp/tools/create_project_with_ai', {
    data: { description: 'Test project 1' }
  })
  expect(response1.status()).toBe(200)
  
  // Second operation within 1 second should be rate limited
  const response2 = await page.request.post('/api/mcp/tools/create_project_with_ai', {
    data: { description: 'Test project 2' }
  })
  expect(response2.status()).toBe(429)
  
  const rateLimitInfo = await response2.json()
  expect(rateLimitInfo.error).toBe('RATE_LIMIT_EXCEEDED')
  expect(rateLimitInfo.retryAfter).toBeGreaterThan(0)
})
```

## 🚀 **Implementation Phases**

### **Phase 1: Core Infrastructure** (Week 1)
1. **Setup Vercel KV**: Configure KV database for rate limiting
2. **Rate Limiter Service**: Implement core rate limiting logic
3. **Token Extraction**: Build PAT extraction utilities
4. **Basic Testing**: Unit tests for core functionality

### **Phase 2: MCP Integration** (Week 2)
1. **Middleware Development**: Create rate limiting middleware
2. **Tool Wrapping**: Integrate with existing MCP tools
3. **Error Handling**: Implement standardized error responses
4. **Configuration**: Environment-based configuration system

### **Phase 3: GitHub Service Integration** (Week 3)
1. **GitHub API Client**: Add rate limiting to GitHub operations
2. **Service Integration**: Update all GitHub services
3. **Bulk Operations**: Special handling for bulk operations
4. **Performance Testing**: Ensure minimal performance impact

### **Phase 4: Monitoring & Polish** (Week 4)
1. **Metrics & Logging**: Implement comprehensive monitoring
2. **Health Checks**: Add rate limiter health endpoints
3. **Documentation**: User-facing documentation
4. **Integration Testing**: End-to-end testing

## 📊 **Success Metrics**

### **Functional Requirements**:
- ✅ **Rate Limit Enforcement**: 1 operation per second per PAT
- ✅ **Burst Protection**: Maximum 30 operations per minute per PAT
- ✅ **Global Protection**: Maximum 100 operations per second globally
- ✅ **Error Handling**: Clear rate limit exceeded messages
- ✅ **Token Privacy**: PAT hashing for security

### **Performance Requirements**:
- ✅ **Latency Impact**: <50ms additional latency per request
- ✅ **Storage Efficiency**: Minimal KV storage usage
- ✅ **Memory Usage**: <10MB additional memory per function
- ✅ **Reliability**: 99.9% rate limiter availability

### **User Experience**:
- ✅ **Clear Messaging**: User-friendly rate limit messages
- ✅ **Retry Guidance**: Accurate retry-after timing
- ✅ **Graceful Degradation**: System remains functional during rate limiting
- ✅ **Transparency**: Rate limit headers in responses

## 🔒 **Security Considerations**

### **PAT Protection**:
- **Hashing**: SHA-256 hash PATs before storage
- **No Logging**: Never log full PAT values
- **Secure Storage**: Use Vercel KV encryption at rest
- **Access Control**: Limit KV access to rate limiter service

### **Rate Limit Bypass Prevention**:
- **Token Validation**: Verify PAT format and authenticity
- **IP Tracking**: Secondary rate limiting by IP address
- **Anomaly Detection**: Monitor for unusual usage patterns
- **Audit Logging**: Log all rate limit events for security analysis

## 📈 **Future Enhancements**

### **Advanced Features**:
1. **Dynamic Rate Limits**: Adjust limits based on user tier/subscription
2. **Operation Prioritization**: Different limits for different operation types
3. **Quota Management**: Daily/monthly operation quotas
4. **Usage Analytics**: Detailed usage reporting for users

### **Performance Optimizations**:
1. **Local Caching**: Cache rate limit state in function memory
2. **Batch Operations**: Optimize bulk operation rate limiting
3. **Predictive Limiting**: Proactive rate limit warnings
4. **Load Balancing**: Distribute rate limiting across regions

---

**🎯 Goal**: Implement robust, scalable rate limiting for MCP CRUD operations with minimal performance impact and excellent user experience, ensuring fair usage across all PATs while maintaining system stability.
