import axios from 'axios'
import request from '@/utils/request'
import { API_BASE_URL, FILE_REQUEST_TIMEOUT } from '@/config/api'

// 资料实体
export interface LearningMaterial {
  id?: number
  title?: string
  description?: string
  category?: string
  tags?: string // 逗号分隔
  fileType?: string
  fileSize?: number
  filePath?: string
  originalName?: string
  uploaderId?: string
  uploaderName?: string
  viewCount?: number
  downloadCount?: number
  status?: string // 已发布/草稿
  createTime?: string
  updateTime?: string
}

export interface MaterialsListParams {
  page?: number
  limit?: number
  searchText?: string
  category?: string
  tags?: string
  status?: string
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
}

export interface PageResponse<T> {
  code: number
  msg: string
  count: number
  data: T[]
}

export function getMaterialsList(params: MaterialsListParams): Promise<PageResponse<LearningMaterial>> {
  const requestParams: any = {
    page: params.page || 1,
    limit: params.limit || 10
  }
  if (params.searchText) requestParams.searchText = params.searchText
  if (params.category) requestParams.category = params.category
  if (params.tags) requestParams.tags = params.tags
  if (params.status) requestParams.status = params.status

  return request({
    url: '/LearningMaterialController/list',
    method: 'get',
    params: requestParams
  })
}

export function getMaterialDetail(id: number): Promise<ApiResponse<LearningMaterial>> {
  return request({
    url: `/LearningMaterialController/detail/${id}`,
    method: 'get'
  })
}

export function addMaterial(data: LearningMaterial): Promise<ApiResponse> {
  return request({
    url: '/LearningMaterialController/add',
    method: 'post',
    data
  })
}

export function updateMaterial(data: LearningMaterial): Promise<ApiResponse> {
  return request({
    url: '/LearningMaterialController/edit',
    method: 'post',
    data
  })
}

export function deleteMaterial(ids: string): Promise<ApiResponse> {
  return request({
    url: '/LearningMaterialController/remove',
    method: 'delete',
    params: { ids }
  })
}

// 上传资料（multipart）
export function uploadMaterial(formData: FormData): Promise<ApiResponse<LearningMaterial>> {
  return request({
    url: '/LearningMaterialController/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  } as any)
}

/** 获取带 token 的下载地址，用于导航下载（避免鉴权与 CORS） */
export function getMaterialDownloadUrl(id: number): Promise<string> {
  return request({
    url: `/LearningMaterialController/downloadUrl/${id}`,
    method: 'get'
  }).then((res: any) => res?.data || '')
}

/** 通过 blob 方式下载并触发保存（PDF/图片等可被浏览器内嵌的类型也能强制下载） */
export async function downloadMaterialAsBlob(id: number, filename?: string): Promise<void> {
  const { blob, filename: fn } = await downloadMaterialWithFilename(id)
  const name = filename || fn || 'download'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 下载资料（使用长超时，避免局域网大文件报“无法连接”）
export function downloadMaterial(id: number): Promise<Blob> {
  return request({
    url: `/LearningMaterialController/download/${id}`,
    method: 'get',
    responseType: 'blob',
    timeout: FILE_REQUEST_TIMEOUT
  } as any)
}

/** 获取资料下载文件名 */
export async function getMaterialDownloadFilename(id: number): Promise<string> {
  const token = localStorage.getItem('token')
  const res = await axios.get(`${API_BASE_URL}/LearningMaterialController/downloadFilename/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  return (res.data?.data != null ? String(res.data.data) : '') || 'download'
}

/** 下载资料并返回 blob 与文件名（优先从响应头解析，失败则请求 filename 接口） */
export async function downloadMaterialWithFilename(id: number): Promise<{ blob: Blob; filename: string }> {
  const token = localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const [blobRes, filenameRes] = await Promise.all([
    axios.get(`${API_BASE_URL}/LearningMaterialController/download/${id}`, {
      responseType: 'blob',
      timeout: FILE_REQUEST_TIMEOUT,
      headers
    }),
    axios.get(`${API_BASE_URL}/LearningMaterialController/downloadFilename/${id}`, { headers }).catch(() => null)
  ])
  let filename = 'download'
  const cd = blobRes.headers?.['content-disposition'] || blobRes.headers?.['Content-Disposition']
  if (cd) {
    const m = cd.match(/filename\*=UTF-8''([^;]+)/i) || cd.match(/filename="?([^";\n]+)"?/i)
    if (m && m[1]) {
      try {
        filename = decodeURIComponent(m[1].trim().replace(/"/g, ''))
      } catch {
        filename = m[1].trim().replace(/"/g, '')
      }
    }
  }
  if ((!filename || filename === 'download') && filenameRes?.data?.data) {
    filename = String(filenameRes.data.data)
  }
  return { blob: blobRes.data, filename }
}

// 预览资料（blob，带鉴权，本机/他机均可用；长超时）
export function getPreviewBlob(id: number): Promise<Blob> {
  return request({
    url: `/LearningMaterialController/preview/${id}`,
    method: 'get',
    responseType: 'blob',
    timeout: FILE_REQUEST_TIMEOUT
  } as any)
}

/** 获取带 token 的预览地址，用于 img/video/iframe（避免鉴权与 CORS） */
export function getMaterialPreviewUrl(id: number): Promise<string> {
  return request({
    url: `/LearningMaterialController/previewUrl/${id}`,
    method: 'get'
  }).then((res: any) => res?.data || '')
}

export function incrementDownload(id: number): Promise<ApiResponse> {
  return request({
    url: `/LearningMaterialController/incrementDownload/${id}`,
    method: 'post'
  })
}

export function incrementView(id: number): Promise<ApiResponse> {
  return request({
    url: `/LearningMaterialController/incrementView/${id}`,
    method: 'post'
  })
}
