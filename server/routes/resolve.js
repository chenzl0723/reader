import express from 'express'
import crypto from 'crypto'
import { CONFIG } from '../config.js'
import { isDomainBlocked, getActiveDomain } from '../services/domainPool.js'

const router = express.Router()

/**
 * 校验签名
 */
function verifySignature(deptId, brokerageUserId, scan, sign) {
  if (!sign) return false
  const rawParams = `deptId=${deptId}&brokerageUserId=${brokerageUserId}&scan=${scan}`
  const expectedSign = crypto.createHmac('sha256', CONFIG.SECRET_KEY).update(rawParams).digest('hex')
  return sign === expectedSign
}

/**
 * 入口路由解析与 302 防封无感重定向调度
 */
router.get('/reader/mine/focusCode', async (req, res, next) => {
  try {
    const currentHost = req.hostname || req.headers.host || ''
    // 提取主域名 (如 tte866f4.entry1.com -> entry1.com)
    const hostParts = currentHost.split(':').shift().split('.')
    const mainDomain = hostParts.length >= 2 ? hostParts.slice(-2).join('.') : currentHost

    // 1. 查询 Redis / 内存中当前域名是否已被封禁
    const blocked = await isDomainBlocked(mainDomain)

    if (blocked) {
      console.warn(`[302 重定向调度] 检测到被封域名: ${mainDomain}，正在实时无感切流...`)
      
      // 提取最新健康的活域名
      const newDomain = await getActiveDomain()
      const newPrefix = crypto.randomBytes(4).toString('hex')
      
      // 保留原有 Query 参数，仅更换入口域名
      const newUrl = `${req.protocol}://${newPrefix}.${newDomain}${req.originalUrl}`
      return res.redirect(302, newUrl)
    }

    // 2. 域名正常，放行由 Vue SPA 打包的静态 index.html / 模板响应
    next()
  } catch (err) {
    next(err)
  }
})

/**
 * API 解析端点 (用于 AJAX 轮询与防护切换)
 */
router.get('/api/resolve', async (req, res) => {
  const { brokerageUserId = '', deptId = '', scan = '1' } = req.query
  const activeDomain = await getActiveDomain()
  const randomPrefix = crypto.randomBytes(4).toString('hex')

  const targetUrl = `http://${randomPrefix}.${activeDomain}/reader/go?brokerageUserId=${brokerageUserId}&deptId=${deptId}&scan=${scan}`

  res.json({
    code: 200,
    url: targetUrl
  })
})

export default router
