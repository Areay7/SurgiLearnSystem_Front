import request from '@/utils/request'
import { BACKUP_REQUEST_TIMEOUT } from '@/config/api'

export interface BackupConfig {
  id?: number
  backupPath?: string
  autoEnabled?: number
  scheduleCron?: string
  scheduleTime?: string
  retentionDays?: number
  includeUploads?: number
  includeDatabase?: number
}

export interface BackupRecord {
  id?: number
  fileName?: string
  filePath?: string
  fileSize?: number
  backupType?: string
  status?: string
  errorMsg?: string
  durationSeconds?: number
  createTime?: string
}

export interface PageResponse<T> {
  code: number
  msg: string
  count: number
  data: T[]
}

export function getBackupConfig() {
  return request({
    url: '/BackupController/config',
    method: 'get'
  })
}

export function saveBackupConfig(config: BackupConfig) {
  return request({
    url: '/BackupController/config',
    method: 'post',
    data: config
  })
}

export function executeBackup(params?: {
  backupPath?: string
  includeUploads?: boolean
  includeDatabase?: boolean
}) {
  return request({
    url: '/BackupController/execute',
    method: 'post',
    params,
    timeout: BACKUP_REQUEST_TIMEOUT
  } as any)
}

export function getBackupList(params?: { page?: number; limit?: number }) {
  return request({
    url: '/BackupController/list',
    method: 'get',
    params: { page: params?.page || 1, limit: params?.limit || 10 }
  })
}

/** 获取带 token 的下载地址，用于 window.location 导航下载（避免 XHR 跨域与迅雷拦截） */
export function getBackupDownloadUrl(id: number): Promise<string> {
  return request({
    url: `/BackupController/downloadUrl/${id}`,
    method: 'get'
  }).then((res: any) => res?.data || '')
}

export function deleteBackup(id: number) {
  return request({
    url: `/BackupController/remove/${id}`,
    method: 'delete'
  })
}

export function cleanupBackup(retentionDays?: number) {
  return request({
    url: '/BackupController/cleanup',
    method: 'post',
    params: retentionDays != null ? { retentionDays } : {}
  })
}
