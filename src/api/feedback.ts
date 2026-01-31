import request from '@/utils/request'

export interface UserFeedback {
  id?: number
  userId?: string
  userName?: string
  title?: string
  content?: string
  rating?: number
  feedbackType?: string
  relateId?: number
  relateName?: string
  status?: string
  replyContent?: string
  replyTime?: string
  createTime?: string
}

export interface PageResponse<T> {
  code: number
  msg: string
  count: number
  data: T[]
}

export function getFeedbackList(params?: {
  page?: number
  limit?: number
  feedbackType?: string
  status?: string
  keyword?: string
}) {
  return request({
    url: '/UserFeedbackController/list',
    method: 'get',
    params
  })
}

export function addFeedback(data: UserFeedback) {
  return request({
    url: '/UserFeedbackController/add',
    method: 'post',
    data
  })
}

export function getFeedbackDetail(id: number) {
  return request({
    url: `/UserFeedbackController/detail/${id}`,
    method: 'get'
  })
}

export function updateFeedback(data: UserFeedback) {
  return request({
    url: '/UserFeedbackController/update',
    method: 'post',
    data
  })
}

export function removeFeedback(id: number) {
  return request({
    url: `/UserFeedbackController/remove/${id}`,
    method: 'delete'
  })
}
