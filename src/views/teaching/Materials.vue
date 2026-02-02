<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">学习资料管理</h1>
      <div class="header-actions">
        <button class="btn-primary" @click="openAddDialog">上传资料</button>
        <button class="btn-action" @click="handleDeleteSelected" v-if="selectedIds.length > 0">删除选中</button>
      </div>
    </div>

    <div class="toolbar">
      <input
        class="search-input"
        placeholder="搜索标题/描述..."
        v-model="searchForm.searchText"
        @keyup.enter="handleSearch"
      />
      <select class="select" v-model="searchForm.category">
        <option value="">全部分类</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <select class="select" v-model="searchForm.status">
        <option value="">全部状态</option>
        <option value="已发布">已发布</option>
        <option value="草稿">草稿</option>
      </select>
      <input
        class="search-input tags-input"
        placeholder="标签(逗号分隔)"
        v-model="searchForm.tags"
        @keyup.enter="handleSearch"
      />
      <button class="btn-query" @click="handleSearch" :disabled="loading">查询</button>
      <button class="btn-reset" @click="handleReset" :disabled="loading">重置</button>
    </div>

    <div class="card table-card" v-if="!loading">
      <div class="table">
        <div class="tr th">
          <div class="td checkbox-col">
            <input
              type="checkbox"
              @change="handleSelectAll"
              :checked="selectedIds.length === materials.length && materials.length > 0"
            />
          </div>
          <div class="td name">资料名称</div>
          <div class="td">分类</div>
          <div class="td">标签</div>
          <div class="td">文件</div>
          <div class="td">上传人</div>
          <div class="td">更新时间</div>
          <div class="td">状态</div>
          <div class="td actions">操作</div>
        </div>
        <div class="tr" v-for="item in materials" :key="item.id">
          <div class="td checkbox-col">
            <input type="checkbox" :value="item.id" v-model="selectedIds" />
          </div>
          <div class="td name">
            <div class="title">{{ item.title || '-' }}</div>
            <div class="sub desc">{{ item.description || '—' }}</div>
          </div>
          <div class="td">{{ item.category || '-' }}</div>
          <div class="td">{{ formatTags(item.tags) }}</div>
          <div class="td file-col">
            <div class="file-name">{{ item.originalName || '未记录' }}</div>
            <div class="file-meta">
              <span>{{ item.fileType || '-' }}</span>
              <span>{{ formatSize(item.fileSize) }}</span>
            </div>
          </div>
          <div class="td">{{ item.uploaderName || item.uploaderId || '-' }}</div>
          <div class="td">{{ formatDateTime(item.updateTime) }}</div>
          <div class="td">
            <span class="badge" :class="item.status === '已发布' ? 'ok' : 'muted'">{{ item.status || '已发布' }}</span>
          </div>
          <div class="td actions">
            <button class="btn" @click="preview(item)">预览</button>
            <button class="btn" @click="download(item)">下载</button>
            <button class="btn" @click="openEditDialog(item)">编辑</button>
            <button class="btn danger" @click="handleDeleteSingle(item)">删除</button>
          </div>
        </div>
        <div class="tr empty-row" v-if="materials.length === 0">
          <div class="td" style="grid-column: 1 / -1; text-align: center; padding: 24px;">暂无数据</div>
        </div>
      </div>
    </div>
    <div v-else class="loading-state">加载中...</div>

    <div class="pagination">
      <button class="page-btn" @click="prevPage" :disabled="currentPage === 1 || loading">上一页</button>
      <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页（共 {{ total }} 条）</span>
      <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages || loading">下一页</button>
    </div>
  </div>

  <!-- 预览弹窗 -->
  <div v-if="showPreviewDialog" class="dialog-overlay" @click="closePreviewDialog">
    <div class="dialog preview-dialog" @click.stop>
      <div class="dialog-header">
        <h3>{{ previewTitle }}</h3>
        <button class="close-btn" @click="closePreviewDialog">×</button>
      </div>
      <div class="dialog-body">
        <div v-if="previewType === 'image'" class="preview-container">
          <img :src="previewUrl" alt="预览图片" class="preview-image" @error="handlePreviewError" />
        </div>
        <div v-else-if="previewType === 'video'" class="preview-container">
          <video controls class="preview-video" preload="metadata" @error="handlePreviewError">
            <source :src="previewUrl" type="video/mp4" />
            您的浏览器不支持视频预览，请点击下方链接在新窗口中打开。
          </video>
        </div>
        <div v-else-if="previewType === 'pdf'" class="preview-container">
          <iframe :src="previewUrl" class="preview-iframe" type="application/pdf" @load="handleIframeLoad" @error="handlePreviewError"></iframe>
        </div>
        <div v-else class="preview-container">
          <p>该文件类型暂不支持在线预览，请下载后查看。</p>
        </div>
      </div>
      <div class="dialog-footer">
        <a v-if="previewUrl" :href="previewUrl" target="_blank" class="btn-open-new">在新窗口中打开</a>
        <button class="btn-cancel" @click="closePreviewDialog">关闭</button>
      </div>
    </div>
  </div>

  <!-- 新增/编辑弹窗 -->
  <div v-if="showDialog" class="dialog-overlay" @click="showDialog = false">
    <div class="dialog edit-dialog" @click.stop>
      <div class="dialog-header">
        <h3>{{ dialogMode === 'add' ? '上传资料' : '编辑资料' }}</h3>
        <button class="close-btn" @click="showDialog = false">×</button>
      </div>
      <div class="dialog-body">
        <div class="edit-form">
          <div class="form-group">
            <label>标题 *</label>
            <input class="form-input" v-model="form.title" :disabled="saving" maxlength="200" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea class="form-input" v-model="form.description" :disabled="saving" rows="3" maxlength="1000"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>分类</label>
              <select class="form-input" v-model="form.category" :disabled="saving">
                <option value="">请选择</option>
                <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>标签(逗号分隔)</label>
              <input class="form-input" v-model="form.tags" :disabled="saving" placeholder="示例：培训,护理" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>状态</label>
              <select class="form-input" v-model="form.status" :disabled="saving">
                <option value="已发布">已发布</option>
                <option value="草稿">草稿</option>
              </select>
            </div>
            <div class="form-group">
              <label>文件</label>
              <div class="file-line">
                <input class="form-input" :value="form.originalName || '未选择文件'" disabled />
                <button class="btn-small" @click="triggerFile" :disabled="saving || dialogMode==='edit'">选择文件</button>
              </div>
              <div class="form-hint">支持：pdf/doc/docx/ppt/pptx/xls/xlsx/jpg/jpeg/png/gif/mp4/mp3/wav，最大50MB</div>
            </div>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn-cancel" @click="showDialog = false" :disabled="saving">取消</button>
        <button class="btn-confirm" @click="handleSave" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
      </div>
    </div>
  </div>

  <input ref="fileInputRef" type="file" class="hidden-file-input" @change="onFileChange" />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { API_BASE_URL } from '@/config/api'
import type { LearningMaterial } from '@/api/materials'
import {
  deleteMaterial,
  getMaterialPreviewUrl,
  getPreviewBlob,
  getMaterialsList,
  uploadMaterial,
  updateMaterial,
  incrementView,
  incrementDownload
} from '@/api/materials'

const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const materials = ref<LearningMaterial[]>([])
const selectedIds = ref<number[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const categories = ['培训课件', '指南规范', '操作流程', '病例资料', '其他']

const searchForm = reactive({
  searchText: '',
  category: '',
  tags: '',
  status: ''
})

const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const form = reactive<LearningMaterial>({
  title: '',
  description: '',
  category: '',
  tags: '',
  status: '已发布',
  originalName: '',
  fileType: '',
  fileSize: 0
})

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadFile = ref<File | null>(null)

const showPreviewDialog = ref(false)
const previewUrl = ref('')
const previewType = ref<'image' | 'video' | 'pdf' | 'other'>('other')
const previewTitle = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const loadData = async () => {
  loading.value = true
  try {
    const res = await getMaterialsList({
      page: currentPage.value,
      limit: pageSize.value,
      searchText: searchForm.searchText || undefined,
      category: searchForm.category || undefined,
      tags: searchForm.tags || undefined,
      status: searchForm.status || undefined
    })
    if (res.code === 0 || res.code === 200) {
      materials.value = res.data || []
      total.value = res.count || 0
    } else {
      alert(res.msg || '加载失败')
    }
  } catch (e: any) {
    alert(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handleReset = () => {
  searchForm.searchText = ''
  searchForm.category = ''
  searchForm.tags = ''
  searchForm.status = ''
  currentPage.value = 1
  loadData()
}

const handleSelectAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  selectedIds.value = checked ? materials.value.map(m => m.id!).filter(Boolean) : []
}

const openAddDialog = () => {
  dialogMode.value = 'add'
  Object.assign(form, {
    id: undefined,
    title: '',
    description: '',
    category: '',
    tags: '',
    status: '已发布',
    originalName: '',
    fileType: '',
    fileSize: 0
  })
  uploadFile.value = null
  showDialog.value = true
}

const openEditDialog = (row: LearningMaterial) => {
  dialogMode.value = 'edit'
  Object.assign(form, { ...row })
  uploadFile.value = null
  showDialog.value = true
}

const triggerFile = () => {
  fileInputRef.value?.click()
}

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const allowed = [
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
    '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mp3', '.wav'
  ]
  const lower = file.name.toLowerCase()
  if (!allowed.some(ext => lower.endsWith(ext))) {
    alert('不支持的文件类型')
    return
  }
  // 文件大小限制以服务端配置为准，这里不强制拦截
  uploadFile.value = file
  form.originalName = file.name
  form.fileType = lower.substring(lower.lastIndexOf('.'))
  form.fileSize = file.size
}

const handleSave = async () => {
  if (!form.title?.trim()) {
    alert('请输入标题')
    return
  }
  if (dialogMode.value === 'add' && !uploadFile.value) {
    alert('请先选择文件')
    return
  }

  saving.value = true
  try {
    if (dialogMode.value === 'add') {
      const fd = new FormData()
      fd.append('file', uploadFile.value as File)
      fd.append('title', form.title || '')
      fd.append('description', form.description || '')
      fd.append('category', form.category || '')
      fd.append('tags', form.tags || '')
      fd.append('status', form.status || '已发布')
      fd.append('uploaderId', authStore.userPhone || '')
      fd.append('uploaderName', authStore.nickname || authStore.userPhone || '')
      const res = await uploadMaterial(fd)
      if (res.code === 0 || res.code === 200) {
        alert('上传成功')
        showDialog.value = false
        loadData()
      } else {
        alert(res.msg || '上传失败')
      }
    } else {
      const res = await updateMaterial(form)
      if (res.code === 0 || res.code === 200) {
        alert('保存成功')
        showDialog.value = false
        loadData()
      } else {
        alert(res.msg || '保存失败')
      }
    }
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    saving.value = false
  }
}

const handleDeleteSingle = (row: LearningMaterial) => {
  if (!row.id) return
  if (confirm(`确定要删除“${row.title}”吗？`)) {
    handleDelete([row.id])
  }
}

const handleDeleteSelected = () => {
  if (selectedIds.value.length === 0) {
    alert('请选择要删除的记录')
    return
  }
  if (confirm(`确定删除选中的 ${selectedIds.value.length} 条记录吗？`)) {
    handleDelete(selectedIds.value)
  }
}

const handleDelete = async (ids: number[]) => {
  loading.value = true
  try {
    const res = await deleteMaterial(ids.join(','))
    if (res.code === 0 || res.code === 200) {
      alert('删除成功')
      selectedIds.value = []
      loadData()
    } else {
      alert(res.msg || '删除失败')
    }
  } catch (e: any) {
    alert(e.message || '删除失败')
  } finally {
    loading.value = false
  }
}

// 下载资料：使用直接URL（绕过axios/CORS问题，支持跨机下载）
const download = (row: LearningMaterial) => {
  if (!row.id) return
  // 直接打开下载链接，后端设置了 Content-Disposition: attachment
  const url = `${API_BASE_URL}/LearningMaterialController/download/${row.id}`
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 记录下载次数
  incrementDownload(row.id).catch(() => {})
}

const closePreviewDialog = () => {
  showPreviewDialog.value = false
  // 如果是blob URL，释放内存
  if (previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = ''
  currentPreviewId.value = 0
}

const currentPreviewId = ref(0)

// 预览资料：使用带 token 的 URL（避免鉴权与 CORS），失败时回退 blob
const preview = async (row: LearningMaterial) => {
  if (!row.id || !row.fileType) {
    alert('无法预览该文件')
    return
  }
  const lower = row.fileType.toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.gif'].some(ext => lower.endsWith(ext))) {
    previewType.value = 'image'
  } else if (lower.endsWith('.mp4')) {
    previewType.value = 'video'
  } else if (lower.endsWith('.pdf')) {
    previewType.value = 'pdf'
  } else {
    alert('该文件类型暂不支持在线预览，请下载后查看')
    return
  }
  previewTitle.value = row.title || row.originalName || '资料预览'
  currentPreviewId.value = row.id

  try {
    const url = await getMaterialPreviewUrl(row.id)
    previewUrl.value = url ? url + (url.includes('?') ? '&' : '?') + 't=' + Date.now() : ''
    showPreviewDialog.value = true
    if (!previewUrl.value) alert('获取预览地址失败')
  } catch (e: any) {
    alert(e?.message || '预览失败')
  }
  try {
    await incrementView(row.id)
  } catch {
    // 统计失败不影响预览
  }
}

// 直接URL加载失败时，回退到blob方式（通过axios请求，本机可用）
const handlePreviewError = async () => {
  if (!currentPreviewId.value || previewUrl.value.startsWith('blob:')) return
  try {
    const blob = await getPreviewBlob(currentPreviewId.value)
    previewUrl.value = URL.createObjectURL(blob)
  } catch {
    // 两种方式都失败
  }
}

// PDF iframe 没有可靠的 error 事件，通过 load 事件检测是否真正加载成功
const handleIframeLoad = (e: Event) => {
  const iframe = e.target as HTMLIFrameElement
  try {
    // 如果 iframe 加载了空白页或错误页，尝试 blob 回退
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (doc && doc.body && doc.body.innerHTML === '') {
      handlePreviewError()
    }
  } catch {
    // 跨域无法访问 contentDocument，说明直接URL加载成功了（跨域的PDF正常渲染）
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadData()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadData()
  }
}

const formatTags = (tags?: string) => {
  if (!tags) return '—'
  return tags.split(',').map(t => t.trim()).filter(Boolean).join(' / ')
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')
  } catch {
    return dateStr
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

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}
.header-actions {
  display: flex;
  gap: 10px;
}
.btn-primary {
  padding: 10px 18px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}
.btn-primary:hover { background: #66b1ff; }
.btn-action {
  padding: 10px 18px;
  background: white;
  color: var(--text-regular);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.btn-action:hover { border-color: var(--primary-color); color: var(--primary-color); }

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.tags-input { min-width: 220px; }
.select {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.btn-query, .btn-reset {
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.btn-query { background: var(--primary-color); color: white; }
.btn-reset { background: white; color: var(--text-regular); border: 1px solid var(--border-color); }
.btn-query:hover { background: #66b1ff; }
.btn-reset:hover { border-color: var(--primary-color); color: var(--primary-color); }

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.table-card { margin-top: 8px; }

.table { width: 100%; }
.tr {
  display: grid;
  grid-template-columns: 0.5fr 2fr 1fr 1fr 1.6fr 1fr 1.4fr 0.8fr 1.6fr;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}
.tr:last-child { border-bottom: none; }
.th {
  background: #f7f9fc;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}
.td {
  color: var(--text-regular);
  font-size: 14px;
}
.checkbox-col {
  display: flex;
  align-items: center;
  justify-content: center;
}
.name .title {
  font-weight: 600;
  color: var(--text-primary);
}
.name .sub.desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  max-height: 36px;
  overflow: hidden;
}
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  background: #fff;
}
.badge.ok {
  border-color: rgba(103, 194, 58, 0.35);
  background: rgba(103, 194, 58, 0.1);
  color: #3f9c1f;
}
.badge.muted { background: #f5f7fa; }
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.btn {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}
.btn:hover { border-color: var(--primary-color); color: var(--primary-color); }
.btn.danger:hover { border-color: var(--danger-color); color: var(--danger-color); }
.btn-small {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}
.btn-small:hover { border-color: var(--primary-color); color: var(--primary-color); }

.hint {
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 12px;
}

.file-col { display: flex; flex-direction: column; gap: 4px; }
.file-name { font-weight: 600; color: var(--text-primary); }
.file-meta { font-size: 12px; color: var(--text-secondary); display: flex; gap: 8px; }
.empty-row { background: #fafafa; }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}
.page-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}
.page-btn:hover:not(:disabled) { border-color: var(--primary-color); color: var(--primary-color); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { color: var(--text-secondary); font-size: 14px; }

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}
.dialog-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary); }
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog-body { padding: 20px; }
.edit-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-input {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.form-input:disabled { background: #f5f7fa; cursor: not-allowed; }
.form-hint { font-size: 12px; color: var(--text-secondary); }
.file-line { display: flex; gap: 8px; align-items: center; }
.hidden-file-input { display: none; }

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.preview-dialog {
  max-width: 960px;
}

.preview-container {
  width: 100%;
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fc;
}

.preview-image,
.preview-video,
.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  object-fit: contain;
}

.btn-open-new {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  margin-right: auto;
  text-decoration: none;
  font-size: 14px;
  color: var(--primary-color);
}

.btn-open-new:hover {
  border-color: var(--primary-color);
  background: #f0f7ff;
}
.btn-cancel, .btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.btn-cancel { background: white; color: var(--text-regular); border: 1px solid var(--border-color); }
.btn-confirm { background: var(--primary-color); color: white; }
.btn-confirm:hover { background: #66b1ff; }
.btn-cancel:hover { border-color: var(--primary-color); color: var(--primary-color); }

@media (max-width: 900px) {
  .toolbar { flex-direction: column; }
  .table .tr { grid-template-columns: 1fr; gap: 6px; }
  .th { display: none; }
  .actions { justify-content: flex-start; }
  .form-row { grid-template-columns: 1fr; }
}
</style>


