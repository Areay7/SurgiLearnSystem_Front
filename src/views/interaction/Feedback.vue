<template>
  <div class="feedback-page">
    <div class="page-header">
      <h1 class="page-title">反馈评价</h1>
      <div class="header-actions">
        <div class="action-buttons">
          <button class="btn-action" @click="handleExport">导出Excel</button>
        </div>
        <button class="btn-primary" @click="openSubmitDialog">提交反馈</button>
      </div>
    </div>
    
    <div class="feedback-content">
      <div class="feedback-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value; loadList()"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <div class="search-bar">
            <input
          v-model="keyword"
          type="text"
          placeholder="搜索标题、内容、反馈人..."
          class="search-input"
          @keyup.enter="loadList"
        />
        <button class="btn-search" @click="loadList">搜索</button>
      </div>
      
      <div class="feedback-list" v-if="!loading">
        <div v-if="feedbacks.length === 0" class="empty-state">暂无反馈数据</div>
        <div v-else class="feedback-item" v-for="(fb, index) in feedbacks" :key="fb.id || index">
          <div class="feedback-checkbox" v-if="canManage">
            <input type="checkbox" :value="fb.id" v-model="selectedIds" />
          </div>
          <div class="feedback-content-wrapper">
            <div class="feedback-header">
              <div class="feedback-user">
                <span class="user-avatar">👤</span>
                <div>
                  <div class="user-name">{{ fb.userName || fb.userId || '-' }}</div>
                  <div class="feedback-time">{{ formatTime(fb.createTime) }}</div>
                </div>
              </div>
              <div class="feedback-meta">
                <span class="type-tag">{{ fb.feedbackType || '系统建议' }}</span>
                <span class="status-tag" :class="getStatusClass(fb.status)">{{ fb.status || '待处理' }}</span>
                <span class="stars">{{ getStars(fb.rating || 0) }}</span>
              </div>
            </div>
            <div class="feedback-title">{{ fb.title }}</div>
            <p class="feedback-content-text">{{ fb.content }}</p>
            <div v-if="fb.relateName" class="feedback-relate">关联：{{ fb.relateName }}</div>
            <div v-if="fb.replyContent" class="feedback-reply">
              <div class="reply-label">管理员回复：</div>
              <div class="reply-content">{{ fb.replyContent }}</div>
              <div class="reply-time" v-if="fb.replyTime">{{ formatTime(fb.replyTime) }}</div>
            </div>
            <div class="feedback-actions" v-if="canManage">
              <button class="btn-sm" v-if="canEditItem(fb)" @click="openEditDialog(fb)">编辑</button>
              <button class="btn-sm" @click="openReplyDialog(fb)">回复</button>
              <button class="btn-sm" @click="openStatusDialog(fb)">更新状态</button>
              <button class="btn-sm danger" v-if="canDeleteItem(fb)" @click="handleDelete(fb)">删除</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="loading-state">加载中...</div>
      
      <div class="pagination" v-if="total > 0">
        <button class="page-btn" @click="prevPage" :disabled="page <= 1">上一页</button>
        <span class="page-info">第 {{ page }} 页，共 {{ totalPages }} 页，共 {{ total }} 条</span>
        <button class="page-btn" @click="nextPage" :disabled="page >= totalPages">下一页</button>
      </div>
    </div>
    
    <!-- 提交反馈对话框 -->
    <div v-if="showSubmitDialog" class="dialog-overlay" @click="showSubmitDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ isEditing ? '编辑反馈' : '提交反馈' }}</h3>
          <button class="close-btn" @click="showSubmitDialog = false">×</button>
        </div>
        <form class="dialog-body" @submit.prevent="submitFeedback">
          <div class="form-group">
            <label>反馈类型 *</label>
            <select v-model="form.feedbackType" required>
              <option value="课程评价">课程评价</option>
              <option value="系统建议">系统建议</option>
              <option value="问题反馈">问题反馈</option>
            </select>
          </div>
          <div class="form-group" v-if="form.feedbackType === '课程评价'">
            <label>关联培训/课程</label>
            <select v-model="form.relateId">
              <option :value="undefined">不关联</option>
              <option v-for="t in trainingList" :key="t.id" :value="t.id">{{ t.trainingName || t.training_name || '-' }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>标题 *</label>
            <input v-model="form.title" type="text" placeholder="请输入反馈标题" required maxlength="200" />
          </div>
          <div class="form-group">
            <label>内容 *</label>
            <textarea v-model="form.content" placeholder="请详细描述您的反馈或建议" required rows="5"></textarea>
          </div>
          <div class="form-group">
            <label>评分（1-5星，选填）</label>
            <div class="rating-select">
              <button type="button" v-for="n in 5" :key="n" class="star-btn" :class="{ active: form.rating >= n }" @click="form.rating = n">
                {{ form.rating >= n ? '⭐' : '☆' }}
              </button>
            </div>
          </div>
          <div class="dialog-footer">
            <button type="button" class="btn-cancel" @click="showSubmitDialog = false">取消</button>
            <button type="submit" class="btn-confirm" :disabled="submitting">{{ isEditing ? '保存' : '提交' }}</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 回复对话框 -->
    <div v-if="showReplyDialog" class="dialog-overlay" @click="showReplyDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>回复反馈</h3>
          <button class="close-btn" @click="showReplyDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>回复内容</label>
            <textarea v-model="replyContent" placeholder="请输入回复内容" rows="4"></textarea>
          </div>
          <div class="dialog-footer">
            <button type="button" class="btn-cancel" @click="showReplyDialog = false">取消</button>
            <button type="button" class="btn-confirm" @click="saveReply" :disabled="submitting">保存</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 更新状态对话框 -->
    <div v-if="showStatusDialog" class="dialog-overlay" @click="showStatusDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>更新状态</h3>
          <button class="close-btn" @click="showStatusDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>状态</label>
            <select v-model="editStatus">
              <option value="待处理">待处理</option>
              <option value="处理中">处理中</option>
              <option value="已处理">已处理</option>
            </select>
        </div>
        <div class="dialog-footer">
            <button type="button" class="btn-cancel" @click="showStatusDialog = false">取消</button>
            <button type="button" class="btn-confirm" @click="saveStatus" :disabled="submitting">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getFeedbackList, addFeedback, updateFeedback, removeFeedback } from '@/api/feedback'
import { getTrainingList } from '@/api/training'
import type { UserFeedback } from '@/api/feedback'

const authStore = useAuthStore()

const tabs = [
  { label: '全部反馈', value: '' },
  { label: '课程评价', value: '课程评价' },
  { label: '系统建议', value: '系统建议' },
  { label: '问题反馈', value: '问题反馈' }
]

const activeTab = ref('')
const keyword = ref('')
const page = ref(1)
const limit = 10
const total = ref(0)
const feedbacks = ref<UserFeedback[]>([])
const loading = ref(false)
const selectedIds = ref<number[]>([])

const showSubmitDialog = ref(false)
const showReplyDialog = ref(false)
const showStatusDialog = ref(false)
const submitting = ref(false)
const replyContent = ref('')
const editStatus = ref('')
const currentFeedback = ref<UserFeedback | null>(null)
const trainingList = ref<any[]>([])

// editing support
const isEditing = ref(false)

const form = ref<UserFeedback>({
  title: '',
  content: '',
  rating: 0,
  feedbackType: '系统建议',
  relateId: undefined,
  relateName: ''
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))
const canManage = computed(() => authStore.hasPermission('feedback:manage') || (authStore.userType || 0) === 1)

function formatTime(t?: string) {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 19)
}

function getStars(r: number) {
  return '⭐'.repeat(Math.min(5, Math.max(0, r))) + '☆'.repeat(5 - Math.min(5, Math.max(0, r)))
}

function getStatusClass(s: string) {
  if (s === '已处理') return 'done'
  if (s === '处理中') return 'doing'
  return 'pending'
}

async function loadList() {
  loading.value = true
  try {
    const res = await getFeedbackList({
      page: page.value,
      limit,
      feedbackType: activeTab.value || undefined,
      keyword: keyword.value.trim() || undefined
    })
    feedbacks.value = res.data || []
    total.value = res.count || 0
  } catch {
    feedbacks.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    loadList()
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
    loadList()
  }
}

function openSubmitDialog() {
  if (!authStore.isLoggedIn) {
    alert('请先登录')
    return
  }
  isEditing.value = false
  form.value = { title: '', content: '', rating: 0, feedbackType: '系统建议' }
  loadTrainingList()
  showSubmitDialog.value = true
}

function openEditDialog(fb: UserFeedback) {
  if (!authStore.isLoggedIn) {
    alert('请先登录')
    return
  }
  isEditing.value = true
  currentFeedback.value = fb
  // copy the editable fields
  form.value = {
    id: fb.id,
    title: fb.title || '',
    content: fb.content || '',
    rating: fb.rating || 0,
    feedbackType: fb.feedbackType || '系统建议',
    relateId: fb.relateId,
    relateName: fb.relateName
  }
  loadTrainingList()
  showSubmitDialog.value = true
}

async function loadTrainingList() {
  try {
    const res = await getTrainingList({ page: 1, limit: 200 })
    trainingList.value = Array.isArray(res.data) ? res.data : (res as any).list || []
  } catch {
    trainingList.value = []
  }
}

async function submitFeedback() {
  submitting.value = true
  try {
    const rel = trainingList.value.find(t => t.id === form.value.relateId)
    const base: UserFeedback = {
      ...form.value,
      userName: authStore.nickname || authStore.userPhone || '',
      relateName: rel?.trainingName || rel?.training_name || ''
    }

    let res: any
    if (isEditing.value && form.value.id) {
      // editing existing feedback
      res = await updateFeedback(base)
    } else {
      res = await addFeedback(base)
    }

    if (res?.code === 200 || res?.code === 0) {
      showSubmitDialog.value = false
      loadList()
    } else {
      alert(res?.msg || (isEditing.value ? '保存失败' : '提交失败'))
    }
  } catch (e: any) {
    alert(e?.message || (isEditing.value ? '保存失败' : '提交失败'))
  } finally {
    submitting.value = false
  }
}

function openReplyDialog(fb: UserFeedback) {
  currentFeedback.value = fb
  replyContent.value = fb.replyContent || ''
  showReplyDialog.value = true
}

async function saveReply() {
  if (!currentFeedback.value?.id) return
  submitting.value = true
  try {
    const res = await updateFeedback({ id: currentFeedback.value.id, replyContent: replyContent.value })
    if (res?.code === 200 || res?.code === 0) {
      showReplyDialog.value = false
      loadList()
    } else {
      alert(res?.msg || '保存失败')
    }
  } catch (e: any) {
    alert(e?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

function openStatusDialog(fb: UserFeedback) {
  currentFeedback.value = fb
  editStatus.value = fb.status || '待处理'
  showStatusDialog.value = true
}

async function saveStatus() {
  if (!currentFeedback.value?.id) return
  submitting.value = true
  try {
    const res = await updateFeedback({ id: currentFeedback.value.id, status: editStatus.value })
    if (res?.code === 200 || res?.code === 0) {
      showStatusDialog.value = false
      loadList()
    } else {
      alert(res?.msg || '保存失败')
    }
  } catch (e: any) {
    alert(e?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(fb: UserFeedback) {
  if (!confirm('确定删除该反馈吗？')) return
  try {
    const res = await removeFeedback(fb.id!)
    if (res?.code === 200 || res?.code === 0) {
      loadList()
    } else {
      alert(res?.msg || '删除失败')
    }
  } catch (e: any) {
    alert(e?.message || '删除失败')
  }
}

function canEditItem(fb: UserFeedback) {
  // managers can always edit; owners can edit before processing
  if (canManage.value) return true
  const phone = authStore.userPhone
  if (phone && fb.userId === phone) {
    return !fb.status || fb.status === '待处理'
  }
  return false
}

function canDeleteItem(fb: UserFeedback) {
  if (canManage.value) return true
  const phone = authStore.userPhone
  return phone && fb.userId === phone
}

function handleExport() {
  const fields = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: '标题' },
    { key: 'content', label: '内容' },
    { key: 'userName', label: '反馈人' },
    { key: 'createTime', label: '反馈时间' },
    { key: 'rating', label: '评分' },
    { key: 'feedbackType', label: '类型' },
    { key: 'relateName', label: '关联' },
    { key: 'status', label: '状态' },
    { key: 'replyContent', label: '回复' }
  ]
  let csv = '\uFEFF' + fields.map(f => f.label).join(',') + '\n'
  feedbacks.value.forEach(item => {
    const row = fields.map(f => {
      let v = (item as any)[f.key] ?? ''
      if (String(v).includes(',') || String(v).includes('\n')) v = `"${String(v).replace(/"/g, '""')}"`
      return v
    })
    csv += row.join(',') + '\n'
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `反馈评价_${new Date().getTime()}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

onMounted(loadList)
</script>

<style scoped>
.feedback-page { max-width: 100%; }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.action-buttons { display: flex; gap: 8px; flex-wrap: wrap; }

.btn-action { padding: 8px 16px; background: white; color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; font-size: 13px; }
.btn-action:hover { background: var(--primary-color); color: white; border-color: var(--primary-color); }

.page-title { font-size: 26px; font-weight: 500; color: var(--text-primary); }

.btn-primary { padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.btn-primary:hover { background: #66b1ff; }

.feedback-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.tab-btn { padding: 8px 16px; border: 1px solid var(--border-color); background: white; border-radius: 6px; cursor: pointer; font-size: 14px; }
.tab-btn:hover { border-color: var(--primary-color); color: var(--primary-color); }
.tab-btn.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }

.search-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.search-input { flex: 1; max-width: 300px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; }
.btn-search { padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; }

.feedback-list { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid var(--border-color); }
.empty-state, .loading-state { padding: 48px; text-align: center; color: var(--text-secondary); }

.feedback-item { padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; gap: 12px; align-items: flex-start; }
.feedback-item:last-child { border-bottom: none; }
.feedback-checkbox { padding-top: 2px; flex-shrink: 0; }
.feedback-content-wrapper { flex: 1; }

.feedback-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
.feedback-user { display: flex; align-items: center; gap: 12px; }
.user-avatar { font-size: 20px; }
.user-name { font-weight: 600; color: var(--text-primary); }
.feedback-time { font-size: 12px; color: var(--text-secondary); }
.feedback-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.type-tag { padding: 2px 8px; background: #ecf5ff; color: var(--primary-color); border-radius: 4px; font-size: 12px; }
.status-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.status-tag.pending { background: #fff7e6; color: #fa8c16; }
.status-tag.doing { background: #e6f7ff; color: #1890ff; }
.status-tag.done { background: #f6ffed; color: #52c41a; }
.stars { font-size: 14px; }

.feedback-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.feedback-content-text { color: var(--text-regular); line-height: 1.6; margin-bottom: 8px; }
.feedback-relate { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
.feedback-reply { margin-top: 12px; padding: 12px; background: #f7f9fc; border-radius: 6px; border-left: 3px solid var(--primary-color); }
.reply-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
.reply-content { color: var(--text-regular); }
.reply-time { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }

.feedback-actions { margin-top: 12px; display: flex; gap: 8px; }
.btn-sm { padding: 4px 12px; font-size: 12px; border: 1px solid var(--border-color); background: white; border-radius: 4px; cursor: pointer; }
.btn-sm:hover { border-color: var(--primary-color); color: var(--primary-color); }
.btn-sm.danger:hover { border-color: #f5222d; color: #f5222d; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px; }
.page-btn { padding: 8px 16px; border: 1px solid var(--border-color); background: white; border-radius: 6px; cursor: pointer; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { color: var(--text-secondary); font-size: 14px; }

.dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.dialog { background: white; border-radius: 12px; width: 90%; max-width: 500px; max-height: 90vh; overflow: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
.dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.dialog-header h3 { margin: 0; font-size: 18px; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); }
.dialog-body { padding: 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 14px; color: var(--text-regular); }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px; }
.rating-select { display: flex; gap: 4px; }
.star-btn { padding: 4px; font-size: 24px; background: none; border: none; cursor: pointer; }
.star-btn.active { }
.dialog-footer { display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border-color); margin-top: 16px; }
.btn-cancel { padding: 10px 20px; background: white; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; }
.btn-confirm { padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; }
.btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .feedback-header { flex-direction: column; align-items: flex-start; }
}
</style>
