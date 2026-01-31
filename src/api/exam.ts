import request from '@/utils/request'

// 考试实体
export interface Exam {
  id?: number
  examId?: number
  examName?: string
  examType?: string
  examDate?: string
  startTime?: string
  endTime?: string
  duration?: number // 时长（分钟）
  totalScore?: number
  passScore?: number
  questionIds?: string // 题目ID列表，逗号分隔或JSON格式
  status?: string // 未开始、进行中、已结束、待阅卷
  creatorId?: string
  creatorName?: string
  createTime?: string
  updateTime?: string
  classIds?: number[]
}

// 分页参数
export interface ExamListParams {
  page?: number
  limit?: number
  searchText?: string
  examType?: string
  status?: string
  examDate?: string
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
 * 获取考试列表
 */
export function getExamList(params: ExamListParams): Promise<PageResponse<Exam>> {
  const requestParams: any = {
    page: params.page || 1,
    limit: params.limit || 10
  }
  
  if (params.searchText) {
    requestParams.searchText = params.searchText
  }
  if (params.examType) {
    requestParams.examType = params.examType
  }
  if (params.status) {
    requestParams.status = params.status
  }
  if (params.examDate) {
    requestParams.examDate = params.examDate
  }
  
  return request({
    url: '/ExamController/list',
    method: 'get',
    params: requestParams
  })
}

/**
 * 获取考试详情
 */
export function getExamDetail(id: number): Promise<ApiResponse<Exam>> {
  return request({
    url: `/ExamController/detail/${id}`,
    method: 'get'
  })
}

/**
 * 新增考试
 */
export function addExam(data: Exam): Promise<ApiResponse> {
  return request({
    url: '/ExamController/add',
    method: 'post',
    data
  })
}

/**
 * 更新考试
 */
export function updateExam(data: Exam): Promise<ApiResponse> {
  return request({
    url: '/ExamController/edit',
    method: 'post',
    data
  })
}

/**
 * 删除考试
 */
export function deleteExam(ids: string): Promise<ApiResponse> {
  return request({
    url: '/ExamController/remove',
    method: 'delete',
    params: { ids }
  })
}
