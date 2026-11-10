import express from 'express'
import crypto from 'crypto'
import { CONFIG } from '../config.js'
import { getActiveDomain } from '../services/domainPool.js'

const router = express.Router()

/**
 * 动态生成防封落地链接 API
 * GET /api/generate-link?brokerageUserId=434&deptId=1&scan=1
 */
router.get('/generate-link', async (req, res) => {
  try {
    const { brokerageUserId = '', deptId = '', scan = '1' } = req.query

    // 1. 获取一个当前健康的入口主域名
    const activeDomain = await getActiveDomain()

    // 2. 生成 8 位随机二级前缀 (例如: tte866f4)
    const randomPrefix = crypto.randomBytes(4).toString('hex')

    // 3. 参数 HMAC-SHA256 签名，防中途篡改
    const rawParams = `deptId=${deptId}&brokerageUserId=${brokerageUserId}&scan=${scan}`
    const sign = crypto.createHmac('sha256', CONFIG.SECRET_KEY).update(rawParams).digest('hex')

    // 4. 最终分发给分销员的防封门面链接
    const shareUrl = `http://${randomPrefix}.${activeDomain}/reader/mine/focusCode?${rawParams}&sign=${sign}`

    res.json({
      code: 200,
      msg: 'success',
      data: {
        shareUrl,
        activeDomain,
        prefix: randomPrefix,
        sign
      }
    })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

export default router
