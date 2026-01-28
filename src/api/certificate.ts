import request from '@/utils/request'

export interface CertificateIssue {
  id?: number
  certificateId?: number
  issueDate?: string
  certificateType?: string
  holderName?: string
  holderId?: string
  trainingCourse?: string
  organization?: string
  expiryDate?: string
  certificateStatus?: string
  issueNote?: string
  stampPath?: string
  contentText?: string
  createTime?: string
  updateTime?: string
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
  count?: number
}

export interface PageResponse<T> {
  code: number
  msg: string
  count: number
  data: T[]
}

export function listCertificateIssues(params: { page?: number; limit?: number; searchText?: string }) {
  return request<PageResponse<CertificateIssue>>({
    url: '/CertificateIssueController/list',
    method: 'get',
    params
  } as any)
}

export function addCertificateIssue(data: CertificateIssue) {
  return request<ApiResponse>({
    url: '/CertificateIssueController/add',
    method: 'post',
    data
  } as any)
}

export function updateCertificateIssue(data: CertificateIssue) {
  return request<ApiResponse>({
    url: '/CertificateIssueController/edit',
    method: 'post',
    data
  } as any)
}

export function deleteCertificateIssue(ids: string) {
  return request<ApiResponse>({
    url: '/CertificateIssueController/remove',
    method: 'delete',
    params: { ids }
  } as any)
}

export function uploadCertificateStamp(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return request<ApiResponse<string>>({
    url: '/CertificateIssueController/uploadStamp',
    method: 'post',
    data: fd,
    headers: { 'Content-Type': 'multipart/form-data' }
  } as any)
}

export function listMyCertificates(holderId: string, params?: { page?: number; limit?: number }) {
  return request<PageResponse<CertificateIssue>>({
    url: '/CertificateIssueController/myList',
    method: 'get',
    params: { holderId, page: params?.page || 1, limit: params?.limit || 10 }
  } as any)
}

