/**
 * API 配置
 * 根据实际情况修改后端API地址
 */

// 开发环境（根据实际情况修改）
const DEV_API_BASE_URL = 'http://127.0.0.1:8080/api'

// 生产环境（根据实际情况修改，如果需要可以取消注释使用）
// const PROD_API_BASE_URL = 'http://192.168.113.205:8080/api'

// API地址配置
// 如果需要切换环境，可以修改这里
export const API_BASE_URL = DEV_API_BASE_URL

// 请求超时时间（毫秒）
export const REQUEST_TIMEOUT = 10000
