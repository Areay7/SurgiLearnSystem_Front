<template>
  <div class="feedback-page">
    <div class="page-header">
      <h1 class="page-title">反馈评价</h1>
      <div class="header-actions">
        <div class="action-buttons">
          <button class="btn-action" @click="handlePrintAll">打印全部</button>
          <button class="btn-action" @click="handlePrintSelected">打印勾选</button>
          <button class="btn-action" @click="handleExportCurrentPage">导出当前页Excel</button>
          <button class="btn-action" @click="handleExportAll">导出Excel</button>
        </div>
        <button class="btn-primary">提交反馈</button>
      </div>
    </div>
    
    <div class="feedback-content">
      <div class="feedback-tabs">
        <button class="tab-btn active">全部反馈</button>
        <button class="tab-btn">课程评价</button>
        <button class="tab-btn">系统建议</button>
        <button class="tab-btn">问题反馈</button>
      </div>
      
      <div class="feedback-list">
        <div class="feedback-item" v-for="(feedback, index) in feedbacks" :key="index">
          <div class="feedback-checkbox">
            <input
              type="checkbox"
              :value="index"
              v-model="selectedFeedbacks"
            />
          </div>
          <div class="feedback-content-wrapper">
            <div class="feedback-header">
              <div class="feedback-user">
                <span class="user-avatar">👤</span>
                <div>
                  <div class="user-name">{{ feedback.userName }}</div>
                  <div class="feedback-time">{{ feedback.time }}</div>
                </div>
              </div>
              <div class="feedback-rating">
                <span class="stars">{{ getStars(feedback.rating) }}</span>
              </div>
            </div>
            <div class="feedback-title">{{ feedback.title }}</div>
            <p class="feedback-content-text">{{ feedback.content }}</p>
            <div class="feedback-tags">
              <span class="tag" v-for="tag in feedback.tags" :key="tag">{{ tag }}</span>
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
const totalPages = ref(4)

// 选中的反馈
const selectedFeedbacks = ref<number[]>([])

// 导出对话框
const showExportDialog = ref(false)
const exportType = ref<'current' | 'all'>('current')
const selectedExportFields = ref<string[]>([])

// 导出字段配置
const exportFields = [
  { key: 'feedbackId', label: '反馈ID' },
  { key: 'title', label: '反馈标题' },
  { key: 'content', label: '反馈内容' },
  { key: 'userId', label: '反馈者ID' },
  { key: 'userName', label: '反馈者姓名' },
  { key: 'feedbackTime', label: '反馈时间' },
  { key: 'rating', label: '评分' },
  { key: 'feedbackType', label: '反馈类型' },
  { key: 'courseId', label: '关联课程ID' },
  { key: 'courseName', label: '关联课程名称' },
  { key: 'tags', label: '标签' },
  { key: 'status', label: '处理状态' }
]

// 反馈数据
const feedbacks = ref([
  {
    feedbackId: 'F001',
    title: '课程《外科护理基础》评价',
    content: '这门课程内容非常丰富，讲解详细，对我帮助很大。希望能增加更多实际案例的分析。',
    userId: 'U101',
    userName: '学员1',
    feedbackTime: '2024-01-15 10:30:00',
    time: '2024-01-15 10:30',
    rating: 5,
    feedbackType: '课程评价',
    courseId: 'C001',
    courseName: '外科护理基础',
    tags: ['课程评价', '建议'],
    status: '已处理'
  },
  {
    feedbackId: 'F002',
    title: '系统使用建议',
    content: '希望系统能够增加更多的学习资源，特别是视频教程方面。',
    userId: 'U102',
    userName: '学员2',
    feedbackTime: '2024-01-14 14:20:00',
    time: '2024-01-14 14:20',
    rating: 4,
    feedbackType: '系统建议',
    courseId: '',
    courseName: '',
    tags: ['系统建议'],
    status: '处理中'
  },
  {
    feedbackId: 'F003',
    title: '视频播放问题反馈',
    content: '视频播放时经常出现卡顿现象，希望能优化一下。',
    userId: 'U103',
    userName: '学员3',
    feedbackTime: '2024-01-13 09:15:00',
    time: '2024-01-13 09:15',
    rating: 3,
    feedbackType: '问题反馈',
    courseId: 'C002',
    courseName: '护理操作技能',
    tags: ['问题反馈', '技术问题'],
    status: '待处理'
  },
  {
    feedbackId: 'F004',
    title: '课程《护理心理学》评价',
    content: '课程内容很好，但希望能有更多的互动环节。',
    userId: 'U104',
    userName: '学员4',
    feedbackTime: '2024-01-12 16:45:00',
    time: '2024-01-12 16:45',
    rating: 4,
    feedbackType: '课程评价',
    courseId: 'C003',
    courseName: '护理心理学',
    tags: ['课程评价'],
    status: '已处理'
  },
  {
    feedbackId: 'F005',
    title: '学习资料更新建议',
    content: '希望学习资料能够及时更新，保持内容的时效性。',
    userId: 'U105',
    userName: '学员5',
    feedbackTime: '2024-01-11 11:20:00',
    time: '2024-01-11 11:20',
    rating: 5,
    feedbackType: '系统建议',
    courseId: '',
    courseName: '',
    tags: ['系统建议', '内容更新'],
    status: '已处理'
  },
  {
    feedbackId: 'F006',
    title: '考试系统优化建议',
    content: '考试系统的界面可以更加友好一些，操作流程可以简化。',
    userId: 'U106',
    userName: '学员6',
    feedbackTime: '2024-01-10 08:30:00',
    time: '2024-01-10 08:30',
    rating: 4,
    feedbackType: '系统建议',
    courseId: '',
    courseName: '',
    tags: ['系统建议', '界面优化'],
    status: '处理中'
  }
])

// 获取星级显示
const getStars = (rating: number) => {
  return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
}

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
  if (selectedFeedbacks.value.length === 0) {
    alert('请先选择要打印的反馈')
    return
  }
  alert(`准备打印 ${selectedFeedbacks.value.length} 条反馈`)
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
    ? feedbacks.value 
    : feedbacks.value
  
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
      // 处理数组（如tags）
      if (Array.isArray(value)) {
        value = value.join(';')
      }
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
  link.setAttribute('download', `反馈评价_${exportType.value === 'current' ? '当前页' : '全部'}_${new Date().getTime()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.feedback-page {
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
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 155, 213, 0.3);
}

.feedback-tabs {
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

.feedback-list {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.feedback-item {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.feedback-checkbox {
  padding-top: 2px;
  flex-shrink: 0;
}

.feedback-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.feedback-content-wrapper {
  flex: 1;
}

.feedback-item:last-child {
  border-bottom: none;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.feedback-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.feedback-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.feedback-rating .stars {
  font-size: 16px;
}

.feedback-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.feedback-content-text {
  color: var(--text-regular);
  line-height: 1.6;
  margin-bottom: 12px;
}

.feedback-tags {
  display: flex;
  gap: 8px;
}

.tag {
  padding: 4px 12px;
  background: #ecf5ff;
  color: var(--primary-color);
  border-radius: 12px;
  font-size: 12px;
}

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
  
  .feedback-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
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

