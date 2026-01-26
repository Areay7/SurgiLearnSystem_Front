import request from '@/utils/request'

// 回复实体
export interface ForumReply {
  id?: number
  replyId?: number
  forumId: number
  replierId?: string
  replyTime?: string
  content: string
  likeCount?: number
  parentReplyId?: number
  isDeleted?: number
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

// 获取回复列表参数
export interface ReplyListParams {
  forumId: number
  page?: number
  limit?: number
}

/**
 * 获取回复列表
 */
export function getReplyList(params: ReplyListParams): Promise<PageResponse<ForumReply>> {
  return request({
    url: '/ForumReplyController/list',
    method: 'get',
    params: {
      forumId: params.forumId,
      page: params.page || 1,
      limit: params.limit || 20
    }
  })
}

/**
 * 新增回复
 */
export function addReply(data: ForumReply): Promise<ApiResponse> {
  return request({
    url: '/ForumReplyController/add',
    method: 'post',
    data
  })
}

/**
 * 删除回复
 */
export function deleteReply(ids: string): Promise<ApiResponse> {
  return request({
    url: '/ForumReplyController/remove',
    method: 'delete',
    params: { ids }
  })
}

/**
 * 获取回复详情
 */
export function getReplyDetail(id: number): Promise<ApiResponse<ForumReply>> {
  return request({
    url: `/ForumReplyController/detail/${id}`,
    method: 'get'
  })
}

/**
 * 更新回复
 */
export function updateReply(data: ForumReply): Promise<ApiResponse> {
  return request({
    url: '/ForumReplyController/edit',
    method: 'post',
    data
  })
}

/**
 * 点赞回复
 */
export function likeReply(id: number): Promise<ApiResponse> {
  return request({
    url: `/ForumReplyController/like/${id}`,
    method: 'post'
  })
}
