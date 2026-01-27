import request from '@/utils/request'

// 学员记录实体
export interface Students {
  id?: number
  studentId?: number
  studentName: string
  phone?: string
  email?: string
  gender?: string
  birthDate?: string
  department?: string
  position?: string
  employeeId?: string
  userType?: number // 1-学员 2-讲师 3-其他(管理员)
  status?: string
  enrollmentDate?: string
  createTime?: string
  updateTime?: string
}

// 分页参数
export interface StudentsListParams {
  page?: number
  limit?: number
  searchText?: string
  studentName?: string
  phone?: string
  employeeId?: string
  userType?: number
  status?: string
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
 * 获取学员记录列表
 */
export function getStudentsList(params: StudentsListParams): Promise<PageResponse<Students>> {
  const requestParams: any = {
    page: params.page || 1,
    limit: params.limit || 10
  }
  
  if (params.studentName) {
    requestParams.studentName = params.studentName
  }
  if (params.phone) {
    requestParams.phone = params.phone
  }
  if (params.employeeId) {
    requestParams.employeeId = params.employeeId
  }
  if (params.userType !== undefined && params.userType !== null) {
    requestParams.userType = params.userType
  }
  if (params.status) {
    requestParams.status = params.status
  }
  if (params.searchText) {
    requestParams.searchText = params.searchText
  }
  
  return request({
    url: '/StudentsController/list',
    method: 'get',
    params: requestParams
  })
}

/**
 * 获取学员详情
 */
export function getStudentDetail(id: number): Promise<ApiResponse<Students>> {
  return request({
    url: `/StudentsController/detail/${id}`,
    method: 'get'
  })
}

/**
 * 新增学员记录
 */
export function addStudent(data: Students): Promise<ApiResponse> {
  return request({
    url: '/StudentsController/add',
    method: 'post',
    data
  })
}

/**
 * 更新学员记录
 */
export function updateStudent(data: Students): Promise<ApiResponse> {
  return request({
    url: '/StudentsController/edit',
    method: 'post',
    data
  })
}

/**
 * 删除学员记录
 */
export function deleteStudent(ids: string): Promise<ApiResponse> {
  return request({
    url: '/StudentsController/remove',
    method: 'delete',
    params: { ids }
  })
}
