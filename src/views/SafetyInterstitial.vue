<template>
  <div class="safety-interstitial-page">
    <div class="bg-glow glow-1" aria-hidden="true"></div>
    <div class="bg-glow glow-2" aria-hidden="true"></div>

    <div class="status-card">
      <!-- 加载态 -->
      <template v-if="!failed">
        <div class="luxury-loader">
          <div class="orbit-ring"></div>
          <div class="core-pulse"></div>
        </div>

        <div class="status-content">
          <h3 class="status-title gradient-title">正在打开页面…</h3>
          <p class="status-tip">正在获取页面地址，请稍候</p>
        </div>

        <div class="node-meter">
          <div class="meter-bar"></div>
        </div>
      </template>

      <!-- 失败态：不再无限轮询，给出明确提示与重试入口 -->
      <template v-else>
        <div class="fail-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#94A3B8" stroke-width="1.8" />
            <path d="M12 7.5v5.2" stroke="#94A3B8" stroke-width="1.8" stroke-linecap="round" />
            <circle cx="12" cy="16.2" r="1.05" fill="#94A3B8" />
          </svg>
        </div>

        <div class="status-content">
          <h3 class="status-title">页面暂时无法打开</h3>
          <p class="status-tip">地址获取失败，请检查网络后重试</p>
        </div>

        <button class="retry-btn" type="button" @click="retry">重新加载</button>
      </template>

      <SiteFooter :show-contact="true" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { cleanSearchParams } from '../utils/crypto'
import SiteFooter from '../components/SiteFooter.vue'

const MAX_RETRY = 5
const failed = ref(false)
let retryCount = 0
let retryTimer = null
let stopped = false

function buildSearch() {
  const searchParams = new URLSearchParams(window.location.search)
  const cleanSearch = cleanSearchParams(searchParams).toString()
  return cleanSearch ? `?${cleanSearch}` : ''
}

function resolveAndRedirect() {
  if (stopped) return

  fetch('/api/resolve' + buildSearch())
    .then(res => res.json())
    .then(data => {
      if (data && data.url) {
        window.location.replace(data.url)
        return
      }
      scheduleRetry()
    })
    .catch(() => {
      scheduleRetry()
    })
}

function scheduleRetry() {
  if (stopped) return
  retryCount += 1

  if (retryCount >= MAX_RETRY) {
    failed.value = true
    return
  }

  retryTimer = setTimeout(resolveAndRedirect, 1000)
}

function retry() {
  stopped = false
  failed.value = false
  retryCount = 0
  resolveAndRedirect()
}

onMounted(() => {
  resolveAndRedirect()
})

onUnmounted(() => {
  stopped = true
  if (retryTimer) clearTimeout(retryTimer)
})
</script>

<style scoped>
.safety-interstitial-page {
  position: fixed;
  inset: 0;
  z-index: 99;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: var(--bg-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.status-card {
  position: relative;
  z-index: 1;
  width: calc(100% - 40px);
  max-width: 340px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 24px;
  box-shadow: var(--card-shadow);
  padding: 36px 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* 加载动效 */
.luxury-loader {
  position: relative;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
}

.orbit-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 36, 66, 0.12);
  border-top-color: var(--primary-color);
  animation: spin 0.9s linear infinite;
}

.core-pulse {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary-color);
  opacity: 0.7;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(0.85);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

/* 失败图标 */
.fail-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
}

.status-content {
  margin-bottom: 20px;
}

.status-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 6px;
  letter-spacing: -0.01em;
}

.status-tip {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.6;
}

/* 进度条 */
.node-meter {
  width: 100%;
  height: 3px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.06);
  overflow: hidden;
  margin-bottom: 22px;
}

.meter-bar {
  width: 40%;
  height: 100%;
  border-radius: 9999px;
  background: var(--primary-gradient);
  animation: slide 1.4s ease-in-out infinite;
}

@keyframes slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}

/* 重试按钮 */
.retry-btn {
  width: 100%;
  max-width: 220px;
  height: 44px;
  border: none;
  border-radius: 9999px;
  background: var(--primary-gradient);
  color: var(--text-light);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  box-shadow: var(--primary-shadow);
  margin-bottom: 22px;
  transition: all 0.25s ease;
}

.retry-btn:active {
  transform: scale(0.98);
  opacity: 0.94;
}
</style>
