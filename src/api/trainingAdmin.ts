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

export interface TrainingContentBlockProgress {
  id?: number
  trainingId: number
  blockId: number
  studentId: number
  blockType?: string
  viewed?: number // 1-已浏览 0-未浏览
  viewDuration?: number // 浏览时长（秒）
  playProgress?: number // 播放进度（百分比），用于视频
  scrollProgress?: number // 滚动进度（百分比），用于PDF
  downloaded?: number // 1-已下载 0-未下载，用于文件
}

export function reportBlockProgress(data: TrainingContentBlockProgress): Promise<ApiResponse<Training>> {
  return request({
    url: '/TrainingProgressController/reportBlock',
    method: 'post',
    data
  })
}

