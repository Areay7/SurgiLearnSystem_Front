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
        <button class="btn-primary" @click="handleStart" :disabled="starting">
          {{ starting ? '初始化中...' : '开始学习' }}
        </button>
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
              <div class="wb-text" v-html="textToHtml(block.content)"></div>
            </template>
            <template v-else-if="block.materialId && contentBlockMaterialMap[block.materialId]">
              <template v-if="block.blockType === 'image'">
                <img
                  :src="previewUrlFor(block.materialId)"
                  class="wb-preview-img"
                  alt="预览"
                  @click="openPreview(block.materialId!, 'image')"
                />
                <div class="wb-meta">{{ contentBlockMaterialMap[block.materialId].title || contentBlockMaterialMap[block.materialId].originalName }}</div>
              </template>
              <template v-else>
                <div class="wb-file-row">
                  <span class="wb-file-name">{{ contentBlockMaterialMap[block.materialId].title || contentBlockMaterialMap[block.materialId].originalName }}</span>
                  <template v-if="block.blockType === 'file'">
                    <a :href="downloadUrlFor(block.materialId)" target="_blank" class="btn" @click="report(block.materialId!, 100, 1, 0)">下载</a>
                  </template>
                  <template v-else>
                    <button class="btn" @click="openPreview(block.materialId!, block.blockType === 'pdf' ? 'pdf' : block.blockType === 'video' ? 'video' : 'other')">预览</button>
                  </template>
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
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { API_BASE_URL } from '@/config/api'
import { useAuthStore } from '@/stores/auth'
import { getTrainingDetail, getTrainingMaterials, getTrainingMaterialProgressList, getTrainingProgress, reportTrainingMaterialProgress, startTraining } from '@/api/training'
import type { Training, TrainingMaterial, TrainingProgress } from '@/api/training'
import { getMaterialsList, type LearningMaterial } from '@/api/materials'
import { setTrainingMaterials, getTrainingContentBlocks } from '@/api/trainingAdmin'
import type { TrainingContentBlock } from '@/api/trainingAdmin'

const route = useRoute()
const authStore = useAuthStore()

const trainingId = computed(() => Number(route.params.id))
const studentId = computed(() => Number(authStore.userPhone || '0'))
const studentName = computed(() => authStore.nickname || authStore.userPhone || '')
const isAdmin = computed(() => (authStore.userType || 0) === 1)

const training = ref<Training | null>(null)
const materials = ref<TrainingMaterial[]>([])
const contentBlocks = ref<(TrainingContentBlock & { id?: number })[]>([])
const contentBlockMaterialMap = ref<Record<number, LearningMaterial>>({})
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

const load = async () => {
  const id = trainingId.value
  if (!id) return
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
  if (materialIds.size > 0) {
    const listRes = await getMaterialsList({ page: 1, limit: 500, status: '已发布' })
    const list: LearningMaterial[] = listRes.data || []
    const map: Record<number, LearningMaterial> = {}
    list.forEach(mat => { if (mat.id && materialIds.has(mat.id)) map[mat.id] = mat })
    contentBlockMaterialMap.value = map
  } else {
    contentBlockMaterialMap.value = {}
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
    alert('无法获取当前用户信息（studentId）')
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
const previewUrlFor = (materialId: number) =>
  `${API_BASE_URL}/LearningMaterialController/preview/${materialId}?t=${Date.now()}`
const downloadUrlFor = (materialId: number) =>
  `${API_BASE_URL}/LearningMaterialController/download/${materialId}`

const guessTypeByExt = (ext?: string) => {
  const lower = (ext || '').toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (['.jpg', '.jpeg', '.png', '.gif'].some(e => lower.endsWith(e))) return 'image'
  if (lower.endsWith('.mp4')) return 'video'
  return 'other'
}

const openPreview = async (materialId: number, suggestedType?: 'pdf' | 'image' | 'video' | 'other') => {
  const url = `${API_BASE_URL}/LearningMaterialController/preview/${materialId}?t=${Date.now()}`
  previewUrl.value = url
  previewType.value = suggestedType ?? 'other'
  showPreview.value = true
  await report(materialId, 1, 0, 0)
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

onMounted(load)
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
.wb-text { font-size: 14px; line-height: 1.6; color: var(--text-primary); white-space: pre-wrap; word-break: break-word; }
.wb-preview-img { max-width: 100%; max-height: 280px; border-radius: 6px; cursor: pointer; border: 1px solid var(--border-color); }
.wb-meta { margin-top: 8px; font-size: 13px; color: var(--text-secondary); }
.wb-file-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.wb-file-name { flex: 1; min-width: 0; font-size: 14px; color: var(--text-primary); }
</style>

