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
        <button class="btn-primary">上传资源</button>
      </div>
    </div>
    
    <div class="resources-content">
      <div class="category-tabs">
        <button class="tab-btn active">全部</button>
        <button class="tab-btn">课件资料</button>
        <button class="tab-btn">视频资源</button>
        <button class="tab-btn">文档资料</button>
        <button class="tab-btn">图片资源</button>
      </div>
      
      <div class="resources-grid">
        <div class="resource-card" v-for="(resource, index) in resources" :key="index">
          <div class="resource-checkbox">
            <input
              type="checkbox"
              :value="index"
              v-model="selectedResources"
            />
          </div>
          <div class="resource-content">
            <div class="resource-icon">{{ resource.icon }}</div>
            <h3 class="resource-title">{{ resource.title }}</h3>
            <p class="resource-info">
              <span>大小：{{ resource.size }}</span>
              <span>下载：{{ resource.downloadCount }}次</span>
            </p>
            <div class="resource-footer">
              <span class="resource-author">上传者：{{ resource.uploader }}</span>
              <button class="download-btn">下载</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="pagination">
        <button class="page-btn" @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
        <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
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
import { ref, computed } from 'vue'

// 分页
const currentPage = ref(1)
const totalPages = ref(3)

// 选中的资源
const selectedResources = ref<number[]>([])

// 导出对话框
const showExportDialog = ref(false)
const exportType = ref<'current' | 'all'>('current')
const selectedExportFields = ref<string[]>([])

// 导出字段配置
const exportFields = [
  { key: 'resourceId', label: '资源ID' },
  { key: 'title', label: '资源名称' },
  { key: 'category', label: '资源分类' },
  { key: 'size', label: '文件大小' },
  { key: 'uploaderId', label: '上传者ID' },
  { key: 'uploader', label: '上传者' },
  { key: 'uploadTime', label: '上传时间' },
  { key: 'downloadCount', label: '下载次数' },
  { key: 'description', label: '资源描述' },
  { key: 'fileType', label: '文件类型' },
  { key: 'filePath', label: '文件路径' },
  { key: 'isPublic', label: '是否公开' }
]

// 资源数据
const resources = ref([
  {
    resourceId: 'R001',
    title: '外科护理基础教程.pdf',
    category: '课件资料',
    size: '2.5 MB',
    uploaderId: 'U001',
    uploader: '李老师',
    uploadTime: '2024-01-15 10:30:00',
    downloadCount: 156,
    description: '外科护理基础知识教程',
    fileType: 'pdf',
    filePath: '/resources/R001.pdf',
    isPublic: true,
    icon: '📄'
  },
  {
    resourceId: 'R002',
    title: '护理操作视频.mp4',
    category: '视频资源',
    size: '125.8 MB',
    uploaderId: 'U002',
    uploader: '张老师',
    uploadTime: '2024-01-14 14:20:00',
    downloadCount: 89,
    description: '护理操作标准流程视频',
    fileType: 'mp4',
    filePath: '/resources/R002.mp4',
    isPublic: true,
    icon: '🎬'
  },
  {
    resourceId: 'R003',
    title: '护理指南文档.docx',
    category: '文档资料',
    size: '1.2 MB',
    uploaderId: 'U003',
    uploader: '王老师',
    uploadTime: '2024-01-13 09:15:00',
    downloadCount: 234,
    description: '护理操作指南文档',
    fileType: 'docx',
    filePath: '/resources/R003.docx',
    isPublic: true,
    icon: '📝'
  },
  {
    resourceId: 'R004',
    title: '护理流程图.png',
    category: '图片资源',
    size: '856 KB',
    uploaderId: 'U004',
    uploader: '赵老师',
    uploadTime: '2024-01-12 16:45:00',
    downloadCount: 67,
    description: '护理流程图',
    fileType: 'png',
    filePath: '/resources/R004.png',
    isPublic: false,
    icon: '🖼️'
  },
  {
    resourceId: 'R005',
    title: '外科护理案例集.pdf',
    category: '课件资料',
    size: '3.8 MB',
    uploaderId: 'U001',
    uploader: '李老师',
    uploadTime: '2024-01-11 11:20:00',
    downloadCount: 198,
    description: '外科护理实际案例集合',
    fileType: 'pdf',
    filePath: '/resources/R005.pdf',
    isPublic: true,
    icon: '📄'
  },
  {
    resourceId: 'R006',
    title: '护理培训课件.pptx',
    category: '课件资料',
    size: '5.2 MB',
    uploaderId: 'U002',
    uploader: '张老师',
    uploadTime: '2024-01-10 08:30:00',
    downloadCount: 145,
    description: '护理培训课程课件',
    fileType: 'pptx',
    filePath: '/resources/R006.pptx',
    isPublic: true,
    icon: '📊'
  },
  {
    resourceId: 'R007',
    title: '护理技能演示.mp4',
    category: '视频资源',
    size: '98.5 MB',
    uploaderId: 'U003',
    uploader: '王老师',
    uploadTime: '2024-01-09 15:10:00',
    downloadCount: 112,
    description: '护理技能标准演示视频',
    fileType: 'mp4',
    filePath: '/resources/R007.mp4',
    isPublic: true,
    icon: '🎬'
  },
  {
    resourceId: 'R008',
    title: '护理规范手册.pdf',
    category: '文档资料',
    size: '2.1 MB',
    uploaderId: 'U004',
    uploader: '赵老师',
    uploadTime: '2024-01-08 13:25:00',
    downloadCount: 178,
    description: '护理操作规范手册',
    fileType: 'pdf',
    filePath: '/resources/R008.pdf',
    isPublic: true,
    icon: '📄'
  }
])

// 分页功能
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
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
  padding: 8px 16px;
  background: white;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-action:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-title {
  font-size: 26px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.btn-primary {
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #66b1ff;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.tab-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tab-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.resource-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.resource-checkbox {
  padding-top: 2px;
  flex-shrink: 0;
}

.resource-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.resource-content {
  flex: 1;
}

.resource-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.resource-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.resource-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  text-align: center;
}

.resource-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.resource-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.resource-author {
  font-size: 12px;
  color: var(--text-secondary);
}

.download-btn {
  padding: 6px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s;
}

.download-btn:hover {
  background: #66b1ff;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}

/* 导出对话框样式 */
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
  letter-spacing: -0.2px;
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
  flex-shrink: 0;
}

.field-checkbox span {
  flex: 1;
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
  font-weight: 400;
}

.btn-cancel:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(91, 155, 213, 0.05);
  transform: translateY(-1px);
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
  font-weight: 400;
}

.btn-confirm:hover {
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 155, 213, 0.3);
}

@media (max-width: 768px) {
  .resources-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    width: 100%;
    flex-direction: column;
  }
  
  .btn-action {
    width: 100%;
  }
  
  .export-dialog {
    width: 95%;
    max-height: 90vh;
  }
  
  .field-options {
    grid-template-columns: 1fr;
  }
}
</style>

