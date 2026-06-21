import request from '@/utils/request'
import { API_BASE_URL } from '@/config/api'

// ---------------- 系统全局配置（原有） ----------------

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

// ---------------- 系统设置选项列表（新增） ----------------

export interface SystemSettingsOption {
  id?: number
  settingsId?: number
  courseType?: string
  learningMode?: string
  examTimeLimit?: string
  videoQuality?: string
  questionBankType?: string
  updateFrequency?: string
}

export interface SystemSettingsListParams {
  page?: number
  limit?: number
  searchText?: string
}

export interface PageResponse<T> {
  code: number
  msg: string
  count: number
  data: T[]
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
}

export function getSystemSettingsList(
  params: SystemSettingsListParams
): Promise<PageResponse<SystemSettingsOption>> {
  const requestParams: any = {
    page: params.page || 1,
    limit: params.limit || 10
  }
  if (params.searchText) requestParams.searchText = params.searchText

  return request({
    url: '/SystemSettingsController/list',
    method: 'get',
    params: requestParams
  })
}

export function addSystemSettings(
  data: SystemSettingsOption
): Promise<ApiResponse> {
  return request({
    url: '/SystemSettingsController/add',
    method: 'post',
    data
  })
}

export function updateSystemSettings(
  data: SystemSettingsOption
): Promise<ApiResponse> {
  return request({
    url: '/SystemSettingsController/edit',
    method: 'post',
    data
  })
}

export function deleteSystemSettings(ids: string): Promise<ApiResponse> {
  return request({
    url: '/SystemSettingsController/remove',
    method: 'delete',
    params: { ids }
  })
}

export function getSystemSettingsDetail(
  id: number
): Promise<ApiResponse<SystemSettingsOption>> {
  return request({
    url: `/SystemSettingsController/detail/${id}`,
    method: 'get'
  })
}
