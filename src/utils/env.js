/**
 * 环境检测与风险评估工具
 *
 * 合规说明：不再依据 UserAgent 判断"是否为微信"来决定展示哪套页面。
 * 微信规范 3.2.3 明确禁止"无正当理由通过技术手段限制页面浏览渠道，
 * 导致微信内展示效果和其他浏览器展示效果实质性不一致"，
 * 因此页面内容在微信内外保持一致，仅在链接显式携带 force_external=1 时进入访问说明页。
 */

export function isWechat() {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('micromessenger')
}

export function isWorkWechat() {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('wxwork')
}

export function isQQ() {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('qq/') || ua.includes('mqqbrowser')
}

export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * 是否需要进入访问说明页
 * 只认链接上的显式参数，避免对特定客户端做差别化展示
 */
export function isRiskEnvironment() {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('force_external') === '1'
}

/**
 * 去除 force_external 参数后的查询串（用于在站内正常回跳，避免循环）
 */
export function stripForceExternal(search = window.location.search) {
  const params = new URLSearchParams(search)
  params.delete('force_external')
  const str = params.toString()
  return str ? `?${str}` : ''
}
