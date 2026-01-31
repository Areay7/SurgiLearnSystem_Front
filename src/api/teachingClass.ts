import request from '@/utils/request'

export interface TeachingClass {
  id?: number
  classCode?: string
  className?: string
  description?: string
  status?: string
  createTime?: string
  updateTime?: string
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
  count?: number
}

export interface PageResponse<T> {
  code: number
  msg: string
  count: number
  data: T[]
}

export function listTeachingClasses(params?: { page?: number; limit?: number; searchText?: string }): Promise<PageResponse<TeachingClass>> {
  return request({
    url: '/TeachingClassController/list',
    method: 'get',
    params: { page: params?.page || 1, limit: params?.limit || 10, searchText: params?.searchText }
  })
}

/** 用于培训/考试指定班级时获取班级列表（管理员和讲师可调用） */
export function listTeachingClassesForAssign(params?: { page?: number; limit?: number; searchText?: string }): Promise<PageResponse<TeachingClass>> {
  return request({
    url: '/TeachingClassController/listForAssign',
    method: 'get',
    params: { page: params?.page || 1, limit: params?.limit || 200, searchText: params?.searchText }
  })
}

export function addTeachingClass(data: TeachingClass): Promise<ApiResponse> {
  return request({
    url: '/TeachingClassController/add',
    method: 'post',
    data
  })
}

export function updateTeachingClass(data: TeachingClass): Promise<ApiResponse> {
  return request({
    url: '/TeachingClassController/edit',
    method: 'post',
    data
  })
}

export function deleteTeachingClass(ids: string): Promise<ApiResponse> {
  return request({
    url: '/TeachingClassController/remove',
    method: 'delete',
    params: { ids }
  })
}

export function listClassInstructors(classId: number): Promise<ApiResponse<any[]>> {
  return request({
    url: `/TeachingClassController/${classId}/instructors`,
    method: 'get'
  })
}

export function listClassStudents(classId: number): Promise<ApiResponse<any[]>> {
  return request({
    url: `/TeachingClassController/${classId}/students`,
    method: 'get'
  })
}

export function batchAddClassStudents(classId: number, ids: number[]): Promise<ApiResponse> {
  return request({
    url: `/TeachingClassController/${classId}/students/batchAdd`,
    method: 'post',
    data: { ids }
  })
}

export function batchRemoveClassStudents(classId: number, ids: number[]): Promise<ApiResponse> {
  return request({
    url: `/TeachingClassController/${classId}/students/batchRemove`,
    method: 'post',
    data: { ids }
  })
}

export function batchAddClassInstructors(classId: number, ids: number[]): Promise<ApiResponse> {
  return request({
    url: `/TeachingClassController/${classId}/instructors/batchAdd`,
    method: 'post',
    data: { ids }
  })
}

export function batchRemoveClassInstructors(classId: number, ids: number[]): Promise<ApiResponse> {
  return request({
    url: `/TeachingClassController/${classId}/instructors/batchRemove`,
    method: 'post',
    data: { ids }
  })
}

