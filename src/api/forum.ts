import request from '@/utils/request'

// 讨论论坛实体
export interface DiscussionForum {
  id?: number
  discussionId?: number
  forumTitle: string
  posterId?: string
  postTime?: string
  content: string
  replyCount?: number
  likeCount?: number
  isSticky?: number
  isLocked?: number
  lastReplyId?: string
  lastReplyTime?: string
  categoryId?: string
}

// 分页参数
export interface TableParams {
  page?: number
  limit?: number
  searchText?: string
  forumTitle?: string
  posterId?: string
  postTime?: string
  categoryId?: string
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
  count: number  // 后端返回的是count，不是total
  data: T[]
}

/**
 * 获取讨论论坛列表
 */
export function getForumList(params: TableParams): Promise<PageResponse<DiscussionForum>> {
  const requestParams: any = {
    page: params.page || 1,
    limit: params.limit || 10
  }
  
  // 添加搜索条件
  if (params.forumTitle) {
    requestParams.forumTitle = params.forumTitle
  }
  if (params.posterId) {
    requestParams.posterId = params.posterId
  }
  if (params.postTime) {
    requestParams.postTime = params.postTime
  }
  if (params.categoryId) {
    requestParams.categoryId = params.categoryId
  }
  if (params.searchText) {
    requestParams.searchText = params.searchText
  }
  
  return request({
    url: '/DiscussionForumController/list',
    method: 'get',
    params: requestParams
  })
}

/**
 * 获取分类统计
 */
export function getCategoryStats(): Promise<ApiResponse<Record<string, number>>> {
  return request({
    url: '/DiscussionForumController/categoryStats',
    method: 'get'
  })
}

/**
 * 获取讨论详情
 */
export function getForumDetail(id: number): Promise<ApiResponse<DiscussionForum>> {
  return request({
    url: `/DiscussionForumController/detail/${id}`,
    method: 'get'
  })
}

/**
 * 新增讨论
 */
export function addForum(data: DiscussionForum): Promise<ApiResponse> {
  return request({
    url: '/DiscussionForumController/add',
    method: 'post',
    data
  })
}

/**
 * 更新讨论
 */
export function updateForum(data: DiscussionForum): Promise<ApiResponse> {
  return request({
    url: '/DiscussionForumController/edit',
    method: 'post',
    data
  })
}

/**
 * 删除讨论
 */
export function deleteForum(ids: string): Promise<ApiResponse> {
  return request({
    url: '/DiscussionForumController/remove',
    method: 'delete',
    params: { ids }
  })
}

/**
 * 点赞话题
 */
export function likeForum(id: number): Promise<ApiResponse> {
  return request({
    url: `/DiscussionForumController/like/${id}`,
    method: 'post'
  })
}
