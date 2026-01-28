import request from '@/utils/request'
import type { Training, ApiResponse } from '@/api/training'

export interface TrainingContentBlock {
  id?: number
  trainingId?: number
  blockType: 'text' | 'image' | 'video' | 'pdf' | 'file'
  sortOrder?: number
  content?: string
  materialId?: number
}

export function addTraining(data: Training): Promise<ApiResponse> {
  return request({
    url: '/TrainingController/add',
    method: 'post',
    data
  })
}

export function updateTraining(data: Training): Promise<ApiResponse> {
  return request({
    url: '/TrainingController/edit',
    method: 'post',
    data
  })
}

export function deleteTraining(ids: string): Promise<ApiResponse> {
  return request({
    url: '/TrainingController/remove',
    method: 'delete',
    params: { ids }
  })
}

export function setTrainingMaterials(trainingId: number, items: any[]): Promise<ApiResponse> {
  return request({
    url: `/TrainingController/materials/${trainingId}`,
    method: 'post',
    data: items
  })
}

export function getTrainingContentBlocks(trainingId: number): Promise<ApiResponse<TrainingContentBlock[]>> {
  return request({
    url: `/TrainingController/content-blocks/${trainingId}`,
    method: 'get'
  })
}

export function saveTrainingContentBlocks(trainingId: number, items: TrainingContentBlock[]): Promise<ApiResponse<number>> {
  return request({
    url: `/TrainingController/content-blocks/${trainingId}`,
    method: 'post',
    data: items
  })
}

