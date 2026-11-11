import { CONFIG } from '../config.js'

// Redis 为可选增强能力：未安装 ioredis、未配置 Redis 或连接失败时，
// 自动降级为进程内内存域名池，保证服务照常启动（便于在无 Redis 的托管平台运行）
let redis = null
try {
  const { default: Redis } = await import('ioredis')
  redis = new Redis({
    ...CONFIG.REDIS,
    lazyConnect: false,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('[Redis] 无法连接 Redis，自动降级至内存域名池模式')
        return null
      }
      return Math.min(times * 100, 2000)
    }
  })
  redis.on('error', (err) => {
    console.warn('[Redis Error] ', err.message)
  })
} catch (e) {
  console.warn('[Redis] 未安装 ioredis 或初始化异常，使用内存模式')
}

// 内存兜底域名池
const memoryPool = {
  active: new Set(CONFIG.INITIAL_ENTRY_DOMAINS),
  blocked: new Set()
}

/**
 * 随机获取一个健康的入口域名
 */
export async function getActiveDomain() {
  if (redis && redis.status === 'ready') {
    try {
      const activeDomain = await redis.srandmember('active_entry_domains')
      if (activeDomain) return activeDomain
    } catch (e) {
      console.error('[Redis getActiveDomain]', e.message)
    }
  }

  // 内存兜底
  const activeArray = Array.from(memoryPool.active)
  if (activeArray.length === 0) return CONFIG.INITIAL_ENTRY_DOMAINS[0]
  const randomIndex = Math.floor(Math.random() * activeArray.length)
  return activeArray[randomIndex]
}

/**
 * 检查域名是否被标记为封禁
 */
export async function isDomainBlocked(domain) {
  if (redis && redis.status === 'ready') {
    try {
      const isBlocked = await redis.sismember('blocked_domains', domain)
      return isBlocked === 1
    } catch (e) {
      console.error('[Redis isDomainBlocked]', e.message)
    }
  }

  return memoryPool.blocked.has(domain)
}

/**
 * 标记域名为已封禁并转移
 */
export async function markDomainBlocked(domain) {
  console.warn(`[防封告警] 域名已被标记为封禁已下线: ${domain}`)

  if (redis && redis.status === 'ready') {
    try {
      await redis.sadd('blocked_domains', domain)
      await redis.srem('active_entry_domains', domain)
    } catch (e) {
      console.error('[Redis markDomainBlocked]', e.message)
    }
  }

  memoryPool.blocked.add(domain)
  memoryPool.active.delete(domain)
}

/**
 * 初始化域名资产
 */
export async function initDomainPool() {
  if (redis && redis.status === 'ready') {
    try {
      for (const domain of CONFIG.INITIAL_ENTRY_DOMAINS) {
        const isBlocked = await redis.sismember('blocked_domains', domain)
        if (!isBlocked) {
          await redis.sadd('active_entry_domains', domain)
        }
      }
    } catch (e) {
      console.error('[Redis initDomainPool]', e.message)
    }
  }
}

initDomainPool()
