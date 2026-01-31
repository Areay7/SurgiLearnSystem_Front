import request from '@/utils/request'
import { FILE_REQUEST_TIMEOUT, BACKUP_REQUEST_TIMEOUT } from '@/config/api'

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

export function downloadBackupFile(id: number): Promise<Blob> {
  return request({
    url: `/BackupController/download/${id}`,
    method: 'get',
    responseType: 'blob',
    timeout: FILE_REQUEST_TIMEOUT
  } as any)
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
