<template>
  <div class="resources-page">
    <div class="page-header">
      <h1 class="page-title">资源共享平台</h1>
      <div class="header-actions">
        <div class="action-buttons">
          <button class="btn-action" @click="handlePrintAll">打印全部</button>
          <button class="btn-action" @click="handlePrintSelected">打印勾选</button>
          <button class="btn-action" @click="handleExportCurrentPage">导出当前页Excel</button>
          <button class="btn-action" @click="handleExportAll">导出Excel</button>
        </div>
        <button class="btn-primary" @click="openUploadDialog">上传资源</button>
        <button class="btn-action" @click="handleDelete" v-if="selectedResources.length > 0">删除选中</button>
      </div>
    </div>
    
    <div class="resources-content">
      <!-- 搜索表单 -->
      <div class="search-form">
        <div class="form-row">
          <div class="form-item">
            <label>资源名称：</label>
            <input 
              type="text" 
              placeholder="请输入资源名称" 
              class="form-input" 
              v-model="searchForm.resourceName" 
            />
          </div>
          <div class="form-item">
            <label>上传者：</label>
            <input 
              type="text" 
              placeholder="请输入上传者" 
              class="form-input" 
              v-model="searchForm.uploadUser" 
            />
          </div>
          <div class="form-item">
            <label>资源类型：</label>
            <select class="form-input" v-model="searchForm.resourceType">
              <option value="">全部类型</option>
              <option value="课件资料">课件资料</option>
              <option value="视频资源">视频资源</option>
              <option value="文档资料">文档资料</option>
              <option value="图片资源">图片资源</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn-query" @click="handleSearch">查询</button>
            <button class="btn-reset" @click="handleReset">重置</button>
          </div>
        </div>
      </div>
      
      <!-- 表格展示 -->
      <div class="table-container" v-if="!loading">
        <table class="data-table">
          <thead>
            <tr>
              <th width="50">
                <input 
                  type="checkbox" 
                  @change="handleSelectAll"
                  :checked="selectedResources.length === resources.length && resources.length > 0"
                />
              </th>
              <th width="60">序号</th>
              <th width="150">操作</th>
              <th width="100">资源ID</th>
              <th width="250">资源名称</th>
              <th width="120">资源类型</th>
              <th width="120">上传者</th>
              <th width="180">上传时间</th>
              <th width="120">下载次数</th>
              <th>资源描述</th>
              <th width="100">审核状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="resources.length === 0">
              <td colspan="11" class="empty-state">
                <p>暂无数据</p>
              </td>
            </tr>
            <tr v-for="(resource, index) in resources" :key="resource.id || index" class="table-row">
              <td>
                <input 
                  type="checkbox" 
                  :value="resource.id"
                  v-model="selectedResources"
                />
              </td>
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>
                <button class="btn-link" @click="handleDownload(resource)">下载</button>
                <button class="btn-link" @click="handleEdit(resource)">编辑</button>
                <button class="btn-link btn-danger" @click="handleDeleteSingle(resource)">删除</button>
              </td>
              <td>{{ resource.resourceId || resource.id || '-' }}</td>
              <td>
                <span class="resource-name" :title="resource.resourceName">
                  {{ resource.resourceName }}
                </span>
              </td>
              <td>{{ resource.resourceType || '-' }}</td>
              <td>{{ getUserDisplayName(resource.uploadUser) }}</td>
              <td>{{ formatDateTime(resource.uploadDate) }}</td>
              <td>
                {{ resource.downloadCount || 0 }}
                <button class="btn-link btn-download" @click="handleDownload(resource)" title="下载资源">
                  ⬇️
                </button>
              </td>
              <td class="content-cell">{{ resource.resourceDesc || '-' }}</td>
              <td>
                <span :class="getApprovalStatusClass(resource.isApproved)">
                  {{ getApprovalStatus(resource.isApproved) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="loading-state">
        <p>加载中...</p>
      </div>
      
      <div class="pagination">
        <button class="page-btn" @click="prevPage" :disabled="currentPage === 1 || loading">上一页</button>
        <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页（共 {{ total }} 条）</span>
        <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages || loading">下一页</button>
      </div>
    </div>
    
    <!-- 上传资源对话框 -->
    <div v-if="showUploadDialog" class="export-dialog-overlay" @click="showUploadDialog = false">
      <div class="export-dialog" @click.stop>
        <div class="dialog-header">
          <h3>上传资源</h3>
          <button class="close-btn" @click="showUploadDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>资源名称 *</label>
            <input
              v-model="uploadForm.resourceName"
              type="text"
              placeholder="请先选择文件，资源名称将自动填充"
              class="form-input"
              maxlength="160"
              readonly
            />
          </div>
          <div class="form-group">
            <label>资源类型 *</label>
            <select v-model="uploadForm.resourceType" class="form-input">
              <option value="">请选择资源类型</option>
              <option value="课件资料">课件资料</option>
              <option value="视频资源">视频资源</option>
              <option value="文档资料">文档资料</option>
              <option value="图片资源">图片资源</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>资源描述</label>
            <textarea
              v-model="uploadForm.resourceDesc"
              placeholder="请输入资源描述"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>
          <div class="form-group">
            <label>选择文件 *</label>
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              class="form-input"
            />
            <span v-if="selectedFile" class="file-info">
              已选择：{{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
            </span>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showUploadDialog = false">取消</button>
          <button class="btn-confirm" @click="handleUpload" :disabled="uploading">
            {{ uploading ? '上传中...' : '上传' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 编辑资源对话框 -->
    <div v-if="showEditDialog" class="export-dialog-overlay" @click="showEditDialog = false">
      <div class="export-dialog edit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>编辑资源</h3>
          <button class="close-btn" @click="showEditDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="edit-form-grid">
            <div class="form-column">
              <div class="form-group">
                <label>资源ID：</label>
                <input
                  type="text"
                  :value="editForm.resourceId || editForm.id || '-'"
                  class="form-input"
                  disabled
                />
              </div>
              <div class="form-group">
                <label>资源名称 *</label>
                <input
                  v-model="editForm.resourceName"
                  type="text"
                  placeholder="请输入资源名称"
                  class="form-input"
                  maxlength="160"
                />
              </div>
              <div class="form-group">
                <label>资源类型 *</label>
                <select v-model="editForm.resourceType" class="form-input">
                  <option value="">请选择资源类型</option>
                  <option value="课件资料">课件资料</option>
                  <option value="视频资源">视频资源</option>
                  <option value="文档资料">文档资料</option>
                  <option value="图片资源">图片资源</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div class="form-group">
                <label>上传者</label>
                <input
                  v-model="editForm.uploadUser"
                  type="text"
                  placeholder="请输入上传者"
                  class="form-input"
                />
              </div>
            </div>
            <div class="form-column">
              <div class="form-group">
                <label>上传时间</label>
                <input
                  v-model="editForm.uploadDate"
                  type="datetime-local"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label>下载次数</label>
                <input
                  v-model.number="editForm.downloadCount"
                  type="number"
                  min="0"
                  class="form-input"
                  placeholder="0"
                />
              </div>
              <div class="form-group">
                <label>审核状态</label>
                <select v-model.number="editForm.isApproved" class="form-input">
                  <option :value="0">未审核</option>
                  <option :value="1">已审核</option>
                </select>
              </div>
              <div class="form-group">
                <label>资源描述</label>
                <textarea
                  v-model="editForm.resourceDesc"
                  placeholder="请输入资源描述"
                  class="form-textarea"
                  rows="4"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showEditDialog = false">取消</button>
          <button class="btn-confirm" @click="handleSaveEdit" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 导出字段选择对话框 -->
    <div v-if="showExportDialog" class="export-dialog-overlay" @click="showExportDialog = false">
      <div class="export-dialog" @click.stop>
        <div class="dialog-header">
          <h3>选择导出字段</h3>
          <button class="close-btn" @click="showExportDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="field-options">
            <label v-for="field in exportFields" :key="field.key" class="field-checkbox">
              <input
                type="checkbox"
                :value="field.key"
                v-model="selectedExportFields"
              />
              <span>{{ field.label }}</span>
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showExportDialog = false">取消</button>
          <button class="btn-confirm" @click="confirmExport">确认导出</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  getResourceList, 
  addResource, 
  updateResource, 
  deleteResource, 
  uploadResource,
  downloadResource,
  incrementDownload,
  type ResourceSharing 
} from '@/api/resources'
import { useAuthStore } from '@/stores/auth'
import { batchUserInfo } from '@/api/auth'

const authStore = useAuthStore()

// 搜索表单
const searchForm = ref({
  resourceName: '',
  uploadUser: '',
  resourceType: ''
})

// 分页
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(1)
const total = ref(0)
const loading = ref(false)

// 选中的资源
const selectedResources = ref<(number | string)[]>([])

// 资源数据
const resources = ref<ResourceSharing[]>([])
// 用户昵称映射表
const userDisplayNames = ref<Record<string, string>>({})

// 上传对话框
const showUploadDialog = ref(false)
const uploading = ref(false)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadForm = ref({
  resourceName: '',
  resourceType: '',
  resourceDesc: ''
})

// 编辑对话框
const showEditDialog = ref(false)
const saving = ref(false)
const editForm = ref<ResourceSharing>({
  id: undefined,
  resourceId: undefined,
  resourceName: '',
  resourceType: '',
  uploadUser: '',
  uploadDate: '',
  downloadCount: 0,
  resourceDesc: '',
  isApproved: 1
})

// 导出对话框
const showExportDialog = ref(false)
const exportType = ref<'current' | 'all'>('current')
const selectedExportFields = ref<string[]>([])

// 导出字段配置
const exportFields = [
  { key: 'resourceId', label: '资源ID' },
  { key: 'resourceName', label: '资源名称' },
  { key: 'resourceType', label: '资源类型' },
  { key: 'uploadUser', label: '上传者' },
  { key: 'uploadDate', label: '上传时间' },
  { key: 'downloadCount', label: '下载次数' },
  { key: 'resourceDesc', label: '资源描述' },
  { key: 'filePath', label: '文件路径' },
  { key: 'isApproved', label: '审核状态' },
  { key: 'approvalDate', label: '审核时间' }
]

// 加载数据
const loadResourceList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize
    }
    
    if (searchForm.value.resourceName?.trim()) {
      params.resourceName = searchForm.value.resourceName.trim()
    }
    
    if (searchForm.value.uploadUser?.trim()) {
      params.uploadUser = searchForm.value.uploadUser.trim()
    }
    
    if (searchForm.value.resourceType) {
      params.resourceType = searchForm.value.resourceType
    }
    
    const response = await getResourceList(params)
    
    if (response.code === 200 || response.code === 0) {
      resources.value = (response.data || []) as ResourceSharing[]
      total.value = response.count || 0
      totalPages.value = Math.ceil(total.value / pageSize)
      
      // 批量获取用户昵称
      await loadUserDisplayNames()
    } else {
      alert('加载数据失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    console.error('加载资源列表失败:', error)
    alert('加载数据失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 批量加载用户显示名称
const loadUserDisplayNames = async () => {
  const userIds = new Set<string>()
  resources.value.forEach(resource => {
    if (resource.uploadUser) {
      userIds.add(resource.uploadUser)
    }
  })
  
  if (userIds.size === 0) return
  
  try {
    const response = await batchUserInfo(Array.from(userIds))
    if (response.code === 200 || response.code === 0 && response.data) {
      Object.assign(userDisplayNames.value, response.data)
    }
  } catch (error: any) {
    console.error('获取用户昵称失败:', error)
  }
}

// 获取用户显示名称
const getUserDisplayName = (userId?: string) => {
  if (!userId) return '匿名'
  return userDisplayNames.value[userId] || userId
}

// 格式化日期时间
const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 获取审核状态
const getApprovalStatus = (isApproved?: number) => {
  return isApproved === 1 ? '已审核' : '未审核'
}

// 获取审核状态样式类
const getApprovalStatusClass = (isApproved?: number) => {
  return isApproved === 1 ? 'status-approved' : 'status-pending'
}

// 查询按钮
const handleSearch = () => {
  currentPage.value = 1
  loadResourceList()
}

// 重置按钮
const handleReset = () => {
  searchForm.value = {
    resourceName: '',
    uploadUser: '',
    resourceType: ''
  }
  currentPage.value = 1
  loadResourceList()
}

// 全选/取消全选
const handleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    selectedResources.value = resources.value.map(r => r.id || r.resourceId).filter(Boolean) as (number | string)[]
  } else {
    selectedResources.value = []
  }
}

// 打开上传对话框
const openUploadDialog = () => {
  showUploadDialog.value = true
  uploadForm.value = {
    resourceName: '',
    resourceType: '',
    resourceDesc: ''
  }
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 选择文件
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
    // 自动填充资源名称为文件名（包含扩展名）
    uploadForm.value.resourceName = selectedFile.value.name
  }
}

// 上传资源
const handleUpload = async () => {
  if (!selectedFile.value) {
    alert('请选择要上传的文件')
    return
  }
  if (!uploadForm.value.resourceName?.trim()) {
    alert('请先选择文件，资源名称将自动填充')
    return
  }
  if (!uploadForm.value.resourceType) {
    alert('请选择资源类型')
    return
  }
  
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('resourceName', uploadForm.value.resourceName.trim())
    formData.append('resourceType', uploadForm.value.resourceType)
    formData.append('resourceDesc', uploadForm.value.resourceDesc?.trim() || '')
    formData.append('uploadUser', authStore.userPhone || '')
    
    const response = await uploadResource(formData)
    
    if (response.code === 200 || response.code === 0) {
      alert('上传成功')
      showUploadDialog.value = false
      currentPage.value = 1
      loadResourceList()
    } else {
      alert('上传失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    console.error('上传失败:', error)
    alert('上传失败：' + (error.message || '未知错误'))
  } finally {
    uploading.value = false
  }
}

// 编辑资源
const handleEdit = (resource: ResourceSharing) => {
  editForm.value = {
    id: resource.id,
    resourceId: resource.resourceId,
    resourceName: resource.resourceName || '',
    resourceType: resource.resourceType || '',
    uploadUser: resource.uploadUser || '',
    uploadDate: formatDateTimeForInput(resource.uploadDate),
    downloadCount: resource.downloadCount || 0,
    resourceDesc: resource.resourceDesc || '',
    isApproved: resource.isApproved || 0
  }
  showEditDialog.value = true
}

// 格式化日期时间为datetime-local格式
const formatDateTimeForInput = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// 保存编辑
const handleSaveEdit = async () => {
  if (!editForm.value.resourceName?.trim()) {
    alert('请输入资源名称')
    return
  }
  if (!editForm.value.resourceType) {
    alert('请选择资源类型')
    return
  }
  
  saving.value = true
  try {
    const updateData: ResourceSharing = {
      id: editForm.value.id,
      resourceId: editForm.value.resourceId,
      resourceName: editForm.value.resourceName.trim(),
      resourceType: editForm.value.resourceType,
      uploadUser: editForm.value.uploadUser?.trim() || undefined,
      uploadDate: editForm.value.uploadDate ? convertDateTimeLocalToISO(editForm.value.uploadDate) : undefined,
      downloadCount: editForm.value.downloadCount || 0,
      resourceDesc: editForm.value.resourceDesc?.trim() || undefined,
      isApproved: editForm.value.isApproved || 0
    }
    
    const response = await updateResource(updateData)
    
    if (response.code === 200 || response.code === 0) {
      alert('保存成功')
      showEditDialog.value = false
      loadResourceList()
    } else {
      alert('保存失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    alert('保存失败：' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

// 将datetime-local格式转换为ISO格式
const convertDateTimeLocalToISO = (dateTimeLocal: string) => {
  if (!dateTimeLocal) return undefined
  const [datePart, timePart] = dateTimeLocal.split('T')
  const time = timePart || '00:00'
  return `${datePart} ${time}:00`
}

// 删除单个资源
const handleDeleteSingle = async (resource: ResourceSharing) => {
  if (!confirm(`确定要删除资源"${resource.resourceName}"吗？`)) {
    return
  }
  
  try {
    const id = resource.id || resource.resourceId
    if (!id) {
      alert('无法获取资源ID')
      return
    }
    const response = await deleteResource(String(id))
    
    if (response.code === 200 || response.code === 0) {
      alert('删除成功')
      loadResourceList()
    } else {
      alert('删除失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    alert('删除失败：' + (error.message || '未知错误'))
  }
}

// 删除选中资源
const handleDelete = async () => {
  if (selectedResources.value.length === 0) {
    alert('请先选择要删除的资源')
    return
  }
  
  if (!confirm(`确定要删除选中的 ${selectedResources.value.length} 个资源吗？`)) {
    return
  }
  
  try {
    const ids = selectedResources.value.join(',')
    const response = await deleteResource(ids)
    
    if (response.code === 200 || response.code === 0) {
      alert('删除成功')
      selectedResources.value = []
      loadResourceList()
    } else {
      alert('删除失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    alert('删除失败：' + (error.message || '未知错误'))
  }
}

// 下载资源
const handleDownload = async (resource: ResourceSharing) => {
  const id = resource.id || resource.resourceId
  if (!id) {
    alert('无法获取资源ID')
    return
  }
  
  try {
    // 先增加下载次数
    await incrementDownload(id)
    
    // 下载文件
    const blob = await downloadResource(id)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = resource.resourceName || 'resource'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    // 刷新列表以更新下载次数
    loadResourceList()
  } catch (error: any) {
    console.error('下载失败:', error)
    alert('下载失败：' + (error.message || '未知错误'))
  }
}

// 分页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadResourceList()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadResourceList()
  }
}

// 打印功能
const handlePrintAll = () => {
  window.print()
}

const handlePrintSelected = () => {
  if (selectedResources.value.length === 0) {
    alert('请先选择要打印的资源')
    return
  }
  alert(`准备打印 ${selectedResources.value.length} 个资源`)
}

// 导出Excel功能
const handleExportCurrentPage = () => {
  exportType.value = 'current'
  selectedExportFields.value = exportFields.map(f => f.key)
  showExportDialog.value = true
}

const handleExportAll = () => {
  exportType.value = 'all'
  selectedExportFields.value = exportFields.map(f => f.key)
  showExportDialog.value = true
}

// 确认导出
const confirmExport = () => {
  if (selectedExportFields.value.length === 0) {
    alert('请至少选择一个导出字段')
    return
  }
  
  const dataToExport = exportType.value === 'current' 
    ? resources.value 
    : resources.value
  
  exportToCSV(dataToExport, selectedExportFields.value)
  showExportDialog.value = false
}

// 导出为CSV
const exportToCSV = (data: any[], fields: string[]) => {
  const headers = fields.map(key => {
    const field = exportFields.find(f => f.key === key)
    return field ? field.label : key
  })
  
  let csvContent = '\uFEFF'
  csvContent += headers.join(',') + '\n'
  
  data.forEach(item => {
    const row = fields.map(key => {
      let value = item[key] ?? ''
      if (typeof value === 'boolean') {
        value = value ? '是' : '否'
      }
      if (key === 'isApproved') {
        value = value === 1 ? '已审核' : '未审核'
      }
      if (String(value).includes(',') || String(value).includes('\n')) {
        value = `"${String(value).replace(/"/g, '""')}"`
      }
      return value
    })
    csvContent += row.join(',') + '\n'
  })
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `资源共享_${exportType.value === 'current' ? '当前页' : '全部'}_${new Date().getTime()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 页面加载
onMounted(() => {
  loadResourceList()
})
</script>

<style scoped>
.resources-page {
  max-width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 26px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-action {
  padding: 9px 17px;
  background: var(--card-bg);
  color: var(--text-regular);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.25s ease;
  white-space: nowrap;
  font-weight: 400;
}

.btn-action:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(91, 155, 213, 0.25);
}

.btn-primary {
  padding: 10px 22px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.25s ease;
  white-space: nowrap;
  font-weight: 400;
}

.btn-primary:hover {
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 155, 213, 0.3);
}

/* 搜索表单样式 */
.search-form {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 200px;
}

.form-item label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

.btn-query {
  padding: 10px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.25s ease;
  font-weight: 400;
  white-space: nowrap;
}

.btn-query:hover {
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 155, 213, 0.3);
}

.btn-reset {
  padding: 10px 24px;
  background: var(--card-bg);
  color: var(--text-regular);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.25s ease;
  font-weight: 400;
  white-space: nowrap;
}

.btn-reset:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(91, 155, 213, 0.05);
  transform: translateY(-1px);
}

/* 表格样式 */
.table-container {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table thead {
  background: #f5f7fa;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-regular);
}

.data-table tbody tr.table-row:hover {
  background: #f5f7fa;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.content-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-name {
  font-weight: 500;
  color: var(--text-primary);
}

.status-approved {
  padding: 4px 8px;
  background: #f0f9ff;
  color: #67c23a;
  border-radius: 4px;
  font-size: 12px;
}

.status-pending {
  padding: 4px 8px;
  background: #fef0f0;
  color: #f56c6c;
  border-radius: 4px;
  font-size: 12px;
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  padding: 4px 8px;
  font-size: 13px;
  margin-right: 8px;
  transition: all 0.2s;
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-link.btn-danger {
  color: #f56c6c;
}

.btn-link.btn-danger:hover {
  color: #f78989;
}

.btn-link.btn-download {
  margin-left: 8px;
  color: var(--primary-color);
  font-size: 14px;
  padding: 2px 4px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-btn {
  padding: 9px 18px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 14px;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(91, 155, 213, 0.05);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

/* 对话框样式 */
.export-dialog-overlay {
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

.export-dialog {
  background: var(--card-bg);
  border-radius: 14px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.edit-dialog {
  max-width: 1200px;
  width: 95%;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 500;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.dialog-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-input:disabled {
  background: #f5f7fa;
  color: var(--text-secondary);
  cursor: not-allowed;
}

.form-input[readonly] {
  background: #f9fafb;
  color: var(--text-primary);
  cursor: default;
}

.file-info {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.edit-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  padding: 10px 22px;
  background: var(--card-bg);
  color: var(--text-regular);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.25s ease;
}

.btn-cancel:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(91, 155, 213, 0.05);
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-confirm {
  padding: 10px 22px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.25s ease;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 155, 213, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-regular);
  user-select: none;
}

.field-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

@media (max-width: 1024px) {
  .edit-form-grid {
    grid-template-columns: 1fr;
  }
  
  .edit-dialog {
    max-width: 600px;
  }
}
</style>
