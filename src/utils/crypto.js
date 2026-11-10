/**
 * 需过滤的微信/第三方回调冗余参数黑名单
 */
export const IGNORED_PARAMS = ['code', 'state', 'appid', 'svapid', 'connect_redirect', 'force_external']

export function isIgnoredParam(key = '') {
  return IGNORED_PARAMS.includes(String(key).toLowerCase())
}

/**
 * 简单前端防篡改签名与Token解析工具
 */
export function generateRandomToken() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

export function parseQueryParams(search = window.location.search) {
  const params = new URLSearchParams(search)
  const result = {}
  for (const [key, value] of params.entries()) {
    if (!isIgnoredParam(key)) {
      result[key] = value
    }
  }
  return result
}

export function buildQueryString(params = {}) {
  const urlParams = new URLSearchParams()
  Object.keys(params).forEach(key => {
    if (!isIgnoredParam(key) && params[key] !== undefined && params[key] !== null) {
      urlParams.append(key, params[key])
    }
  })
  return urlParams.toString()
}

export function cleanSearchParams(searchParams) {
  const clean = new URLSearchParams()
  searchParams.forEach((val, key) => {
    if (!isIgnoredParam(key)) {
      clean.append(key, val)
    }
  })
  return clean
}
