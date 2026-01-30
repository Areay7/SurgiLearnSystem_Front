import request from '@/utils/request'

export interface DashboardStats {
  studentCount: number
  trainingCount: number
  questionCount: number
  videoCount: number
  resourceCount: number
  examOngoingCount: number
}

export interface DashboardActivity {
  type: string
  time: string
  title: string
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
}

/**
 * 获取首页统计数据
 */
export function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return request({
    url: '/DashboardController/stats',
    method: 'get'
  })
}

/**
 * 获取最近活动
 */
export function getDashboardActivities(limit?: number): Promise<ApiResponse<DashboardActivity[]>> {
  return request({
    url: '/DashboardController/activities',
    method: 'get',
    params: limit ? { limit } : {}
  })
}
