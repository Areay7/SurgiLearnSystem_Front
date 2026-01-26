<template>
  <div class="forum-page">
    <div class="page-header">
      <h1 class="page-title">讨论论坛</h1>
      <div class="header-actions">
        <div class="action-buttons">
          <button class="btn-action" @click="handlePrintAll">打印全部</button>
          <button class="btn-action" @click="handlePrintSelected">打印勾选</button>
          <button class="btn-action" @click="handleExportCurrentPage">导出当前页Excel</button>
          <button class="btn-action" @click="handleExportAll">导出Excel</button>
        </div>
        <button class="btn-primary" @click="openPublishDialog">发布新话题</button>
        <button class="btn-action" @click="handleDelete" v-if="selectedTopics.length > 0">删除选中</button>
      </div>
    </div>
    
    <div class="forum-content">
      <!-- 话题统计扇形图 -->
      <div class="statistics-chart">
        <h3 class="chart-title">话题分类统计</h3>
        <div class="chart-container">
          <div class="chart-wrapper">
            <svg class="pie-chart" viewBox="0 0 200 200">
              <g transform="translate(100, 100)">
                <!-- 护理技巧 -->
                <path
                  :d="getPiePath(0, (categoryStats.护理技巧 / totalTopics) * 360)"
                  fill="#409eff"
                  stroke="white"
                  stroke-width="2"
                />
                <!-- 案例分析 -->
                <path
                  :d="getPiePath(
                    (categoryStats.护理技巧 / totalTopics) * 360,
                    (categoryStats.案例分析 / totalTopics) * 360
                  )"
                  fill="#67c23a"
                  stroke="white"
                  stroke-width="2"
                />
                <!-- 经验分享 -->
                <path
                  :d="getPiePath(
                    ((categoryStats.护理技巧 + categoryStats.案例分析) / totalTopics) * 360,
                    (categoryStats.经验分享 / totalTopics) * 360
                  )"
                  fill="#e6a23c"
                  stroke="white"
                  stroke-width="2"
                />
                <!-- 其他 -->
                <path
                  :d="getPiePath(
                    ((categoryStats.护理技巧 + categoryStats.案例分析 + categoryStats.经验分享) / totalTopics) * 360,
                    (categoryStats.其他 / totalTopics) * 360
                  )"
                  fill="#f56c6c"
                  stroke="white"
                  stroke-width="2"
                />
              </g>
            </svg>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color" style="background: #409eff;"></span>
              <span>护理技巧 ({{ categoryStats.护理技巧 }})</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #67c23a;"></span>
              <span>案例分析 ({{ categoryStats.案例分析 }})</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #e6a23c;"></span>
              <span>经验分享 ({{ categoryStats.经验分享 }})</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #f56c6c;"></span>
              <span>其他 ({{ categoryStats.其他 }})</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 搜索表单 -->
      <div class="search-form">
        <div class="form-row">
          <div class="form-item">
            <label>讨论标题：</label>
            <input 
              type="text" 
              placeholder="请输入讨论标题" 
              class="form-input" 
              v-model="searchForm.forumTitle" 
            />
          </div>
          <div class="form-item">
            <label>发帖者名称：</label>
            <input 
              type="text" 
              placeholder="请输入发帖者名称" 
              class="form-input" 
              v-model="searchForm.posterId" 
            />
          </div>
          <div class="form-item">
            <label>发布时间：</label>
            <input 
              type="date" 
              class="form-input" 
              v-model="searchForm.postTime" 
            />
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
                  :checked="selectedTopics.length === topics.length && topics.length > 0"
                />
              </th>
              <th width="60">序号</th>
              <th width="100">操作</th>
              <th width="100">讨论ID</th>
              <th width="200">论坛标题</th>
              <th width="120">发帖者ID</th>
              <th width="180">发布时间</th>
              <th>讨论内容</th>
              <th width="150">回复数量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="topics.length === 0">
              <td colspan="9" class="empty-state">
                <p>暂无数据</p>
              </td>
            </tr>
            <tr v-for="(topic, index) in topics" :key="topic.id || index" class="table-row">
              <td>
                <input 
                  type="checkbox" 
                  :value="topic.id"
              v-model="selectedTopics"
            />
              </td>
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>
                <button class="btn-link" @click="handleEdit(topic)">编辑</button>
                <button class="btn-link btn-danger" @click="handleDeleteSingle(topic)">删除</button>
              </td>
              <td>{{ topic.discussionId || topic.id || '-' }}</td>
              <td>
                <span v-if="topic.isSticky === 1" class="sticky-badge">置顶</span>
                <span v-if="topic.isLocked === 1" class="locked-badge">锁定</span>
                {{ topic.forumTitle }}
              </td>
              <td>{{ getUserDisplayName(topic.posterId) }}</td>
              <td>{{ formatDateTime(topic.postTime) }}</td>
              <td class="content-cell">{{ topic.content }}</td>
              <td>
                {{ topic.replyCount || 0 }}
                <button class="btn-link btn-enter" @click="enterDiscussion(topic)">进入讨论</button>
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
    
    <!-- 发布新话题对话框 -->
    <div v-if="showPublishDialog" class="export-dialog-overlay" @click="showPublishDialog = false">
      <div class="export-dialog" @click.stop>
        <div class="dialog-header">
          <h3>发布新话题</h3>
          <button class="close-btn" @click="showPublishDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>话题标题 *</label>
            <input
              v-model="publishForm.forumTitle"
              type="text"
              placeholder="请输入话题标题"
              class="form-input"
              maxlength="300"
            />
          </div>
          <div class="form-group">
            <label>分类 *</label>
            <select v-model="publishForm.categoryId" class="form-input">
              <option value="">请选择分类</option>
              <option value="C001">护理技巧</option>
              <option value="C002">案例分析</option>
              <option value="C003">经验分享</option>
            </select>
          </div>
          <div class="form-group">
            <label>话题内容 *</label>
            <textarea
              v-model="publishForm.content"
              placeholder="请输入话题内容"
              class="form-textarea"
              rows="6"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showPublishDialog = false">取消</button>
          <button class="btn-confirm" @click="handlePublish">发布</button>
        </div>
        </div>
      </div>
      
    <!-- 编辑话题对话框 -->
    <div v-if="showEditDialog" class="export-dialog-overlay" @click="showEditDialog = false">
      <div class="export-dialog edit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>编辑话题</h3>
          <button class="close-btn" @click="showEditDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="edit-form-grid">
            <div class="form-column">
              <div class="form-group">
                <label>讨论ID：</label>
                <input
                  type="text"
                  :value="editForm.discussionId || editForm.id || '-'"
                  class="form-input"
                  disabled
                />
              </div>
              <div class="form-group">
                <label>论坛标题 *</label>
                <input
                  v-model="editForm.forumTitle"
                  type="text"
                  placeholder="请输入论坛标题"
                  class="form-input"
                  maxlength="300"
                />
              </div>
              <div class="form-group">
                <label>发帖者ID *</label>
                <input
                  v-model="editForm.posterId"
                  type="text"
                  placeholder="请输入发帖者ID"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label>发布时间 *</label>
                <input
                  v-model="editForm.postTime"
                  type="datetime-local"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label>讨论内容 *</label>
                <textarea
                  v-model="editForm.content"
                  placeholder="请输入讨论内容"
                  class="form-textarea"
                  rows="6"
                ></textarea>
              </div>
              <div class="form-group">
                <label>回复数量</label>
                <input
                  v-model.number="editForm.replyCount"
                  type="number"
                  min="0"
                  class="form-input"
                  placeholder="0"
                />
              </div>
            </div>
            <div class="form-column">
              <div class="form-group">
                <label>点赞数量</label>
                <input
                  v-model.number="editForm.likeCount"
                  type="number"
                  min="0"
                  class="form-input"
                  placeholder="0"
                />
              </div>
              <div class="form-group">
                <label>是否置顶</label>
                <select v-model.number="editForm.isSticky" class="form-input">
                  <option :value="0">否</option>
                  <option :value="1">是</option>
                </select>
              </div>
              <div class="form-group">
                <label>是否锁定</label>
                <select v-model.number="editForm.isLocked" class="form-input">
                  <option :value="0">否</option>
                  <option :value="1">是</option>
                </select>
              </div>
              <div class="form-group">
                <label>最后回复ID</label>
                <input
                  v-model="editForm.lastReplyId"
                  type="text"
                  placeholder="请输入最后回复ID"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label>最后回复时间</label>
                <input
                  v-model="editForm.lastReplyTime"
                  type="datetime-local"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label>分类ID *</label>
                <select v-model="editForm.categoryId" class="form-input">
                  <option value="">请选择分类</option>
                  <option value="C001">护理技巧</option>
                  <option value="C002">案例分析</option>
                  <option value="C003">经验分享</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showEditDialog = false">取消</button>
          <button class="btn-confirm" @click="handleSaveEdit">保存</button>
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
import { ref, computed, onMounted, watch } from 'vue'
import { getForumList, getCategoryStats, addForum, updateForum, deleteForum, type DiscussionForum } from '@/api/forum'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { batchUserInfo } from '@/api/auth'

const authStore = useAuthStore()
const router = useRouter()

// 搜索表单
const searchForm = ref({
  forumTitle: '',
  posterId: '',
  postTime: ''
})

// 分页
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(1)
const total = ref(0)
const loading = ref(false)

// 选中的话题（存储ID）
const selectedTopics = ref<(number | string)[]>([])

// 导出对话框
const showExportDialog = ref(false)
const exportType = ref<'current' | 'all'>('current')
const selectedExportFields = ref<string[]>([])

// 发布新话题对话框
const showPublishDialog = ref(false)
const publishForm = ref<DiscussionForum>({
  forumTitle: '',
  content: '',
  categoryId: '',
  posterId: authStore.userPhone || ''
})

// 编辑话题对话框
const showEditDialog = ref(false)
const editForm = ref<DiscussionForum>({
  id: undefined,
  discussionId: undefined,
  forumTitle: '',
  posterId: '',
  postTime: '',
  content: '',
  replyCount: 0,
  likeCount: 0,
  isSticky: 0,
  isLocked: 0,
  lastReplyId: '',
  lastReplyTime: '',
  categoryId: ''
})

// 导出字段配置
const exportFields = [
  { key: 'discussionId', label: '讨论ID' },
  { key: 'forumTitle', label: '论坛标题' },
  { key: 'posterId', label: '发帖者ID' },
  { key: 'postTime', label: '发布时间' },
  { key: 'content', label: '讨论内容' },
  { key: 'replyCount', label: '回复数量' },
  { key: 'likeCount', label: '点赞数量' },
  { key: 'isSticky', label: '是否置顶' },
  { key: 'isLocked', label: '是否锁定' },
  { key: 'lastReplyId', label: '最后回复ID' },
  { key: 'lastReplyTime', label: '最后回复时间' },
  { key: 'categoryId', label: '分类ID' }
]

// 话题数据
const topics = ref<DiscussionForum[]>([])
// 话题分类统计
const categoryStats = ref<Record<string, number>>({
  护理技巧: 0,
  案例分析: 0,
  经验分享: 0,
  其他: 0
})
// 用户昵称映射表
const userDisplayNames = ref<Record<string, string>>({})

const totalTopics = computed(() => {
  return Object.values(categoryStats.value).reduce((sum, val) => sum + val, 0)
})

// 加载数据
const loadForumList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize
    }
    
    // 搜索条件
    if (searchForm.value.forumTitle?.trim()) {
      params.forumTitle = searchForm.value.forumTitle.trim()
    }
    
    if (searchForm.value.posterId?.trim()) {
      params.posterId = searchForm.value.posterId.trim()
    }
    
    if (searchForm.value.postTime) {
      params.postTime = searchForm.value.postTime
    }
    
    const response = await getForumList(params)
    
    console.log('论坛列表响应:', response)
    
    if (response.code === 200 || response.code === 0) {
      // 后端返回的是ResultTable格式：{ code, msg, count, data }
      topics.value = (response.data || []) as DiscussionForum[]
      total.value = response.count || 0
      totalPages.value = Math.ceil(total.value / pageSize)
      
      // 批量获取用户昵称
      await loadUserDisplayNames()
      
      console.log('加载的话题数量:', topics.value.length, '总数:', total.value)
    } else {
      console.error('获取列表失败:', response.msg)
      alert('加载数据失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    console.error('加载论坛列表失败:', error)
    alert('加载数据失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 加载分类统计
const loadCategoryStats = async () => {
  try {
    const response = await getCategoryStats()
    if (response.code === 200 || response.code === 0) {
      if (response.data) {
        categoryStats.value = {
          护理技巧: response.data['护理技巧'] || 0,
          案例分析: response.data['案例分析'] || 0,
          经验分享: response.data['经验分享'] || 0,
          其他: response.data['其他'] || 0
        }
      }
    }
  } catch (error: any) {
    console.error('加载分类统计失败:', error)
  }
}

// 格式化时间（相对时间）
const formatTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

// 格式化日期时间（完整格式）
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

// 获取分类名称
const getCategoryName = (categoryId?: string) => {
  const categoryMap: Record<string, string> = {
    'C001': '护理技巧',
    'C002': '案例分析',
    'C003': '经验分享'
  }
  return categoryMap[categoryId || ''] || '其他'
}

// 批量加载用户显示名称（昵称或ID）
const loadUserDisplayNames = async () => {
  // 收集所有需要查询的用户ID
  const userIds = new Set<string>()
  topics.value.forEach(topic => {
    if (topic.posterId) {
      userIds.add(topic.posterId)
    }
  })
  
  if (userIds.size === 0) return
  
  try {
    const response = await batchUserInfo(Array.from(userIds))
    if (response.code === 200 || response.code === 0 && response.data) {
      // 更新用户显示名称映射表
      Object.assign(userDisplayNames.value, response.data)
    }
  } catch (error: any) {
    console.error('获取用户昵称失败:', error)
  }
}

// 获取用户显示名称（优先昵称，否则ID）
const getUserDisplayName = (userId?: string) => {
  if (!userId) return '匿名'
  return userDisplayNames.value[userId] || userId
}

// 查询按钮
const handleSearch = () => {
  currentPage.value = 1
  loadForumList()
}

// 重置按钮
const handleReset = () => {
  searchForm.value = {
    forumTitle: '',
    posterId: '',
    postTime: ''
  }
  currentPage.value = 1
  loadForumList()
}

// 全选/取消全选
const handleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    selectedTopics.value = topics.value.map(t => t.id || t.discussionId).filter(Boolean) as (number | string)[]
  } else {
    selectedTopics.value = []
  }
}

// 编辑单个话题
const handleEdit = (topic: DiscussionForum) => {
  // 将话题数据复制到编辑表单
  editForm.value = {
    id: topic.id,
    discussionId: topic.discussionId,
    forumTitle: topic.forumTitle || '',
    posterId: topic.posterId || '',
    postTime: formatDateTimeForInput(topic.postTime),
    content: topic.content || '',
    replyCount: topic.replyCount || 0,
    likeCount: topic.likeCount || 0,
    isSticky: topic.isSticky || 0,
    isLocked: topic.isLocked || 0,
    lastReplyId: topic.lastReplyId || '',
    lastReplyTime: formatDateTimeForInput(topic.lastReplyTime),
    categoryId: topic.categoryId || ''
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
  // 验证必填字段
  if (!editForm.value.forumTitle?.trim()) {
    alert('请输入论坛标题')
    return
  }
  if (!editForm.value.posterId?.trim()) {
    alert('请输入发帖者ID')
    return
  }
  if (!editForm.value.postTime) {
    alert('请选择发布时间')
    return
  }
  if (!editForm.value.content?.trim()) {
    alert('请输入讨论内容')
    return
  }
  if (!editForm.value.categoryId) {
    alert('请选择分类')
    return
  }
  
  try {
    // 转换日期时间格式为后端需要的格式
    const postTime = editForm.value.postTime ? convertDateTimeLocalToISO(editForm.value.postTime) : undefined
    const lastReplyTime = editForm.value.lastReplyTime ? convertDateTimeLocalToISO(editForm.value.lastReplyTime) : undefined
    
    const updateData: DiscussionForum = {
      id: editForm.value.id,
      discussionId: editForm.value.discussionId,
      forumTitle: editForm.value.forumTitle.trim(),
      posterId: editForm.value.posterId.trim(),
      postTime: postTime,
      content: editForm.value.content.trim(),
      replyCount: editForm.value.replyCount || 0,
      likeCount: editForm.value.likeCount || 0,
      isSticky: editForm.value.isSticky || 0,
      isLocked: editForm.value.isLocked || 0,
      lastReplyId: editForm.value.lastReplyId?.trim() || undefined,
      lastReplyTime: lastReplyTime,
      categoryId: editForm.value.categoryId
    }
    
    const response = await updateForum(updateData)
    
    if (response.code === 200 || response.code === 0) {
      alert('保存成功')
      showEditDialog.value = false
      loadForumList()
      loadCategoryStats()
    } else {
      alert('保存失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    alert('保存失败：' + (error.message || '未知错误'))
  }
}

// 将datetime-local格式转换为ISO格式
const convertDateTimeLocalToISO = (dateTimeLocal: string) => {
  if (!dateTimeLocal) return undefined
  // datetime-local格式: YYYY-MM-DDTHH:mm
  // 需要转换为: YYYY-MM-DD HH:mm:ss
  const [datePart, timePart] = dateTimeLocal.split('T')
  const time = timePart || '00:00'
  return `${datePart} ${time}:00`
}

// 进入讨论
const enterDiscussion = (topic: DiscussionForum) => {
  const topicId = topic.id || topic.discussionId
  if (topicId) {
    router.push({
      name: 'ForumDetail',
      params: { id: topicId }
    })
  } else {
    alert('无法获取话题ID')
  }
}

// 删除单个话题
const handleDeleteSingle = async (topic: DiscussionForum) => {
  if (!confirm(`确定要删除话题"${topic.forumTitle}"吗？`)) {
    return
  }
  
  try {
    const id = topic.id || topic.discussionId
    if (!id) {
      alert('无法获取话题ID')
      return
    }
    const response = await deleteForum(String(id))
    
    if (response.code === 200 || response.code === 0) {
      alert('删除成功')
      loadForumList()
      loadCategoryStats()
    } else {
      alert('删除失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    alert('删除失败：' + (error.message || '未知错误'))
  }
}

// 页面加载时获取数据
onMounted(() => {
  loadForumList()
  loadCategoryStats()
})

// 绘制扇形图路径
const getPiePath = (startAngle: number, angle: number) => {
  const radius = 80
  const start = (startAngle - 90) * (Math.PI / 180)
  const end = (startAngle + angle - 90) * (Math.PI / 180)
  
  const x1 = radius * Math.cos(start)
  const y1 = radius * Math.sin(start)
  const x2 = radius * Math.cos(end)
  const y2 = radius * Math.sin(end)
  
  const largeArc = angle > 180 ? 1 : 0
  
  return `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

// 分页功能
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadForumList()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadForumList()
  }
}

// 发布新话题
const openPublishDialog = () => {
  showPublishDialog.value = true
  publishForm.value = {
    forumTitle: '',
    content: '',
    categoryId: '',
    posterId: authStore.userPhone || ''
  }
}

const handlePublish = async () => {
  if (!publishForm.value.forumTitle?.trim()) {
    alert('请输入话题标题')
    return
  }
  if (!publishForm.value.content?.trim()) {
    alert('请输入话题内容')
    return
  }
  if (!publishForm.value.categoryId) {
    alert('请选择分类')
    return
  }
  
  try {
    // 不发送postTime，让后端自动设置当前时间
    const response = await addForum({
      forumTitle: publishForm.value.forumTitle.trim(),
      content: publishForm.value.content.trim(),
      categoryId: publishForm.value.categoryId,
      posterId: publishForm.value.posterId,
      // postTime 不发送，后端会自动设置为当前时间
      replyCount: 0,
      likeCount: 0,
      isSticky: 0,
      isLocked: 0
    })
    
    if (response.code === 200 || response.code === 0) {
      alert('发布成功')
      showPublishDialog.value = false
      loadForumList()
      loadCategoryStats()
    } else {
      alert('发布失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    alert('发布失败：' + (error.message || '未知错误'))
  }
}

// 删除选中话题
const handleDelete = async () => {
  if (selectedTopics.value.length === 0) {
    alert('请先选择要删除的话题')
    return
  }
  
  if (!confirm(`确定要删除选中的 ${selectedTopics.value.length} 个话题吗？`)) {
    return
  }
  
  try {
    const ids = selectedTopics.value.join(',')
    const response = await deleteForum(ids)
    
    if (response.code === 200 || response.code === 0) {
      alert('删除成功')
      selectedTopics.value = []
      loadForumList()
      loadCategoryStats()
    } else {
      alert('删除失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    alert('删除失败：' + (error.message || '未知错误'))
  }
}

// 打印功能
const handlePrintAll = () => {
  window.print()
}

const handlePrintSelected = () => {
  if (selectedTopics.value.length === 0) {
    alert('请先选择要打印的话题')
    return
  }
  alert(`准备打印 ${selectedTopics.value.length} 个话题`)
  // 实际打印逻辑可以在这里实现
}

// 导出Excel功能
const handleExportCurrentPage = () => {
  exportType.value = 'current'
  // 默认选中所有字段
  selectedExportFields.value = exportFields.map(f => f.key)
  showExportDialog.value = true
}

const handleExportAll = () => {
  exportType.value = 'all'
  // 默认选中所有字段
  selectedExportFields.value = exportFields.map(f => f.key)
  showExportDialog.value = true
}

// 确认导出
const confirmExport = () => {
  if (selectedExportFields.value.length === 0) {
    alert('请至少选择一个导出字段')
    return
  }
  
  // 获取要导出的数据
  const dataToExport = exportType.value === 'current' 
    ? topics.value 
    : topics.value // 这里应该是全部数据，暂时用当前数据
  
  // 导出为CSV
  exportToCSV(dataToExport, selectedExportFields.value)
  showExportDialog.value = false
}

// 导出为CSV
const exportToCSV = (data: any[], fields: string[]) => {
  // 获取字段标签
  const headers = fields.map(key => {
    const field = exportFields.find(f => f.key === key)
    return field ? field.label : key
  })
  
  // 构建CSV内容
  let csvContent = '\uFEFF' // BOM，支持中文
  csvContent += headers.join(',') + '\n'
  
  // 添加数据行
  data.forEach(item => {
    const row = fields.map(key => {
      let value = item[key] ?? ''
      // 处理布尔值
      if (typeof value === 'boolean') {
        value = value ? '是' : '否'
      }
      // 处理包含逗号的值，需要加引号
      if (String(value).includes(',') || String(value).includes('\n')) {
        value = `"${String(value).replace(/"/g, '""')}"`
      }
      return value
    })
    csvContent += row.join(',') + '\n'
  })
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `论坛数据_${exportType.value === 'current' ? '当前页' : '全部'}_${new Date().getTime()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.forum-page {
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

.statistics-chart {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 26px;
  margin-bottom: 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.chart-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 22px;
  margin-top: 0;
  text-align: center;
  letter-spacing: -0.2px;
}

.chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
  width: 100%;
}

.chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.pie-chart {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
  display: block;
  margin: 0 auto;
}

.chart-legend {
  display: flex;
  flex-direction: row;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-regular);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
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

.btn-link.btn-enter {
  margin-left: 8px;
  color: var(--primary-color);
  font-weight: 500;
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
  font-weight: 400;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(91, 155, 213, 0.05);
  transform: translateY(-1px);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
  
  .chart-container {
    flex-direction: column;
    align-items: center;
  }
  
  .filter-bar {
    flex-direction: column;
  }
  
  .topic-footer {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .export-dialog {
    width: 95%;
    max-height: 90vh;
  }
  
  .field-options {
    grid-template-columns: 1fr;
  }
}

.empty-state,
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.sticky-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #f56c6c;
  color: white;
  border-radius: 3px;
  font-size: 11px;
  margin-right: 6px;
  font-weight: normal;
}

.locked-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #909399;
  color: white;
  border-radius: 3px;
  font-size: 11px;
  margin-right: 6px;
  font-weight: normal;
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
  min-height: 120px;
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

/* 编辑表单两列布局 */
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

@media (max-width: 1024px) {
  .edit-form-grid {
    grid-template-columns: 1fr;
  }
  
  .edit-dialog {
    max-width: 600px;
  }
}
</style>

