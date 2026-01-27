import request from '@/utils/request'

// 题目实体
export interface QuestionBank {
  id?: number
  questionId?: number
  questionType?: string // 单选、多选、判断
  questionContent?: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctAnswer?: string
  explanation?: string
  category?: string
  difficulty?: string // 基础、提高、挑战
  score?: number
  creatorId?: string
  creatorName?: string
  createTime?: string
  updateTime?: string
}

// 分页参数
export interface QuestionBankListParams {
  page?: number
  limit?: number
  searchText?: string
  questionType?: string
  category?: string
  difficulty?: string
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
 * 获取题目列表
 */
export function getQuestionBankList(params: QuestionBankListParams): Promise<PageResponse<QuestionBank>> {
  const requestParams: any = {
    page: params.page || 1,
    limit: params.limit || 10
  }
  
  if (params.searchText) {
    requestParams.searchText = params.searchText
  }
  if (params.questionType) {
    requestParams.questionType = params.questionType
  }
  if (params.category) {
    requestParams.category = params.category
  }
  if (params.difficulty) {
    requestParams.difficulty = params.difficulty
  }
  
  return request({
    url: '/QuestionBankController/list',
    method: 'get',
    params: requestParams
  })
}

/**
 * 获取题目详情
 */
export function getQuestionBankDetail(id: number): Promise<ApiResponse<QuestionBank>> {
  return request({
    url: `/QuestionBankController/detail/${id}`,
    method: 'get'
  })
}

/**
 * 新增题目
 */
export function addQuestionBank(data: QuestionBank): Promise<ApiResponse> {
  return request({
    url: '/QuestionBankController/add',
    method: 'post',
    data
  })
}

/**
 * 更新题目
 */
export function updateQuestionBank(data: QuestionBank): Promise<ApiResponse> {
  return request({
    url: '/QuestionBankController/edit',
    method: 'post',
    data
  })
}

/**
 * 删除题目
 */
export function deleteQuestionBank(ids: string): Promise<ApiResponse> {
  return request({
    url: '/QuestionBankController/remove',
    method: 'delete',
    params: { ids }
  })
}
