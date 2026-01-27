import request from '@/utils/request'

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

// 下载资料
export function downloadMaterial(id: number): Promise<Blob> {
  return request({
    url: `/LearningMaterialController/download/${id}`,
    method: 'get',
    responseType: 'blob'
  } as any)
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
