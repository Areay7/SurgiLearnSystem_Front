<template>
  <div class="whiteboard-page">
    <div class="whiteboard-header">
      <div class="header-left">
        <router-link :to="`/training/${trainingId}`" class="back-link">← 返回培训详情</router-link>
        <h1 class="page-title">{{ training?.trainingName || '编辑培训资料' }}</h1>
        <span class="subtitle">白板式编辑，从上往下自由添加资料块</span>
      </div>
      <div class="header-actions">
        <button class="btn-save" @click="saveBlocks" :disabled="saving || loading">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <div class="toolbar-strip">
      <span class="toolbar-label">添加：</span>
      <button class="tool-btn" @click="addBlock('text')">📝 文字</button>
      <button class="tool-btn" @click="addBlock('image')">🖼️ 图片</button>
      <button class="tool-btn" @click="addBlock('video')">🎬 视频</button>
      <button class="tool-btn" @click="addBlock('pdf')">📄 PDF</button>
      <button class="tool-btn" @click="addBlock('file')">📎 文件(下载)</button>
    </div>

    <div class="whiteboard-body" v-if="!loading">
      <div class="blocks-list">
        <div
          v-for="(block, index) in blocks"
          :key="block._localId ?? block.id"
          class="block-card"
          :class="`block-${block.blockType}`"
        >
          <div class="block-header">
            <span class="block-type-tag">{{ typeLabel(block.blockType) }}</span>
            <div class="block-actions">
              <button type="button" class="icon-btn" @click="moveBlock(index, -1)" :disabled="index === 0" title="上移">↑</button>
              <button type="button" class="icon-btn" @click="moveBlock(index, 1)" :disabled="index === blocks.length - 1" title="下移">↓</button>
              <button type="button" class="icon-btn danger" @click="removeBlock(index)" title="删除">×</button>
            </div>
          </div>
          <div class="block-body">
            <!-- 文字块 -->
            <template v-if="block.blockType === 'text'">
              <textarea
                v-model="block.content"
                class="text-input"
                placeholder="输入文字内容..."
                rows="4"
              ></textarea>
            </template>
            <!-- 图片/视频/PDF/文件：显示已选资料或选择按钮 -->
            <template v-else>
              <div v-if="block.materialId && materialMap[block.materialId]" class="file-preview">
                <template v-if="block.blockType === 'image'">
                  <img
                    :src="previewUrlFor(block.materialId)"
                    class="preview-img"
                    alt="预览"
                  />
                  <div class="file-meta">{{ materialMap[block.materialId].title || materialMap[block.materialId].originalName }}</div>
                </template>
                <template v-else>
                  <div class="file-placeholder" :class="block.blockType">
                    <span class="file-icon">{{ block.blockType === 'video' ? '🎬' : block.blockType === 'pdf' ? '📄' : '📎' }}</span>
                    <span class="file-name">{{ materialMap[block.materialId].title || materialMap[block.materialId].originalName }}</span>
                    <span class="file-hint">
                      {{ block.blockType === 'file' ? '供下载' : '可在线预览' }}
                    </span>
                  </div>
                </template>
                <button type="button" class="btn-change" @click="openPickMaterial(block, index)">更换</button>
              </div>
              <div v-else class="file-empty">
                <button type="button" class="btn-pick" @click="openPickMaterial(block, index)">
                  {{ block.blockType === 'image' ? '选择或上传图片' : block.blockType === 'video' ? '选择或上传视频' : block.blockType === 'pdf' ? '选择或上传 PDF' : '选择或上传文件' }}
                </button>
              </div>
            </template>
          </div>
        </div>
        <div v-if="blocks.length === 0" class="empty-hint">
          <p>点击上方「添加」按钮，从文字、图片、视频、PDF、文件中选择，自上而下排列成培训资料白板。</p>
        </div>
      </div>
    </div>
    <div v-else class="loading-state">加载中...</div>

    <!-- 选择/上传资料弹窗 -->
    <div v-if="showPickDialog" class="dialog-overlay" @click="closePickDialog">
      <div class="dialog pick-dialog" @click.stop>
        <div class="dialog-header">
          <h3>选择资料</h3>
          <button class="close-btn" @click="closePickDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="pick-toolbar">
            <input
              class="form-input"
              v-model="materialSearch"
              placeholder="搜索标题..."
              @keyup.enter="loadMaterialOptions"
            />
            <button class="btn" @click="loadMaterialOptions" :disabled="loadingMaterials">搜索</button>
            <span class="divider">或</span>
            <label class="upload-label">
              <input type="file" ref="uploadInput" @change="onUploadFile" accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.doc,.docx,.ppt,.pptx,.xls,.xlsx" />
              上传新文件
            </label>
          </div>
          <div class="material-list">
            <div
              v-for="m in filteredMaterialOptions"
              :key="m.id"
              class="material-row"
              :class="{ selected: pickTargetMaterialId === m.id }"
              @click="selectMaterial(m)"
            >
              <span class="mat-title">{{ m.title || m.originalName || '-' }}</span>
              <span class="mat-type">{{ m.fileType || '-' }}</span>
              <span class="mat-size">{{ formatSize(m.fileSize) }}</span>
            </div>
            <div v-if="filteredMaterialOptions.length === 0" class="empty-row">暂无可选资料，请先上传</div>
          </div>
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
import { getTrainingDetail } from '@/api/training'
import type { Training } from '@/api/training'
import { getTrainingContentBlocks, saveTrainingContentBlocks } from '@/api/trainingAdmin'
import type { TrainingContentBlock } from '@/api/trainingAdmin'
import { getMaterialsList, uploadMaterial } from '@/api/materials'
import type { LearningMaterial } from '@/api/materials'

const route = useRoute()
const authStore = useAuthStore()
const trainingId = computed(() => Number(route.params.id))

const training = ref<Training | null>(null)
const blocks = ref<(TrainingContentBlock & { _localId?: string })[]>([])
const loading = ref(true)
const saving = ref(false)

let localIdSeq = 0
function nextLocalId() {
  return `local_${++localIdSeq}`
}

const typeLabel = (t: string) => {
  const map: Record<string, string> = { text: '文字', image: '图片', video: '视频', pdf: 'PDF', file: '文件(下载)' }
  return map[t] || t
}

const materialMap = ref<Record<number, LearningMaterial>>({})
function refreshMaterialMap() {
  const ids = new Set<number>()
  blocks.value.forEach(b => {
    if (b.materialId) ids.add(b.materialId)
  })
  if (ids.size === 0) {
    materialMap.value = {}
    return
  }
  getMaterialsList({ page: 1, limit: 500, status: '已发布' }).then(res => {
    const list: LearningMaterial[] = res.data || []
    const m: Record<number, LearningMaterial> = {}
    list.forEach(mat => {
      if (mat.id && ids.has(mat.id)) m[mat.id] = mat
    })
    materialMap.value = m
  }).catch(() => { materialMap.value = {} })
}

function previewUrlFor(materialId: number) {
  // 编辑页里也使用稳定 URL，避免频繁重渲染导致资源反复刷新
  return `${API_BASE_URL}/LearningMaterialController/preview/${materialId}`
}

const addBlock = (blockType: TrainingContentBlock['blockType']) => {
  const maxOrder = blocks.value.length === 0 ? 0 : Math.max(...blocks.value.map(b => b.sortOrder ?? 0))
  blocks.value.push({
    _localId: nextLocalId(),
    blockType,
    sortOrder: maxOrder + 1,
    content: blockType === 'text' ? '' : undefined,
    materialId: blockType !== 'text' ? undefined : undefined
  } as TrainingContentBlock & { _localId?: string })
}

const removeBlock = (index: number) => {
  blocks.value.splice(index, 1)
  reindexSortOrder()
}

const moveBlock = (index: number, delta: number) => {
  const to = index + delta
  if (to < 0 || to >= blocks.value.length) return
  const arr = blocks.value
  ;[arr[index], arr[to]] = [arr[to], arr[index]]
  reindexSortOrder()
}

function reindexSortOrder() {
  blocks.value.forEach((b, i) => { b.sortOrder = i })
}

const load = async () => {
  if (!trainingId.value) return
  loading.value = true
  try {
    const [d, bl] = await Promise.all([
      getTrainingDetail(trainingId.value),
      getTrainingContentBlocks(trainingId.value)
    ])
    training.value = d.data || null
    const list = (bl.data || []) as (TrainingContentBlock & { _localId?: string })[]
    blocks.value = list.map((b, i) => ({ ...b, sortOrder: b.sortOrder ?? i }))
    refreshMaterialMap()
  } catch (e: any) {
    alert(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const saveBlocks = async () => {
  if (!trainingId.value) return
  saving.value = true
  try {
    const payload = blocks.value.map(({ _localId, ...b }) => ({
      blockType: b.blockType,
      sortOrder: b.sortOrder ?? 0,
      content: b.blockType === 'text' ? (b.content || '') : undefined,
      materialId: b.blockType !== 'text' ? b.materialId : undefined
    }))
    const res = await saveTrainingContentBlocks(trainingId.value, payload)
    if (res.code === 0 || res.code === 200) {
      alert('保存成功')
      await load()
    } else {
      alert(res.msg || '保存失败')
    }
  } catch (e: any) {
    alert(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 选择资料弹窗
const showPickDialog = ref(false)
const pickTargetBlock = ref<(TrainingContentBlock & { _localId?: string }) | null>(null)
const pickTargetIndex = ref(-1)
const materialSearch = ref('')
const materialOptions = ref<LearningMaterial[]>([])
const loadingMaterials = ref(false)
const pickTargetMaterialId = ref<number | null>(null)
const uploadInput = ref<HTMLInputElement | null>(null)

const filteredMaterialOptions = computed(() => {
  const type = pickTargetBlock.value?.blockType
  const list = materialOptions.value
  if (!type || type === 'text') return list
  const extMap: Record<string, string[]> = {
    image: ['.jpg', '.jpeg', '.png', '.gif'],
    video: ['.mp4'],
    pdf: ['.pdf'],
    file: ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.mp3', '.wav']
  }
  const allow = extMap[type] || []
  if (allow.length === 0) return list
  return list.filter(m => {
    const ext = (m.fileType || '').toLowerCase()
    const e = ext.startsWith('.') ? ext : '.' + ext
    return allow.some(a => e === a.toLowerCase())
  })
})

function openPickMaterial(block: TrainingContentBlock & { _localId?: string }, index: number) {
  pickTargetBlock.value = block
  pickTargetIndex.value = index
  pickTargetMaterialId.value = block.materialId ?? null
  materialSearch.value = ''
  loadMaterialOptions()
  showPickDialog.value = true
}

function closePickDialog() {
  showPickDialog.value = false
  pickTargetBlock.value = null
  pickTargetIndex.value = -1
  pickTargetMaterialId.value = null
}

async function loadMaterialOptions() {
  loadingMaterials.value = true
  try {
    const res = await getMaterialsList({
      page: 1,
      limit: 200,
      searchText: materialSearch.value || undefined,
      status: '已发布'
    })
    materialOptions.value = res.data || []
  } finally {
    loadingMaterials.value = false
  }
}

function selectMaterial(m: LearningMaterial) {
  if (!pickTargetBlock.value || !m.id) return
  pickTargetBlock.value.materialId = m.id
  pickTargetMaterialId.value = m.id
  refreshMaterialMap()
  closePickDialog()
}

async function onUploadFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !pickTargetBlock.value) return
  const fd = new FormData()
  fd.append('file', file)
  fd.append('title', file.name)
  fd.append('status', '已发布')
  fd.append('uploaderId', authStore.userPhone || '')
  fd.append('uploaderName', authStore.nickname || authStore.userPhone || '')
  try {
    const res = await uploadMaterial(fd)
    if ((res.code === 0 || res.code === 200) && res.data) {
      pickTargetBlock.value.materialId = (res.data as LearningMaterial).id!
      refreshMaterialMap()
      closePickDialog()
      await loadMaterialOptions()
    } else {
      alert(res.msg || '上传失败')
    }
  } catch (err: any) {
    alert(err.message || '上传失败')
  }
  ;(e.target as HTMLInputElement).value = ''
}

function formatSize(bytes?: number) {
  if (!bytes || bytes <= 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${units[i]}`
}

onMounted(load)
</script>

<style scoped>
.whiteboard-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 16px 24px 48px;
}

.whiteboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.header-left {
  flex: 1;
  min-width: 0;
}

.back-link {
  display: inline-block;
  color: var(--primary-color);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 6px;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

.header-actions {
  flex-shrink: 0;
}

.btn-save {
  padding: 10px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-save:hover:not(:disabled) {
  filter: brightness(1.05);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toolbar-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.toolbar-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.tool-btn {
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.tool-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.whiteboard-body {
  max-width: 900px;
  margin: 0 auto;
}

.blocks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.block-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.06);
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border-color);
}

.block-type-tag {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.block-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}

.icon-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.icon-btn.danger:hover:not(:disabled) {
  border-color: #f56c6c;
  color: #f56c6c;
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.block-body {
  padding: 14px;
}

.text-input {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.preview-img {
  max-width: 200px;
  max-height: 120px;
  object-fit: contain;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.file-meta, .file-name {
  font-size: 14px;
  color: var(--text-primary);
}

.file-placeholder {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f0f4f8;
  border-radius: 8px;
}

.file-placeholder .file-icon {
  font-size: 20px;
}

.file-placeholder .file-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.btn-change, .btn-pick {
  padding: 8px 14px;
  border: 1px solid var(--primary-color);
  background: white;
  color: var(--primary-color);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.btn-change:hover, .btn-pick:hover {
  background: var(--primary-color);
  color: white;
}

.file-empty {
  padding: 12px 0;
}

.empty-hint {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-secondary);
  font-size: 14px;
  background: white;
  border-radius: 10px;
  border: 1px dashed var(--border-color);
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 10px;
  width: 92%;
  max-width: 560px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

.pick-dialog .dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
}

.pick-dialog .dialog-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--text-secondary);
}

.dialog-body {
  padding: 16px;
  overflow-y: auto;
  max-height: 60vh;
}

.pick-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.pick-toolbar .form-input {
  flex: 1;
  min-width: 140px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
}

.pick-toolbar .divider {
  font-size: 12px;
  color: var(--text-secondary);
}

.upload-label {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.upload-label input {
  display: none;
}

.material-list {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.material-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  font-size: 13px;
}

.material-row:last-child {
  border-bottom: none;
}

.material-row:hover, .material-row.selected {
  background: #ecf5ff;
}

.mat-title {
  color: var(--text-primary);
}

.mat-type, .mat-size {
  color: var(--text-secondary);
}

.empty-row {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.btn {
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

/* ===== 手机端优化：白板编辑 ===== */
@media (max-width: 768px) {
  .whiteboard-page {
    padding: 12px 12px 32px;
  }

  /* 顶部固定，保存随手可点 */
  .whiteboard-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: linear-gradient(180deg, #f8fafc 0%, rgba(248,250,252,0.92) 100%);
    padding-bottom: 10px;
    margin-bottom: 10px;
    backdrop-filter: blur(8px);
  }

  .page-title { font-size: 18px; }
  .subtitle { font-size: 12px; }
  .btn-save { width: 100%; padding: 12px 14px; border-radius: 10px; }

  /* 工具栏改成横向滚动，避免换行挤压 */
  .toolbar-strip {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 8px;
  }
  .toolbar-strip::-webkit-scrollbar { display: none; }
  .tool-btn {
    flex: 0 0 auto;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 13px;
  }

  .blocks-list { gap: 12px; }
  .block-body { padding: 12px; }

  /* 块操作按钮更好点 */
  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    font-size: 16px;
  }

  .text-input {
    min-height: 140px;
    border-radius: 10px;
    font-size: 14px;
  }

  .file-preview { flex-direction: column; align-items: stretch; }
  .preview-img { max-width: 100%; max-height: 220px; }
  .btn-change, .btn-pick { width: 100%; padding: 12px; border-radius: 10px; font-size: 14px; }

  /* 选资料弹窗全屏抽屉 */
  .dialog-overlay { align-items: flex-end; }
  .dialog {
    width: 100%;
    max-width: 100%;
    max-height: 92vh;
    border-radius: 14px 14px 0 0;
  }
  .dialog-body { max-height: calc(92vh - 120px); }

  .pick-toolbar .form-input { width: 100%; min-width: 0; }
  .pick-toolbar .btn { width: 100%; padding: 10px 12px; border-radius: 10px; }
  .upload-label { width: 100%; text-align: center; padding: 10px 12px; border-radius: 10px; }

  .material-row {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 12px 12px;
  }
  .mat-type, .mat-size { font-size: 12px; }
}
</style>
