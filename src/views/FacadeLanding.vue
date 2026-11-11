<template>
  <div class="facade-landing-page">
    <!-- 珍珠白柔和环境光晕 -->
    <div class="bg-glow glow-1" aria-hidden="true"></div>
    <div class="bg-glow glow-2" aria-hidden="true"></div>

    <div class="content-container">
      <!-- 中性跳转提示（不宣称官方授权、不宣称安全加密） -->
      <div class="security-badge">
        <span class="badge-dot"></span>
        <span>外部页面跳转提示</span>
      </div>

      <!-- 品牌标题区 -->
      <div class="header-group">
        <h1 class="main-title gradient-title">星月汇</h1>
        <p class="sub-title">即将为你打开第三方服务页面</p>
      </div>

      <!-- 珍珠白微凸悬浮品牌卡片 -->
      <div class="app-card">
        <div class="app-icon-wrapper">
          <img class="app-logo" :src="logoUrl" alt="星月汇" />
        </div>
        <h2 class="app-name">星月汇</h2>
        <!-- <div class="status-indicator" :class="{ 'is-pending': !targetHost }">
          <span class="pulse-beacon"></span>
          <span class="status-text">{{ targetHost || '正在获取目标页面地址…' }}</span>
        </div> -->
      </div>

      <!-- 环形倒计时视窗 -->
      <div class="countdown-section">
        <div class="progress-ring-container">
          <svg class="progress-ring" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FF1A3C" />
                <stop offset="100%" stop-color="#FF708C" />
              </linearGradient>
            </defs>
            <circle class="progress-ring-bg" cx="50" cy="50" r="40"></circle>
            <circle
              class="progress-ring-circle"
              cx="50"
              cy="50"
              r="40"
              stroke="url(#ringGrad)"
              :style="{ strokeDashoffset: strokeDashoffset }"
            ></circle>
          </svg>
          <span class="countdown-number">{{ countdown >= 0 ? countdown : 0 }}</span>
        </div>
        <p class="countdown-tip">{{ countdownTip }}</p>
      </div>

      <!-- 操作按钮 -->
      <button class="skip-btn" @click="handleSkip" :disabled="isRedirecting || shouldRedirect">
        <span>{{ primaryBtnText }}</span>
        <svg class="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <!-- 给用户保留"不跳转"的选择权 -->
      <button v-if="!cancelled && !isRedirecting" class="cancel-btn" type="button" @click="cancelAutoRedirect">
        留在本页
      </button>

      <SiteFooter />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isRiskEnvironment } from '../utils/env'
import { saveAffiliateRelation, getAffiliateRelation } from '../utils/storage'
import { generateRandomToken, buildQueryString, isIgnoredParam } from '../utils/crypto'
import SiteFooter from '../components/SiteFooter.vue'

const router = useRouter()
const route = useRoute()

// 兼容根域名部署（BASE_URL='/'）与 /reader/ 子路径部署
const logoUrl = `${import.meta.env.BASE_URL}logo.png`

const countdown = ref(30)
const totalTime = ref(30)
// 接口返回的 countdown_seconds 目前线上是 1，会导致页面刚出现就跳走。
// 兜一个最小停留时长，保证用户能看清倒计时与去向，再自行决定是否跳转。
const MIN_COUNTDOWN = 3
const isRedirecting = ref(false)
const shouldRedirect = ref(false)
const cancelled = ref(false)
const resolvedTargetUrl = ref(null)
const isLoadingConfig = ref(true)
let timer = null
let retryTimer = null

const circumference = 2 * Math.PI * 40
const strokeDashoffset = computed(() => {
  return circumference * (1 - countdown.value / totalTime.value)
})

/**
 * 展示给用户的目标域名（如实告知去向，不做"安全节点"之类的包装）
 */
const targetHost = computed(() => {
  if (!resolvedTargetUrl.value) return ''
  try {
    return new URL(resolvedTargetUrl.value).host
  } catch (e) {
    return ''
  }
})

const countdownTip = computed(() => {
  if (isRedirecting.value) return '正在打开页面…'
  const secs = countdown.value >= 0 ? countdown.value : 0
  if (cancelled.value) {
    return targetHost.value
      ? `已取消自动跳转，你可以手动前往`
      : '已取消自动跳转'
  }
  // 未拿到目标域名时也把秒数显示出来，避免倒计时区域看起来是空的
  if (!targetHost.value) return `${secs} 秒后自动打开该页面`
  return `${secs} 秒后自动打开 ${targetHost.value}`
})

const primaryBtnText = computed(() => {
  if (isRedirecting.value || shouldRedirect.value) return '正在打开…'
  if (cancelled.value) return '仍然前往'
  return '立即打开'
})

/**
 * 根据获取到的 active_landing 动态组装完整落地 URL
 */
function buildTargetLandingUrl(host) {
  const cleanHost = String(host).replace(/\/$/, '')
  const searchParams = new URLSearchParams(window.location.search)

  const scanVal = searchParams.get('scan') || searchParams.get('s')
  let routePath = '/h5/pages/home/index'
  if (scanVal == '2') {
    routePath = '/h5/pages/home/detail'
  }

  const savedRelation = getAffiliateRelation()
  const brokerageUserId =
    searchParams.get('brokerageUserId') ||
    searchParams.get('b') ||
    savedRelation.brokerageUserId ||
    ''
  const deptId =
    searchParams.get('deptId') ||
    searchParams.get('d') ||
    savedRelation.deptId ||
    ''

  const randToken = generateRandomToken()
  const timestamp = Date.now()

  const passParams = {
    brokerageUserId,
    deptId,
    scan: scanVal || savedRelation.scan || '',
    t: timestamp,
    token: randToken
  }

  searchParams.forEach((val, key) => {
    if (!isIgnoredParam(key) && !passParams[key]) {
      passParams[key] = val
    }
  })

  return `${cleanHost}${routePath}?${buildQueryString(passParams)}`
}

/**
 * 动态读取域名配置：优先请求业务域名池动态接口，失败回退自动重试
 */
async function fetchDomainConfig() {
  if (resolvedTargetUrl.value) return

  isLoadingConfig.value = true

  try {
    const apiUrls = [
      '/app-api/system/business-domain/get-active',
      'https://api.richdf.cn/app-api/system/business-domain/get-active'
    ]
    for (const url of apiUrls) {
      try {
        const res = await fetch(`${url}?t=${Date.now()}`)
        if (res.ok) {
          const json = await res.json()
          const config = json && (json.data || json)
          if (config && (config.active_landing || config.activeLanding)) {
            const landing = (config.active_landing || config.activeLanding).replace(/\/$/, '')
            resolvedTargetUrl.value = buildTargetLandingUrl(landing)
            isLoadingConfig.value = false
            if (config.countdown_seconds !== undefined && config.countdown_seconds !== null) {
              const seconds = Number(config.countdown_seconds)
              // 接口值小于最小停留时长时视为异常配置，保留页面默认倒计时，避免"闪一下就跳走"
              if (Number.isFinite(seconds) && seconds >= MIN_COUNTDOWN) {
                countdown.value = seconds
                totalTime.value = seconds
              }
            }
            if (shouldRedirect.value || (countdown.value <= 0 && !cancelled.value)) {
              executeTargetRedirect()
            }
            return
          }
        }
      } catch (innerErr) {
        // 继续尝试下一个
      }
    }
  } catch (err) {
    console.warn('[业务域名池接口请求异常，准备1秒后重试]', err.message)
  }

  // 接口请求失败时，1秒后自动重试接口拉取（用户已取消则不再重试）
  if (cancelled.value) return
  isLoadingConfig.value = true
  retryTimer = setTimeout(() => {
    fetchDomainConfig()
  }, 1000)
}

function executeTargetRedirect() {
  if (isRedirecting.value) return
  if (cancelled.value && !resolvedTargetUrl.value) return

  // 1. 持久化锁定分销关系参数
  const query = { ...route.query }
  const brokerageUserId = query.brokerageUserId || query.b
  const deptId = query.deptId || query.d
  const scan = query.scan || query.s

  if (brokerageUserId) {
    saveAffiliateRelation(brokerageUserId, deptId, scan)
  }

  // 2. 如果已经成功获取目标 URL，立即跳转
  if (resolvedTargetUrl.value) {
    isRedirecting.value = true
    window.location.replace(resolvedTargetUrl.value)
    return
  }

  // 3. 如果尚未获取成功，标记等待
  shouldRedirect.value = true
}

function handleSkip() {
  cancelled.value = false
  executeTargetRedirect()
}

/**
 * 用户主动取消自动跳转：停止倒计时与重试，保留手动前往入口
 */
function cancelAutoRedirect() {
  cancelled.value = true
  shouldRedirect.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}

onMounted(() => {
  // 1. 仅当链接显式要求时才进入访问说明页（不做基于客户端的差别化展示）
  if (isRiskEnvironment()) {
    router.replace('/reader/guide')
    return
  }

  // 2. 存入推广分销关系
  const bId = route.query.brokerageUserId || route.query.b
  const dId = route.query.deptId || route.query.d
  const sId = route.query.scan || route.query.s
  if (bId) {
    saveAffiliateRelation(bId, dId, sId)
  }

  // 3. 动态读取远程域名配置
  fetchDomainConfig()

  // 4. 启动倒计时
  timer = setInterval(() => {
    if (cancelled.value) {
      clearInterval(timer)
      timer = null
      return
    }
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
      executeTargetRedirect()
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (retryTimer) clearTimeout(retryTimer)
})
</script>

<style scoped>
.facade-landing-page {
  position: fixed;
  inset: 0;
  z-index: 99;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: var(--bg-gradient);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.content-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 380px;
  max-height: 100%;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  scrollbar-width: none;
}

.content-container::-webkit-scrollbar {
  display: none;
}

/* 中性提示徽章 */
.security-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 9999px;
  background: rgba(255, 36, 66, 0.06);
  border: 1px solid rgba(255, 36, 66, 0.16);
  color: var(--primary-color);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin-bottom: 20px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-color);
}

.header-group {
  margin-bottom: 24px;
}

.main-title {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin-bottom: 6px;
}

.sub-title {
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

/* 珍珠白高光悬浮卡片 */
.app-card {
  width: 100%;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 24px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: var(--card-shadow);
  margin-bottom: 28px;
  position: relative;
  transition: transform 0.3s ease;
}

.app-icon-wrapper {
  width: 68px;
  height: 68px;
  border-radius: 18px;
  margin-bottom: 12px;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.05);
  box-shadow: 0 8px 20px -4px rgba(15, 23, 42, 0.08);
}

.app-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 6px;
  letter-spacing: -0.01em;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  font-size: 12px;
  color: var(--color-success);
  background: var(--color-success-bg);
  padding: 3px 10px;
  border-radius: 9999px;
  border: 1px solid rgba(16, 185, 129, 0.18);
}

.status-indicator.is-pending {
  color: var(--text-regular);
  background: rgba(15, 23, 42, 0.04);
  border-color: rgba(15, 23, 42, 0.08);
}

.status-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pulse-beacon {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
  flex-shrink: 0;
}

.status-indicator.is-pending .pulse-beacon {
  background: var(--text-muted);
}

/* 环形倒计时 */
.countdown-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.progress-ring-container {
  position: relative;
  width: 84px;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.progress-ring {
  transform: rotate(-90deg);
  width: 84px;
  height: 84px;
  overflow: visible;
}

.progress-ring-bg {
  stroke: rgba(15, 23, 42, 0.06);
  stroke-width: 5;
  fill: transparent;
}

.progress-ring-circle {
  stroke-width: 5;
  stroke-linecap: round;
  fill: transparent;
  stroke-dasharray: 251.32;
  transition: stroke-dashoffset 1s linear;
}

.countdown-number {
  position: absolute;
  font-size: 26px;
  font-weight: 800;
  color: var(--primary-color);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.countdown-tip {
  font-size: 12.5px;
  color: var(--text-regular);
  font-weight: 500;
}

/* 主操作按钮 */
.skip-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 280px;
  height: 48px;
  background: var(--primary-gradient);
  border: none;
  border-radius: 9999px;
  color: var(--text-light);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  box-shadow: var(--primary-shadow);
  transition: all 0.25s ease;
  letter-spacing: 0.03em;
  margin-bottom: 12px;
}

.skip-btn:hover {
  background: var(--primary-gradient-hover);
  box-shadow: 0 12px 28px -4px rgba(255, 36, 66, 0.42);
  transform: translateY(-1px);
}

.skip-btn:active {
  transform: scale(0.98);
  opacity: 0.94;
}

.skip-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.btn-arrow {
  transition: transform 0.2s ease;
}

.skip-btn:hover .btn-arrow {
  transform: translateX(3px);
}

/* 次要操作：留在本页 */
.cancel-btn {
  background: transparent;
  border: 1px solid var(--card-border);
  border-radius: 9999px;
  color: var(--text-regular);
  font-size: 13px;
  font-weight: 500;
  padding: 9px 22px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  border-color: rgba(15, 23, 42, 0.16);
  color: var(--text-main);
}
</style>
