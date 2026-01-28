import request from '@/utils/request'
import type { TrainingProgress, ApiResponse } from '@/api/training'
import type { Training } from '@/api/training'

export interface ProgressStatistics {
  avgProgressPercent: number // 平均完成率
  completedRate: number // 完成率（已完成人数/总人数）
  completedCount: number // 已完成人数
  learningCount: number // 学习中人数
  needFollowCount: number // 待跟进人数
}

export interface ProgressDetail {
  progress: TrainingProgress
  training?: Training
  student?: {
    id?: number
    studentId?: number
    studentName?: string
    phone?: string
    email?: string
    department?: string
    position?: string
  }
  materialProgressList?: Array<{
    id?: number
    materialId: number
    progressPercent?: number
    completed?: number
    lastPosition?: number
    lastStudyTime?: string
  }>
}

export interface ProgressListParams {
  page?: number
  limit?: number
  trainingId?: number
  studentId?: number
  status?: string
  searchText?: string
}

export interface PageResponse<T> {
  code: number
  msg: string
  count: number
  data: T[]
}

// 获取进度列表
export function getProgressList(params: ProgressListParams): Promise<PageResponse<TrainingProgress>> {
  const requestParams: any = {
    page: params.page || 1,
    limit: params.limit || 10
  }
  if (params.trainingId) requestParams.trainingId = params.trainingId
  if (params.studentId) requestParams.studentId = params.studentId
  if (params.status) requestParams.status = params.status
  if (params.searchText) requestParams.searchText = params.searchText

  return request({
    url: '/TrainingProgressController/list',
    method: 'get',
    params: requestParams
  })
}

// 获取进度统计
export function getProgressStatistics(trainingId?: number): Promise<ApiResponse<ProgressStatistics>> {
  return request({
    url: '/TrainingProgressController/statistics',
    method: 'get',
    params: trainingId ? { trainingId } : {}
  })
}

// 获取进度详情
export function getProgressDetail(id: number): Promise<ApiResponse<ProgressDetail>> {
  return request({
    url: `/TrainingProgressController/detail/${id}`,
    method: 'get'
  })
}
