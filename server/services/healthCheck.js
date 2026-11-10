import { CONFIG } from '../config.js'
import { markDomainBlocked } from './domainPool.js'

/**
 * 模拟对域名进行微信官方防红检测 API / 代理节点探针
 */
async function checkDomainWechatStatus(domain) {
  // 生产环境下可调用如微信官方域名检测接口或第三方防红检测 API
  // 此处模拟健康状态检测
  return new Promise((resolve) => {
    setTimeout(() => {
      // 假设概率模拟异常
      const isBlocked = false 
      resolve(isBlocked)
    }, 500)
  })
}

export function startDomainHealthCheckJob() {
  console.log('[定时检测] 域名健康防红检测定时任务已启动 (每 30 秒轮询)')

  setInterval(async () => {
    for (const domain of CONFIG.INITIAL_ENTRY_DOMAINS) {
      try {
        const isBlocked = await checkDomainWechatStatus(domain)
        if (isBlocked) {
          await markDomainBlocked(domain)
        }
      } catch (err) {
        console.error(`[健康检测失败] 域名: ${domain}`, err.message)
      }
    }
  }, 30000)
}
