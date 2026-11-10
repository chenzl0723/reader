/**
 * 防封中转调度中心配置文件
 */

export const CONFIG = {
  // 服务端口
  PORT: process.env.PORT || 3010,

  // HMAC 参数防篡改签名秘钥
  SECRET_KEY: process.env.SECRET_KEY || "YouXiangTD_Secret_2026",

  // Redis 配置
  REDIS: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || "",
    db: 0,
  },

  // 默认知享优业务中台落地域名/主站
  TARGET_CENTER_HOST: "https://api.richdf.cn",

  // 初始预置健康入口泛域名资产池
  INITIAL_ENTRY_DOMAINS: [
    "entry1.youxiangtd.com",
    "entry2.youxiangtd.com",
    "entry3.youxiangtd.com",
  ],
};
