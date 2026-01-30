import request from '@/utils/request'

export interface ScheduleItem {
  id?: number
  scheduleId?: number
  courseName?: string
  courseType?: string
  scheduleDate?: string
  startTime?: string
  endTime?: string
  classroom?: string
  instructorId?: string
  instructorName?: string
  maxStudents?: number
  enrolledStudents?: number
  status?: string
  description?: string
  createTime?: string
  updateTime?: string
}

export interface PageResponse<T> {
  code: number
  msg: string
  count: number
  data: T[]
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
}

export function listSchedule(params?: { page?: number; limit?: number; searchText?: string; status?: string; instructorName?: string }) {
  return request<PageResponse<ScheduleItem>>({
    url: '/ScheduleController/list',
    method: 'get',
    params: { page: params?.page || 1, limit: params?.limit || 10, ...params }
  } as any)
}

export function addSchedule(data: ScheduleItem) {
  return request<ApiResponse>({
    url: '/ScheduleController/add',
    method: 'post',
    data
  } as any)
}

export function updateSchedule(data: ScheduleItem) {
  return request<ApiResponse>({
    url: '/ScheduleController/edit',
    method: 'post',
    data
  } as any)
}

export function deleteSchedule(ids: string) {
  return request<ApiResponse>({
    url: '/ScheduleController/remove',
    method: 'delete',
    params: { ids }
  } as any)
}

