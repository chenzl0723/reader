<template>
  <footer class="site-footer">
    <p v-if="SITE_INFO.companyName" class="footer-line footer-company">{{ SITE_INFO.companyName }}</p>
    <p class="footer-line">
      <a
        class="footer-link"
        :href="SITE_INFO.icpUrl"
        target="_blank"
        rel="noopener noreferrer"
      >{{ SITE_INFO.icpNumber }}</a>
      <template v-if="showContact && SITE_INFO.contactEmail">
        <span class="footer-sep">·</span>
        <a class="footer-link" :href="`mailto:${SITE_INFO.contactEmail}`">{{ SITE_INFO.contactEmail }}</a>
      </template>
    </p>
    <p v-if="showDisclaimer" class="footer-line footer-tip">
      本页面由{{ operatorName }}运营，与腾讯公司及微信无关。
    </p>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { SITE_INFO } from '../config/site'

defineProps({
  showDisclaimer: {
    type: Boolean,
    default: true
  },
  showContact: {
    type: Boolean,
    default: false
  }
})

const operatorName = computed(() => SITE_INFO.companyName || '本站')
</script>

<style scoped>
.site-footer {
  width: 100%;
  max-width: 320px;
  text-align: center;
  margin-top: 4px;
}

.footer-line {
  font-size: 11px;
  line-height: 1.7;
  color: var(--text-muted);
}

.footer-company {
  letter-spacing: 0.01em;
}

.footer-link {
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--text-regular);
}

.footer-sep {
  margin: 0 6px;
  color: rgba(148, 163, 184, 0.7);
}

.footer-tip {
  margin-top: 2px;
}
</style>
