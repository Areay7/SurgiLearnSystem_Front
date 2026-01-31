import request from '@/utils/request'
import { API_BASE_URL } from '@/config/api'

export interface SystemConfig {
  id?: number
  systemName?: string
  pageSize?: number
  systemLogo?: string
  passwordMinLength?: number
  loginLockCount?: number
}

export function getSystemConfig() {
  return request({
    url: '/SystemSettingsController/config',
    method: 'get'
  })
}

/** 获取系统显示配置（公开，无需登录）- 用于登录页、布局标题等 */
export function getDisplayConfig() {
  return request({
    url: '/SystemSettingsController/config/display',
    method: 'get'
  })
}

export function saveSystemConfig(config: SystemConfig) {
  return request({
    url: '/SystemSettingsController/config',
    method: 'post',
    data: config
  })
}

export function uploadLogo(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/SystemSettingsController/uploadLogo',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getLogoUrl(): string {
  return `${API_BASE_URL}/SystemSettingsController/logo?t=${Date.now()}`
}
