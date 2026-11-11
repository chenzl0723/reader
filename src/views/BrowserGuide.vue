<template>
  <div class="browser-guide-mask">
    <!-- 珍珠白柔和环境光晕 -->
    <div class="bg-glow glow-1" aria-hidden="true"></div>

    <!-- 引导核心主体 -->
    <div class="guide-body">
      <!-- 中性信息图标（不使用仿冒官方安全标识的盾牌对勾） -->
      <div class="icon-circle">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#475569" stroke-width="1.8" />
          <path d="M12 11v6" stroke="#475569" stroke-width="1.8" stroke-linecap="round" />
          <circle cx="12" cy="7.6" r="1.05" fill="#475569" />
        </svg>
      </div>

      <h2 class="guide-title gradient-title">请在浏览器中访问本链接</h2>
      <p class="guide-subtitle">本页面的部分功能在微信内可能无法完整使用</p>

      <!-- 说明卡片 -->
      <div class="step-list">
        <div class="step-card">
          <span class="step-badge">1</span>
          <div class="step-content">
            <span class="step-text">点击下方按钮复制本页链接</span>
          </div>
        </div>

        <div class="step-card">
          <span class="step-badge">2</span>
          <div class="step-content">
            <span class="step-text">粘贴到手机或电脑的浏览器地址栏中打开</span>
          </div>
        </div>
      </div>

      <!-- 操作区：复制链接 / 在微信内继续 -->
      <div class="action-group">
        <button class="copy-btn" type="button" @click="copyLink">
          <span>{{ copied ? '链接已复制' : '复制页面链接' }}</span>
        </button>
        <button class="ghost-btn" type="button" @click="continueInWechat">
          在微信内继续浏览
        </button>
      </div>

      <!-- 来源声明与备案信息 -->
      <SiteFooter :show-contact="true" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { isWechat, stripForceExternal } from '../utils/env'
import SiteFooter from '../components/SiteFooter.vue'

const copied = ref(false)

/**
 * 非受限环境无需停留在此页，直接回到业务页面
 * 回跳前清掉 force_external，避免与 /go 的判定形成循环
 */
onMounted(() => {
  if (!isWechat()) {
    window.location.replace('/reader/go' + stripForceExternal())
  }
})

async function copyLink() {
  const link = window.location.href
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(link)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = link
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (e) {
    console.warn('[复制链接失败]', e)
    copied.value = false
  }
}

function continueInWechat() {
  window.location.replace('/reader/go' + stripForceExternal())
}
</script>

<style scoped>
.browser-guide-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: var(--bg-gradient);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
  scrollbar-width: none;
}

.browser-guide-mask::-webkit-scrollbar {
  display: none;
}

/* 主体引导 */
.guide-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 360px;
  margin-block: auto;
}

.icon-circle {
  width: 68px;
  height: 68px;
  border-radius: 20px;
  background: #FFFFFF;
  border: 1px solid var(--card-border);
  box-shadow: 0 8px 24px -6px rgba(15, 23, 42, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.guide-title {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.guide-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 32px;
}

/* 步骤清单卡片 */
.step-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 26px;
}

.step-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #FFFFFF;
  border: 1px solid var(--card-border);
  box-shadow:
    0 10px 25px -5px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  padding: 16px 20px;
  text-align: left;
}

.step-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: #FFFFFF;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  box-shadow: 0 4px 10px rgba(255, 36, 66, 0.3);
}

.step-content {
  flex: 1;
}

.step-text {
  font-size: 14.5px;
  color: var(--text-main);
  line-height: 1.5;
}

/* 操作区 */
.action-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 22px;
}

.copy-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 9999px;
  background: var(--primary-gradient);
  color: var(--text-light);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  box-shadow: var(--primary-shadow);
  transition: all 0.25s ease;
}

.copy-btn:active {
  transform: scale(0.98);
  opacity: 0.94;
}

.ghost-btn {
  width: 100%;
  height: 46px;
  border-radius: 9999px;
  background: transparent;
  border: 1px solid var(--card-border);
  color: var(--text-regular);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghost-btn:hover {
  border-color: rgba(15, 23, 42, 0.16);
  color: var(--text-main);
}
</style>
