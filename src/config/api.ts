/**
 * API 配置（支持通过 .env/.env.local 全局配置，方便换网络时修改）
 *
 * 使用方式：
 * - 在项目根目录创建 `.env.local`
 * - 写入：VITE_API_BASE_URL=http://你的后端IP:8080/api
 */

// 优先使用环境变量（Vite 会注入 import.meta.env）
const ENV_API_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined

// 兜底：根据当前访问的主机名自动拼后端地址
// - 本机访问：hostname=localhost/127.0.0.1 → 指向本机后端
// - 手机访问：http://192.168.x.x:3000 → hostname=192.168.x.x → 指向你电脑后端
const AUTO_HOST = (typeof window !== 'undefined' && window.location?.hostname)
  ? window.location.hostname
  : '127.0.0.1'
const DEFAULT_API_BASE_URL = `http://${AUTO_HOST}:8080/api`

export const API_BASE_URL = (ENV_API_BASE_URL && ENV_API_BASE_URL.trim()) ? ENV_API_BASE_URL.trim() : DEFAULT_API_BASE_URL

// 普通请求超时（毫秒）
export const REQUEST_TIMEOUT = 10000
// 文件下载/预览流式请求超时（局域网大文件需更长时间，5 分钟）
export const FILE_REQUEST_TIMEOUT = 300000
