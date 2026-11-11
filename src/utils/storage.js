/**
 * 本地分销关系与会话缓存机制（LocalStorage + Cookie 备用）
 */

const STORAGE_KEYS = {
  BROKERAGE_USER_ID: "sd_brokerage_user_id",
  DEPT_ID: "sd_dept_id",
  SCAN: "sd_scan",
  BIND_TIME: "sd_bind_timestamp",
};

// 绑定时间 30 天
const EXPIRATION_DAYS = 30;

export function saveAffiliateRelation(brokerageUserId, deptId, scan) {
  if (!brokerageUserId) return;

  const bindTime = Date.now().toString();

  try {
    localStorage.setItem(STORAGE_KEYS.BROKERAGE_USER_ID, brokerageUserId);
    if (deptId) localStorage.setItem(STORAGE_KEYS.DEPT_ID, deptId);
    if (scan) localStorage.setItem(STORAGE_KEYS.SCAN, scan);
    localStorage.setItem(STORAGE_KEYS.BIND_TIME, bindTime);
  } catch (e) {
    console.warn("LocalStorage error:", e);
  }

  // 设置 Cookie 保底（防止 LocalStorage 被清除）
  setCookie(STORAGE_KEYS.BROKERAGE_USER_ID, brokerageUserId, EXPIRATION_DAYS);
  if (deptId) setCookie(STORAGE_KEYS.DEPT_ID, deptId, EXPIRATION_DAYS);
}

export function getAffiliateRelation() {
  let brokerageUserId = null;
  let deptId = null;
  let scan = null;

  try {
    brokerageUserId = localStorage.getItem(STORAGE_KEYS.BROKERAGE_USER_ID);
    deptId = localStorage.getItem(STORAGE_KEYS.DEPT_ID);
    scan = localStorage.getItem(STORAGE_KEYS.SCAN);
  } catch (e) {
    console.warn("LocalStorage read error:", e);
  }

  // 降级从 Cookie 获取
  if (!brokerageUserId) {
    brokerageUserId = getCookie(STORAGE_KEYS.BROKERAGE_USER_ID);
    deptId = getCookie(STORAGE_KEYS.DEPT_ID);
  }

  return {
    brokerageUserId,
    deptId,
    scan,
  };
}

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
