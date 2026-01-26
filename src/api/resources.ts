import request from '@/utils/request'

// 资源共享实体
export interface ResourceSharing {
  id?: number
  resourceId?: number
  resourceName: string
  resourceType?: string
  uploadDate?: string
  uploadUser?: string
  downloadCount?: number
  resourceDesc?: string
  filePath?: string
  isApproved?: number
  approvalDate?: string
}

// 分页参数
export interface ResourceListParams {
  page?: number
  limit?: number
  searchText?: string
  resourceType?: string
  resourceName?: string
  uploadUser?: string
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
}

// 分页响应（ResultTable格式）
export interface PageResponse<T> {
  code: number
  msg: string
  count: number
  data: T[]
}

/**
 * 获取资源共享列表
 */
export function getResourceList(params: ResourceListParams): Promise<PageResponse<ResourceSharing>> {
  const requestParams: any = {
    page: params.page || 1,
    limit: params.limit || 10
  }
  
  if (params.resourceName) {
    requestParams.resourceName = params.resourceName
  }
  if (params.uploadUser) {
    requestParams.uploadUser = params.uploadUser
  }
  if (params.resourceType) {
    requestParams.resourceType = params.resourceType
  }
  if (params.searchText) {
    requestParams.searchText = params.searchText
  }
  
  return request({
    url: '/ResourceSharingController/list',
    method: 'get',
    params: requestParams
  })
}

/**
 * 获取资源详情
 */
export function getResourceDetail(id: number): Promise<ApiResponse<ResourceSharing>> {
  return request({
    url: `/ResourceSharingController/detail/${id}`,
    method: 'get'
  })
}

/**
 * 新增资源
 */
export function addResource(data: ResourceSharing): Promise<ApiResponse> {
  return request({
    url: '/ResourceSharingController/add',
    method: 'post',
    data
  })
}

/**
 * 更新资源
 */
export function updateResource(data: ResourceSharing): Promise<ApiResponse> {
  return request({
    url: '/ResourceSharingController/edit',
    method: 'post',
    data
  })
}

/**
 * 删除资源
 */
export function deleteResource(ids: string): Promise<ApiResponse> {
  return request({
    url: '/ResourceSharingController/remove',
    method: 'delete',
    params: { ids }
  })
}

/**
 * 上传资源文件
 */
export function uploadResource(formData: FormData): Promise<ApiResponse<ResourceSharing>> {
  return request({
    url: '/ResourceSharingController/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 下载资源文件
 */
export function downloadResource(id: number): Promise<Blob> {
  return request({
    url: `/ResourceSharingController/download/${id}`,
    method: 'get',
    responseType: 'blob'
  })
}

/**
 * 增加下载次数
 */
export function incrementDownload(id: number): Promise<ApiResponse> {
  return request({
    url: `/ResourceSharingController/incrementDownload/${id}`,
    method: 'post'
  })
}
