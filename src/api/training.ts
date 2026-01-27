import request from '@/utils/request'

export interface Training {
  id?: number
  trainingId?: number
  trainingName?: string
  trainingType?: string
  description?: string
  startDate?: string
  endDate?: string
  instructorId?: string
  instructorName?: string
  maxParticipants?: number
  currentParticipants?: number
  status?: string
  createTime?: string
  updateTime?: string
}

export interface TrainingMaterial {
  id?: number
  trainingId?: number
  materialId?: number
  sortOrder?: number
  required?: number
  createTime?: string
}

export interface TrainingMaterialProgress {
  id?: number
  trainingId: number
  materialId: number
  studentId: number
  progressPercent?: number
  completed?: number
  lastPosition?: number
}

export interface TrainingProgress {
  id?: number
  trainingId?: number
  studentId?: number
  studentName?: string
  progressPercent?: number
  completedCount?: number
  totalCount?: number
  status?: string
  lastStudyTime?: string
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
  count?: number
}

export function getTrainingList(params: any): Promise<ApiResponse<Training[]>> {
  return request({
    url: '/TrainingController/list',
    method: 'get',
    params
  })
}

export function getTrainingDetail(id: number): Promise<ApiResponse<Training>> {
  return request({
    url: `/TrainingController/detail/${id}`,
    method: 'get'
  })
}

export function getTrainingMaterials(trainingId: number): Promise<ApiResponse<TrainingMaterial[]>> {
  return request({
    url: `/TrainingController/materials/${trainingId}`,
    method: 'get'
  })
}

export function startTraining(trainingId: number, studentId: number, studentName?: string): Promise<ApiResponse<TrainingProgress>> {
  return request({
    url: '/TrainingProgressController/start',
    method: 'post',
    params: { trainingId, studentId, studentName }
  })
}

export function getTrainingProgress(trainingId: number, studentId: number): Promise<ApiResponse<TrainingProgress>> {
  return request({
    url: '/TrainingProgressController/get',
    method: 'get',
    params: { trainingId, studentId }
  })
}

export function getTrainingMaterialProgressList(trainingId: number, studentId: number): Promise<ApiResponse<any[]>> {
  return request({
    url: '/TrainingProgressController/materialList',
    method: 'get',
    params: { trainingId, studentId }
  })
}

export function reportTrainingMaterialProgress(data: TrainingMaterialProgress): Promise<ApiResponse<TrainingProgress>> {
  return request({
    url: '/TrainingProgressController/reportMaterial',
    method: 'post',
    data
  })
}

