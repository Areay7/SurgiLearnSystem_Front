import request from '@/utils/request'

// 视频实体
export interface Video {
  id?: number
  videoId?: number
  videoTitle: string
  videoUrl?: string
  videoType?: string
  description?: string
  instructorId?: string
  instructorName?: string
  duration?: number
  thumbnailUrl?: string
  viewCount?: number
  likeCount?: number
  status?: string
  publishTime?: string
  createTime?: string
  updateTime?: string
  isFavorited?: boolean
}

// 分页参数
export interface VideoListParams {
  page?: number
  limit?: number
  videoType?: string
  searchText?: string
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
 * 获取视频列表
 */
export function getVideoList(params: VideoListParams): Promise<PageResponse<Video>> {
  const requestParams: any = {
    page: params.page || 1,
    limit: params.limit || 10
  }
  
  if (params.videoType) {
    requestParams.videoType = params.videoType
  }
  if (params.searchText) {
    requestParams.searchText = params.searchText
  }
  
  return request({
    url: '/VideosController/list',
    method: 'get',
    params: requestParams
  })
}

/**
 * 获取视频详情
 */
export function getVideoDetail(id: number): Promise<ApiResponse<Video>> {
  return request({
    url: `/VideosController/detail/${id}`,
    method: 'get'
  })
}

/**
 * 上传视频
 */
export function uploadVideo(formData: FormData): Promise<ApiResponse<Video>> {
  return request({
    url: '/VideosController/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 删除视频
 */
export function deleteVideo(ids: string): Promise<ApiResponse> {
  return request({
    url: '/VideosController/remove',
    method: 'delete',
    params: { ids }
  })
}

/**
 * 添加收藏
 */
export function addFavorite(id: number): Promise<ApiResponse> {
  return request({
    url: `/VideosController/favorite/${id}`,
    method: 'post'
  })
}

/**
 * 取消收藏
 */
export function removeFavorite(id: number): Promise<ApiResponse> {
  return request({
    url: `/VideosController/favorite/${id}`,
    method: 'delete'
  })
}

/**
 * 获取我的收藏
 */
export function getMyFavorites(params?: { page?: number; limit?: number }): Promise<PageResponse<Video>> {
  return request({
    url: '/VideosController/myFavorites',
    method: 'get',
    params: {
      page: params?.page || 1,
      limit: params?.limit || 10
    }
  })
}

/**
 * 获取视频类型列表
 */
export function getVideoTypes(): Promise<ApiResponse<string[]>> {
  return request({
    url: '/VideosController/types',
    method: 'get'
  })
}

/**
 * 获取视频预览流（带认证，用于 video 播放）
 * 返回 Blob，前端用 URL.createObjectURL 生成可播放地址
 */
export function getVideoPreviewBlob(id: number): Promise<Blob> {
  return request({
    url: `/VideosController/preview/${id}`,
    method: 'get',
    responseType: 'blob'
  })
}
