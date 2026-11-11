/**
 * 站点运营主体信息
 *
 * 合规用途：微信外链规范 2.18.4 要求网站可追溯运营者真实身份，
 * 页面底部展示运营主体与 ICP 备案号可降低被判定为风险链接的概率，
 * 也是链接被处理后申诉时的必要信息。
 *
 * 注意：未填写的字段不会渲染，避免出现与实际主体不符的信息。
 * - companyName：营业执照上的公司全称（留空则不展示）
 * - icpNumber：ICP 备案号
 * - contactEmail：可对外联系的服务邮箱（留空则不展示）
 */
export const SITE_INFO = {
  companyName: '',
  icpNumber: '琼ICP备2026014643号-4',
  contactEmail: '',
  icpUrl: 'https://beian.miit.gov.cn/'
}
