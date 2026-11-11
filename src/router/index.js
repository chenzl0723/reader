import { createRouter, createWebHistory } from 'vue-router'
import FacadeLanding from '../views/FacadeLanding.vue'
import BrowserGuide from '../views/BrowserGuide.vue'
import SafetyInterstitial from '../views/SafetyInterstitial.vue'
import { isIgnoredParam } from '../utils/crypto'

const routes = [
  {
    path: '/',
    redirect: '/go'
  },
  {
    path: '/go',
    name: 'FacadeLanding',
    component: FacadeLanding
  },
  {
    path: '/reader/go',
    redirect: '/go'
  },
  {
    path: '/mine/focusCode',
    name: 'FocusCode',
    component: FacadeLanding
  },
  {
    path: '/reader/mine/focusCode',
    redirect: '/mine/focusCode'
  },
  {
    path: '/guide',
    name: 'BrowserGuide',
    component: BrowserGuide
  },
  {
    path: '/switch',
    name: 'SafetyInterstitial',
    component: SafetyInterstitial
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 全局路由守卫：过滤 code, state, appid, svapid, connect_redirect 等微信授权/第三方冗余参数
router.beforeEach((to, from, next) => {
  const currentQuery = { ...to.query }
  let needClean = false

  Object.keys(currentQuery).forEach(key => {
    if (isIgnoredParam(key)) {
      delete currentQuery[key]
      needClean = true
    }
  })

  if (needClean) {
    next({
      path: to.path,
      query: currentQuery,
      hash: to.hash,
      replace: true
    })
  } else {
    next()
  }
})

export default router
