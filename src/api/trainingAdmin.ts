import request from '@/utils/request'
import type { Training, ApiResponse } from '@/api/training'

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

