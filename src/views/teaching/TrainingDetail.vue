<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ training?.trainingName || '培训详情' }}</h1>
        <div class="sub">{{ training?.description || '—' }}</div>
      </div>
      <div class="header-actions">
        <span class="badge" :class="progress?.status === '已完成' ? 'ok' : 'muted'">
          {{ progress?.status || '未开始' }}
        </span>
      </div>
    </div>

    <div class="card">
      <div class="progress-row">
        <div class="progress-text">
          进度：{{ progress?.progressPercent ?? 0 }}%（{{ progress?.completedCount ?? 0 }}/{{ progress?.totalCount ?? 0 }}）
        </div>
        <div class="bar">
          <div class="bar-inner" :style="{ width: (progress?.progressPercent ?? 0) + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-header">
        <div class="section-title">培训资料</div>
        <div v-if="isAdmin" class="section-actions">
          <router-link :to="`/training/${trainingId}/edit-materials`" class="btn-editor">编辑培训资料（白板）</router-link>
          <button class="btn-config" @click="openConfigDialog">配置资料</button>
        </div>
      </div>
      <!-- 白板资料：有内容块时按白板从上往下展示 -->
      <div v-if="contentBlocks.length > 0" class="whiteboard-view">
        <div
          v-for="(block, index) in contentBlocks"
          :key="block.id || index"
          class="wb-block"
          :class="`wb-${block.blockType}`"
        >
          <div class="wb-block-label">{{ blockLabel(block.blockType) }}</div>
          <div class="wb-block-body">
            <template v-if="block.blockType === 'text'">
              <div
                :ref="el => setTextBlockRef(block.id!, el)"
                class="wb-text"
                v-html="textToHtml(block.content)"
                @scroll="onTextScroll(block.id!)"
              ></div>
            </template>
            <template v-else-if="block.materialId && contentBlockMaterialMap[block.materialId]">
              <template v-if="block.blockType === 'image'">
                <img
                  :src="previewUrlFor(block.materialId)"
                  class="wb-preview-img"
                  alt="预览"
                  @click="onImageClick(block.id!, block.materialId!)"
                />
                <div class="wb-meta">{{ contentBlockMaterialMap[block.materialId].title || contentBlockMaterialMap[block.materialId].originalName }}</div>
              </template>
              <template v-else-if="block.blockType === 'video'">
                <div class="wb-video-container">
                  <div class="wb-file-name">{{ contentBlockMaterialMap[block.materialId].title || contentBlockMaterialMap[block.materialId].originalName }}</div>
                  <video
                    :ref="el => setVideoRef(block.id!, el)"
                    :src="previewUrlFor(block.materialId)"
                    controls
                    playsinline
                    webkit-playsinline
                    class="wb-video"
                    preload="metadata"
                    @play="onVideoPlay(block.id!)"
                    @ended="onVideoEnded(block.id!)"
                    @timeupdate="onVideoTimeUpdate(block.id!, $event)"
                  ></video>
                </div>
              </template>
              <template v-else-if="block.blockType === 'pdf'">
                <div class="wb-pdf-container">
                  <div class="wb-file-name">{{ contentBlockMaterialMap[block.materialId].title || contentBlockMaterialMap[block.materialId].originalName }}</div>
                  <iframe
                    :ref="el => setPdfRef(block.id!, el)"
                    :src="previewUrlFor(block.materialId)"
                    class="wb-pdf-iframe"
                    @load="onPdfLoad(block.id!)"
                  ></iframe>
                </div>
              </template>
              <template v-else-if="block.blockType === 'file'">
                <div class="wb-file-row">
                  <span class="wb-file-name">{{ contentBlockMaterialMap[block.materialId].title || contentBlockMaterialMap[block.materialId].originalName }}</span>
                  <button type="button" class="btn" :disabled="fileDownloading === block.materialId" @click="handleFileDownload(block.id!, block.materialId!)">下载</button>
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>
      <!-- 原有表格：无白板内容或管理员查看时仍可看关联资料列表 -->
      <div v-else class="table">
        <div class="tr th">
          <div class="td">资料ID</div>
          <div class="td">完成情况</div>
          <div class="td">进度</div>
          <div class="td actions">操作</div>
        </div>
        <div class="tr" v-for="m in materials" :key="m.id">
          <div class="td">{{ m.materialId }}</div>
          <div class="td">
            <span class="badge" :class="isCompleted(m.materialId) ? 'ok' : 'muted'">
              {{ isCompleted(m.materialId) ? '已完成' : '未完成' }}
            </span>
          </div>
          <div class="td">{{ getPercent(m.materialId) }}%</div>
          <div class="td actions">
            <button class="btn" @click="openPreview(m.materialId!)">预览</button>
            <button class="btn" @click="markDone(m.materialId!)">标记完成</button>
          </div>
        </div>
        <div class="tr" v-if="materials.length === 0">
          <div class="td" style="grid-column: 1 / -1; text-align: center; padding: 18px;">暂无资料，请管理员在「编辑培训资料（白板）」或「配置资料」中添加。</div>
        </div>
      </div>
      <div class="hint">说明：PDF/图片/视频可在线预览；Word/PPT 等文档供下载。管理员可使用「编辑培训资料（白板）」从上往下自由编排资料。</div>
    </div>

    <!-- 配置培训资料（仅管理员） -->
    <div v-if="showConfigDialog" class="dialog-overlay" @click="closeConfig">
      <div class="dialog config-dialog" @click.stop>
        <div class="dialog-header">
          <h3>配置培训资料</h3>
          <button class="close-btn" @click="closeConfig">×</button>
        </div>
        <div class="dialog-body">
          <div class="config-toolbar">
            <input
              class="form-input"
              v-model="materialSearch"
              placeholder="搜索资料标题/描述..."
              @keyup.enter="loadMaterialOptions"
            />
            <button class="btn" @click="loadMaterialOptions" :disabled="loadingMaterials">搜索</button>
          </div>
          <div class="table">
            <div class="tr th">
              <div class="td checkbox-col">
                <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll($event)" />
              </div>
              <div class="td">标题</div>
              <div class="td">文件名</div>
              <div class="td">类型</div>
              <div class="td">大小</div>
            </div>
            <div
              class="tr"
              v-for="m in materialOptions"
              :key="m.id"
            >
              <div class="td checkbox-col">
                <input
                  type="checkbox"
                  :value="m.id"
                  v-model="selectedMaterialIds"
                />
              </div>
              <div class="td">{{ m.title || '-' }}</div>
              <div class="td">{{ m.originalName || '-' }}</div>
              <div class="td">{{ m.fileType || '-' }}</div>
              <div class="td">{{ formatSize(m.fileSize) }}</div>
            </div>
            <div class="tr" v-if="materialOptions.length === 0">
              <div class="td" style="grid-column: 1 / -1; text-align: center; padding: 16px;">
                暂无可选资料
              </div>
            </div>
          </div>
          <div class="hint">
            已选择 {{ selectedMaterialIds.length }} 条资料。保存后，该培训的学习进度将按所选资料数量计算“完成情况”。
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeConfig" :disabled="savingConfig">取消</button>
          <button class="btn-confirm" @click="saveConfig" :disabled="savingConfig">
            {{ savingConfig ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 预览弹窗：复用学习资料 preview 接口 -->
    <div v-if="showPreview" class="dialog-overlay" @click="closePreview">
      <div class="dialog preview-dialog" @click.stop>
        <div class="dialog-header">
          <h3>资料预览</h3>
          <button class="close-btn" @click="closePreview">×</button>
        </div>
        <div class="dialog-body">
          <div class="preview-container">
            <iframe v-if="previewType === 'pdf'" :src="previewUrl" class="preview-iframe"></iframe>
            <img v-else-if="previewType === 'image'" :src="previewUrl" class="preview-image" />
            <video v-else-if="previewType === 'video'" controls class="preview-video" preload="metadata">
              <source :src="previewUrl" type="video/mp4" />
            </video>
            <div v-else class="fallback">
              <p>该文件类型暂不支持在线预览，请下载后查看。</p>
              <a :href="previewUrl" target="_blank">在新窗口中打开</a>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <a v-if="previewUrl" :href="previewUrl" target="_blank" class="btn-open-new">在新窗口中打开</a>
          <button class="btn-cancel" @click="closePreview">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getTrainingDetail, getTrainingMaterials, getTrainingMaterialProgressList, getTrainingProgress, reportTrainingMaterialProgress, startTraining } from '@/api/training'
import type { Training, TrainingMaterial, TrainingProgress } from '@/api/training'
import { getMaterialsList, downloadMaterialWithFilename, getMaterialPreviewUrl, type LearningMaterial } from '@/api/materials'
import { getStudentInfo } from '@/api/auth'
import { setTrainingMaterials, getTrainingContentBlocks, reportBlockProgress } from '@/api/trainingAdmin'
import type { TrainingContentBlock, TrainingContentBlockProgress } from '@/api/trainingAdmin'

const route = useRoute()
const authStore = useAuthStore()

const trainingId = computed(() => Number(route.params.id))
const studentId = ref<number>(0)
const studentName = computed(() => authStore.nickname || authStore.userPhone || '')
const isAdmin = computed(() => (authStore.userType || 0) === 1)
const isInstructor = computed(() => (authStore.userType || 0) === 2)

const training = ref<Training | null>(null)
const materials = ref<TrainingMaterial[]>([])
const contentBlocks = ref<(TrainingContentBlock & { id?: number })[]>([])
const contentBlockMaterialMap = ref<Record<number, LearningMaterial>>({})
const materialPreviewUrls = ref<Record<number, string>>({})
const progress = ref<TrainingProgress | null>(null)
const materialProgressMap = ref<Record<number, { percent: number; completed: boolean }>>({})

const starting = ref(false)

const showPreview = ref(false)
const previewUrl = ref('')
const previewType = ref<'pdf' | 'image' | 'video' | 'other'>('other')

// 配置资料相关（仅管理员）
const showConfigDialog = ref(false)
const materialOptions = ref<LearningMaterial[]>([])
const selectedMaterialIds = ref<number[]>([])
const materialSearch = ref('')
const loadingMaterials = ref(false)
const savingConfig = ref(false)
const fileDownloading = ref<number | null>(null)

const loadStudentId = async () => {
  if (!authStore.userPhone) return
  try {
    const res = await getStudentInfo(authStore.userPhone)
    if ((res.code === 0 || res.code === 200) && res.data?.id) {
      studentId.value = res.data.id
    }
  } catch {
    studentId.value = 0
  }
}

const load = async () => {
  const id = trainingId.value
  if (!id) return
  await loadStudentId()
  const d = await getTrainingDetail(id)
  training.value = d.data || null

  const [mRes, cbRes] = await Promise.all([
    getTrainingMaterials(id),
    getTrainingContentBlocks(id).catch(() => ({ data: [] }))
  ])
  materials.value = mRes.data || []
  contentBlocks.value = (cbRes.data || []) as (TrainingContentBlock & { id?: number })[]

  const materialIds = new Set<number>()
  contentBlocks.value.forEach(b => { if (b.materialId) materialIds.add(b.materialId) })
  materials.value.forEach(m => { if (m.materialId) materialIds.add(m.materialId) })
  if (materialIds.size > 0) {
    const listRes = await getMaterialsList({ page: 1, limit: 500, status: '已发布' })
    const list: LearningMaterial[] = listRes.data || []
    const map: Record<number, LearningMaterial> = {}
    list.forEach(mat => { if (mat.id && materialIds.has(mat.id)) map[mat.id] = mat })
    contentBlockMaterialMap.value = map
    loadPreviewUrls(Array.from(materialIds))
  } else {
    contentBlockMaterialMap.value = {}
    materialPreviewUrls.value = {}
  }

  if (studentId.value) {
    try {
      const p = await getTrainingProgress(id, studentId.value)
      progress.value = p.data || null
    } catch {
      progress.value = null
    }
    await loadMaterialProgress()
  }
}

const loadPreviewUrls = async (materialIds: number[]) => {
  const urls: Record<number, string> = {}
  await Promise.all(materialIds.map(async (id) => {
    try {
      const url = await getMaterialPreviewUrl(id)
      if (url) urls[id] = url
    } catch { /* ignore */ }
  }))
  materialPreviewUrls.value = { ...materialPreviewUrls.value, ...urls }
}

const loadMaterialProgress = async () => {
  if (!trainingId.value || !studentId.value) return
  const res = await getTrainingMaterialProgressList(trainingId.value, studentId.value)
  const list: any[] = res.data || []
  const map: any = {}
  for (const it of list) {
    const mid = Number(it.materialId)
    map[mid] = {
      percent: Number(it.progressPercent ?? 0),
      completed: Number(it.completed ?? 0) === 1
    }
  }
  materialProgressMap.value = map
}

const openConfigDialog = async () => {
  if (!isAdmin.value) return
  // 当前已关联的 materialId 作为默认选中
  selectedMaterialIds.value = materials.value
    .map(m => Number(m.materialId))
    .filter(id => !!id) as number[]
  await loadMaterialOptions()
  showConfigDialog.value = true
}

const closeConfig = () => {
  showConfigDialog.value = false
}

const loadMaterialOptions = async () => {
  loadingMaterials.value = true
  try {
    const res = await getMaterialsList({
      page: 1,
      limit: 100,
      searchText: materialSearch.value || undefined,
      status: '已发布'
    })
    materialOptions.value = res.data || []
  } catch (e: any) {
    alert(e.message || '加载资料失败')
  } finally {
    loadingMaterials.value = false
  }
}

const isAllSelected = computed(() => {
  const ids = materialOptions.value.map(m => m.id).filter(Boolean) as number[]
  return ids.length > 0 && ids.every(id => selectedMaterialIds.value.includes(id))
})

const toggleSelectAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    selectedMaterialIds.value = materialOptions.value.map(m => m.id).filter(Boolean) as number[]
  } else {
    selectedMaterialIds.value = []
  }
}

const saveConfig = async () => {
  if (!trainingId.value) return
  savingConfig.value = true
  try {
    const items = selectedMaterialIds.value.map((id, idx) => ({
      materialId: id,
      sortOrder: idx,
      required: 1
    }))
    const res = await setTrainingMaterials(trainingId.value, items as any)
    if (res.code === 0 || res.code === 200) {
      alert('保存成功')
      showConfigDialog.value = false
      // 重新加载培训资料列表
      const m = await getTrainingMaterials(trainingId.value)
      materials.value = m.data || []
      // 更新总进度中的总数
      if (progress.value) {
        progress.value.totalCount = materials.value.length
      }
    } else {
      alert(res.msg || '保存失败')
    }
  } catch (e: any) {
    alert(e.message || '保存失败')
  } finally {
    savingConfig.value = false
  }
}

const formatSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(1)} ${units[i]}`
}

const handleStart = async () => {
  if (!trainingId.value || !studentId.value) {
    alert('请先在个人中心完善个人信息后再开始学习')
    return
  }
  starting.value = true
  try {
    const res = await startTraining(trainingId.value, studentId.value, studentName.value)
    progress.value = res.data || null
    await loadMaterialProgress()
  } catch (e: any) {
    alert(e.message || '初始化失败')
  } finally {
    starting.value = false
  }
}

const isCompleted = (materialId?: number) => {
  if (!materialId) return false
  return !!materialProgressMap.value[materialId]?.completed
}
const getPercent = (materialId?: number) => {
  if (!materialId) return 0
  return materialProgressMap.value[materialId]?.percent ?? 0
}

const blockLabel = (t: string) => {
  const map: Record<string, string> = { text: '文字', image: '图片', video: '视频', pdf: 'PDF', file: '文件' }
  return map[t] || t
}
const textToHtml = (s?: string) => {
  if (!s) return ''
  return s.replace(/\n/g, '<br/>')
}
// 白板内嵌预览使用带 token 的 URL，避免鉴权与 CORS
const previewUrlFor = (materialId: number) =>
  materialPreviewUrls.value[materialId] || ''

const guessTypeByExt = (ext?: string) => {
  const lower = (ext || '').toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (['.jpg', '.jpeg', '.png', '.gif'].some(e => lower.endsWith(e))) return 'image'
  if (lower.endsWith('.mp4')) return 'video'
  return 'other'
}

const openPreview = async (materialId: number, suggestedType?: 'pdf' | 'image' | 'video' | 'other') => {
  try {
    const url = materialPreviewUrls.value[materialId] || await getMaterialPreviewUrl(materialId)
    if (!url) {
      alert('获取预览地址失败')
      return
    }
    previewUrl.value = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
    previewType.value = suggestedType ?? 'other'
    showPreview.value = true
    if (contentBlocks.value.length === 0) {
      await report(materialId, 1, 0, 0)
    }
  } catch (e: any) {
    alert(e?.message || '预览失败')
  }
}

const markDone = async (materialId: number) => {
  await report(materialId, 100, 1, 0)
  await loadMaterialProgress()
  const p = await getTrainingProgress(trainingId.value, studentId.value)
  progress.value = p.data || null
}

const report = async (materialId: number, percent: number, completed: number, lastPosition: number) => {
  if (!trainingId.value || !studentId.value) return
  try {
    const res = await reportTrainingMaterialProgress({
      trainingId: trainingId.value,
      materialId,
      studentId: studentId.value,
      progressPercent: percent,
      completed,
      lastPosition
    })
    progress.value = res.data || progress.value
    // 本地同步
    materialProgressMap.value[materialId] = { percent, completed: completed === 1 }
  } catch {
    // 上报失败不阻塞 UI
  }
}

const closePreview = () => {
  showPreview.value = false
  previewUrl.value = ''
  previewType.value = 'other'
}

// 内容块浏览检测和进度上报
const textBlockRefs = ref<Record<number, HTMLElement>>({})
const textBlockViewTimes = ref<Record<number, number>>({})
const textBlockTimers = ref<Record<number, NodeJS.Timeout>>({})

const setTextBlockRef = (blockId: number, el: HTMLElement | null) => {
  if (el) {
    textBlockRefs.value[blockId] = el
    // 开始计时
    if (!textBlockTimers.value[blockId]) {
      textBlockViewTimes.value[blockId] = 0
      textBlockTimers.value[blockId] = setInterval(() => {
        textBlockViewTimes.value[blockId] = (textBlockViewTimes.value[blockId] || 0) + 1
        // 每3秒上报一次
        if (textBlockViewTimes.value[blockId] >= 3) {
          reportBlockProgressData(blockId, 'text', { viewed: 1, viewDuration: textBlockViewTimes.value[blockId] }, true)
          if (textBlockTimers.value[blockId]) {
            clearInterval(textBlockTimers.value[blockId])
            delete textBlockTimers.value[blockId]
          }
        }
      }, 1000)
    }
  }
}

const onTextScroll = (blockId: number) => {
  const el = textBlockRefs.value[blockId]
  if (!el) return
  const scrollPercent = Math.round(((el.scrollTop + el.clientHeight) / el.scrollHeight) * 100)
  // 滚动到底部（>= 95%）时标记完成
  if (scrollPercent >= 95) {
    reportBlockProgressData(blockId, 'text', { viewed: 1, viewDuration: textBlockViewTimes.value[blockId] || 3 }, true)
    if (textBlockTimers.value[blockId]) {
      clearInterval(textBlockTimers.value[blockId])
      delete textBlockTimers.value[blockId]
    }
  }
}

const onImageClick = (blockId: number, materialId: number) => {
  // 点击图片放大查看时标记为已完成
  reportBlockProgressData(blockId, 'image', { viewed: 1, viewDuration: 1 }, true)
  openPreview(materialId, 'image')
}

// 视频和PDF直接预览相关
const videoRefs = ref<Record<number, HTMLVideoElement>>({})
const pdfRefs = ref<Record<number, HTMLIFrameElement>>({})
const videoPlayedBlocks = ref<Record<number, boolean>>({})
const pdfViewTimers = ref<Record<number, NodeJS.Timeout>>({})
const pdfScrollCheckTimers = ref<Record<number, NodeJS.Timeout>>({})
const pdfViewStartTimes = ref<Record<number, number>>({})
const pdfLastReportedProgress = ref<Record<number, number>>({})

const setVideoRef = (blockId: number, el: HTMLVideoElement | null) => {
  if (el) {
    videoRefs.value[blockId] = el
  }
}

const setPdfRef = (blockId: number, el: HTMLIFrameElement | null) => {
  if (el) {
    pdfRefs.value[blockId] = el
  }
}

const onVideoPlay = (blockId: number) => {
  // 视频开始播放时标记为已浏览
  if (!videoPlayedBlocks.value[blockId]) {
    reportBlockProgressData(blockId, 'video', { viewed: 1, playProgress: 0 }, false)
    videoPlayedBlocks.value[blockId] = true
  }
}

const videoProgressThrottle = ref<Record<number, NodeJS.Timeout>>({})
const onVideoTimeUpdate = (blockId: number, event: Event) => {
  const video = event.target as HTMLVideoElement
  if (video) {
    if (video.duration && !isNaN(video.duration)) {
      videoCurrentTime.value[blockId] = video.currentTime
      const progress = Math.round((video.currentTime / video.duration) * 100)
      // 节流：每2秒上报一次播放进度，避免频繁刷新
      if (videoProgressThrottle.value[blockId]) {
        clearTimeout(videoProgressThrottle.value[blockId])
      }
      videoProgressThrottle.value[blockId] = setTimeout(() => {
        reportBlockProgressData(blockId, 'video', { viewed: 1, playProgress: progress }, false)
        delete videoProgressThrottle.value[blockId]
      }, 2000)
    }
  }
}

const onVideoEnded = (blockId: number) => {
  // 视频播放完成时标记为已完成
  reportBlockProgressData(blockId, 'video', { viewed: 1, playProgress: 100 }, true)
}

const onPdfLoad = (blockId: number) => {
  // PDF加载完成时标记为已浏览，记录开始时间
  pdfViewStartTimes.value[blockId] = Date.now()
  pdfLastReportedProgress.value[blockId] = 0
  reportBlockProgressData(blockId, 'pdf', { viewed: 1, scrollProgress: 0 }, false)
  
  // 开始检查PDF滚动（每2秒检查一次，减少频率）
  if (!pdfScrollCheckTimers.value[blockId]) {
    pdfScrollCheckTimers.value[blockId] = setInterval(() => {
      checkPdfScroll(blockId)
    }, 2000) // 改为2秒检查一次
  }
  
  // 如果PDF浏览超过30秒，也标记为完成（防止无法检测滚动的情况）
  if (!pdfViewTimers.value[blockId]) {
    pdfViewTimers.value[blockId] = setTimeout(() => {
      const viewDuration = Math.floor((Date.now() - (pdfViewStartTimes.value[blockId] || Date.now())) / 1000)
      reportBlockProgressData(blockId, 'pdf', { viewed: 1, scrollProgress: 100, viewDuration }, true)
      if (pdfScrollCheckTimers.value[blockId]) {
        clearInterval(pdfScrollCheckTimers.value[blockId])
        delete pdfScrollCheckTimers.value[blockId]
      }
    }, 30000) // 30秒
  }
}

const checkPdfScroll = (blockId: number) => {
  const iframe = pdfRefs.value[blockId]
  if (!iframe || !iframe.contentWindow) return
  
  try {
    const doc = iframe.contentWindow.document
    if (!doc || !doc.documentElement) return
    
    const scrollTop = iframe.contentWindow.scrollY || doc.documentElement.scrollTop || 0
    const scrollHeight = doc.documentElement.scrollHeight || doc.body.scrollHeight || 0
    const clientHeight = iframe.contentWindow.innerHeight || doc.documentElement.clientHeight || 0
    
    if (scrollHeight > 0) {
      const scrollPercent = Math.round(((scrollTop + clientHeight) / scrollHeight) * 100)
      
      // 滚动到底部（>= 95%）时标记完成
      if (scrollPercent >= 95) {
        const viewDuration = Math.floor((Date.now() - (pdfViewStartTimes.value[blockId] || Date.now())) / 1000)
        reportBlockProgressData(blockId, 'pdf', { viewed: 1, scrollProgress: 100, viewDuration }, true)
        if (pdfScrollCheckTimers.value[blockId]) {
          clearInterval(pdfScrollCheckTimers.value[blockId])
          delete pdfScrollCheckTimers.value[blockId]
        }
        if (pdfViewTimers.value[blockId]) {
          clearTimeout(pdfViewTimers.value[blockId])
          delete pdfViewTimers.value[blockId]
        }
      } else {
        // 节流上报：只在进度变化超过5%时才上报，避免频繁刷新
        const lastReported = pdfLastReportedProgress.value[blockId] || 0
        if (Math.abs(scrollPercent - lastReported) >= 5) {
          const viewDuration = Math.floor((Date.now() - (pdfViewStartTimes.value[blockId] || Date.now())) / 1000)
          reportBlockProgressData(blockId, 'pdf', { viewed: 1, scrollProgress: scrollPercent, viewDuration }, false)
          pdfLastReportedProgress.value[blockId] = scrollPercent
        }
      }
    }
  } catch (e) {
    // 跨域限制，无法检测滚动，依赖30秒超时
  }
}

const buildMaterialFilename = (materialId: number) => {
  const mat = contentBlockMaterialMap.value[materialId]
  let name = mat?.originalName || mat?.title || 'download'
  if (!name || name === 'download') return 'download'
  const hasExt = /\.\w+$/.test(name)
  if (!hasExt && mat?.fileType) {
    const ext = mat.fileType.startsWith('.') ? mat.fileType : '.' + mat.fileType
    name = name + ext
  }
  return name
}

const handleFileDownload = async (blockId: number, materialId: number) => {
  fileDownloading.value = materialId
  try {
    const { blob, filename } = await downloadMaterialWithFilename(materialId)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = (filename && filename !== 'download') ? filename : buildMaterialFilename(materialId)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    reportBlockProgressData(blockId, 'file', { downloaded: 1 }, true)
  } catch (e: any) {
    alert('下载失败：' + (e.message || '未知错误'))
  } finally {
    fileDownloading.value = null
  }
}

// 进度刷新节流：避免频繁刷新总进度
const progressRefreshTimer = ref<NodeJS.Timeout | null>(null)

// 仅在当前页面处于活动状态时上报（防止切到其它页面或标签后仍然频繁请求）
const isPageVisible = ref(true)
const handleVisibilityChange = () => {
  isPageVisible.value = !document.hidden
}
const reportBlockProgressData = async (blockId: number, blockType: string, data: Partial<TrainingContentBlockProgress>, shouldRefreshProgress: boolean = true) => {
  // 只有在当前培训详情页处于前台、且存在有效用户信息时才上报
  if (!trainingId.value || !studentId.value || !isPageVisible.value || document.hidden) return
  try {
    await reportBlockProgress({
      trainingId: trainingId.value,
      blockId,
      studentId: studentId.value,
      blockType,
      ...data
    } as TrainingContentBlockProgress)
    
    // 只在需要时刷新总进度，并使用节流避免频繁刷新
    if (shouldRefreshProgress) {
      if (progressRefreshTimer.value) {
        clearTimeout(progressRefreshTimer.value)
      }
      progressRefreshTimer.value = setTimeout(async () => {
        try {
          const p = await getTrainingProgress(trainingId.value, studentId.value)
          progress.value = p.data || null
        } catch {
          // 刷新失败不阻塞 UI
        }
        progressRefreshTimer.value = null
      }, 1000) // 1秒内只刷新一次
    }
  } catch {
    // 上报失败不阻塞 UI
  }
}

onMounted(() => {
  isPageVisible.value = !document.hidden
  document.addEventListener('visibilitychange', handleVisibilityChange)
  load()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  // 清理所有定时器
  Object.values(textBlockTimers.value).forEach(timer => clearInterval(timer))
  Object.values(pdfScrollCheckTimers.value).forEach(timer => clearInterval(timer))
  Object.values(pdfViewTimers.value).forEach(timer => clearTimeout(timer))
  Object.values(videoProgressThrottle.value).forEach(timer => clearTimeout(timer))
  if (progressRefreshTimer.value) {
    clearTimeout(progressRefreshTimer.value)
  }
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
.page-title { font-size: 24px; font-weight: 600; color: var(--text-primary); margin: 0; }
.sub { margin-top: 6px; color: var(--text-secondary); font-size: 13px; }
.header-actions { display: flex; gap: 10px; align-items: center; }
.btn-primary { padding: 10px 18px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; border: 1px solid var(--border-color); color: var(--text-secondary); background: #fff; }
.badge.ok { border-color: rgba(103, 194, 58, 0.35); background: rgba(103, 194, 58, 0.1); color: #3f9c1f; }
.badge.muted { background: #f5f7fa; }
.card { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 16px; margin-bottom: 16px; }
.progress-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.progress-text { color: var(--text-regular); font-size: 14px; }
.bar { flex: 1; height: 10px; background: #eef2f7; border-radius: 999px; overflow: hidden; }
.bar-inner { height: 100%; background: var(--primary-color); }
.section-title { font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.section-actions { display: flex; gap: 8px; align-items: center; }
.btn-editor { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--primary-color); color: var(--primary-color); background: white; font-size: 12px; cursor: pointer; text-decoration: none; }
.btn-editor:hover { background: #ecf5ff; }
.btn-config { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-color); background: white; font-size: 12px; cursor: pointer; }
.table .tr { display: grid; grid-template-columns: 1fr 1fr 1fr 1.4fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border-color); align-items: center; }
.table .tr.th { color: var(--text-secondary); font-size: 12px; font-weight: 600; padding-top: 0; }
.actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn { padding: 6px 10px; border: 1px solid var(--border-color); background: white; border-radius: 6px; cursor: pointer; font-size: 12px; }
.hint { margin-top: 10px; color: var(--text-secondary); font-size: 12px; }

.dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.dialog { background: white; border-radius: 8px; width: 92%; max-width: 960px; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
.dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--border-color); }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
.dialog-body { padding: 16px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px; border-top: 1px solid var(--border-color); }
.btn-cancel { padding: 10px 20px; border: 1px solid var(--border-color); background: white; border-radius: 6px; cursor: pointer; }
.btn-open-new { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border-color); margin-right: auto; text-decoration: none; font-size: 14px; color: var(--primary-color); }

.preview-container { width: 100%; height: 70vh; background: #f7f9fc; display: flex; align-items: center; justify-content: center; }
.preview-iframe, .preview-image, .preview-video { width: 100%; height: 100%; border: none; object-fit: contain; }
.fallback { color: var(--text-secondary); font-size: 14px; }

.config-dialog { max-width: 900px; }
.config-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.checkbox-col { display: flex; align-items: center; justify-content: center; }
.form-input { padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 14px; }
.btn { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-color); background: white; cursor: pointer; font-size: 12px; }

.whiteboard-view { display: flex; flex-direction: column; gap: 16px; }
.wb-block { background: #f8fafc; border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden; }
.wb-block-label { padding: 6px 12px; font-size: 12px; font-weight: 600; color: var(--text-secondary); background: #eef2f7; }
.wb-block-body { padding: 12px 16px; }
.wb-text { font-size: 14px; line-height: 1.6; color: var(--text-primary); white-space: pre-wrap; word-break: break-word; max-height: 400px; overflow-y: auto; padding: 8px; }
.wb-preview-img { max-width: 100%; max-height: 280px; border-radius: 6px; cursor: pointer; border: 1px solid var(--border-color); }
.wb-meta { margin-top: 8px; font-size: 13px; color: var(--text-secondary); }
.wb-file-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.wb-file-name { flex: 1; min-width: 0; font-size: 14px; color: var(--text-primary); margin-bottom: 8px; }
.wb-video-container, .wb-pdf-container { display: flex; flex-direction: column; gap: 8px; }
/* 视频区域高度 2 倍，多出部分为空白 */
.wb-video { width: 100%; max-height: 1040px; min-height: 640px; border-radius: 6px; border: 1px solid var(--border-color); object-fit: contain; }
.wb-pdf-iframe { width: 100%; height: 600px; border-radius: 6px; border: 1px solid var(--border-color); }

/* ===== 手机端专属优化：培训详情 ===== */
@media (max-width: 768px) {
  .page-header { gap: 10px; }
  .page-title { font-size: 18px; }
  .sub { font-size: 12px; }

  .header-actions { width: 100%; justify-content: space-between; }
  .btn-primary { padding: 10px 14px; font-size: 14px; border-radius: 10px; }
  .badge { font-size: 12px; }

  .progress-row { flex-direction: column; align-items: stretch; gap: 10px; }
  .bar { height: 12px; }

  .section-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .section-actions { width: 100%; flex-wrap: wrap; }
  .btn-editor, .btn-config { width: 100%; text-align: center; padding: 10px 12px; border-radius: 10px; }

  .whiteboard-view { gap: 12px; }
  .wb-block-body { padding: 12px; }

  /* 文字块：更适合手机阅读 */
  .wb-text { max-height: 55vh; padding: 10px; font-size: 14px; }

  /* 图片：点击区域更大 */
  .wb-preview-img { max-height: 220px; }

  /* 视频：高度 2 倍，多出部分空白 */
  .wb-video { max-height: 640px; min-height: 400px; }

  /* PDF：手机上不要 600px，改为视口高度 */
  .wb-pdf-iframe { height: 70vh; }

  /* 文件行：按钮占满一行更好点 */
  .wb-file-row { flex-direction: column; align-items: stretch; }
  .wb-file-name { margin-bottom: 0; }
  .wb-file-row .btn { width: 100%; padding: 10px 12px; border-radius: 10px; font-size: 14px; }
}
</style>

