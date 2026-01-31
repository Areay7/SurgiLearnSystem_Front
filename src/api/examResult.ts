import request from '@/utils/request'

// 考试结果实体
export interface ExamResult {
  id?: number
  examId?: number
  examName?: string
  studentId?: string
  studentName?: string
  answers?: string // JSON格式：{"questionId1": "A", "questionId2": "A,B"}
  totalScore?: number
  obtainedScore?: number
  passScore?: number
  status?: string // 进行中、已完成、已阅卷
  startTime?: string
  submitTime?: string
  duration?: number
  createTime?: string
  updateTime?: string
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
}

// 分页响应
export interface PageResponse<T> {
  code: number
  msg: string
  count: number
  data: T[]
}

/**
 * 获取考试结果列表
 */
export function getExamResultList(params: {
  page?: number
  limit?: number
  examId?: number
  studentId?: string
  studentKeyword?: string
  status?: string
}): Promise<PageResponse<ExamResult>> {
  const requestParams: any = {
    page: params.page || 1,
    limit: params.limit || 10
  }
  
  if (params.examId) {
    requestParams.examId = params.examId
  }
  if (params.studentId) {
    requestParams.studentId = params.studentId
  }
  if (params.studentKeyword) {
    requestParams.studentKeyword = params.studentKeyword
  }
  if (params.status) {
    requestParams.status = params.status
  }
  
  return request({
    url: '/ExamResultController/list',
    method: 'get',
    params: requestParams
  })
}

/**
 * 根据考试ID和学员ID获取考试结果
 */
export function getExamResultByExamAndStudent(examId: number, studentId: string): Promise<ApiResponse<ExamResult>> {
  return request({
    url: '/ExamResultController/getByExamAndStudent',
    method: 'get',
    params: { examId, studentId }
  })
}

/**
 * 开始考试
 */
export function startExam(data: ExamResult): Promise<ApiResponse<ExamResult>> {
  return request({
    url: '/ExamResultController/start',
    method: 'post',
    data
  })
}

/**
 * 保存答案
 */
export function saveAnswer(data: ExamResult): Promise<ApiResponse> {
  return request({
    url: '/ExamResultController/saveAnswer',
    method: 'post',
    data
  })
}

/**
 * 提交考试
 */
export function submitExam(data: ExamResult): Promise<ApiResponse> {
  return request({
    url: '/ExamResultController/submit',
    method: 'post',
    data
  })
}

/**
 * 获取考试结果详情
 */
export function getExamResultDetail(id: number): Promise<ApiResponse<ExamResult>> {
  return request({
    url: `/ExamResultController/detail/${id}`,
    method: 'get'
  })
}
