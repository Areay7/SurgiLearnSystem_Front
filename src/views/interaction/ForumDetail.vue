<template>
  <div class="forum-detail-page">
    <div class="page-header">
      <button class="btn-back" @click="goBack">← 返回列表</button>
      <h1 class="page-title">讨论详情</h1>
    </div>
    
    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>
    
    <div v-else-if="topic" class="forum-content">
      <!-- 话题详情 -->
      <div class="topic-detail">
        <div class="topic-header">
          <h2 class="topic-title">
            <span v-if="topic.isSticky === 1" class="sticky-badge">置顶</span>
            <span v-if="topic.isLocked === 1" class="locked-badge">锁定</span>
            {{ topic.forumTitle }}
          </h2>
          <div class="topic-meta">
            <span class="meta-item">发布者：{{ getUserDisplayName(topic.posterId) }}</span>
            <span class="meta-item">发布时间：{{ formatDateTime(topic.postTime) }}</span>
            <span class="meta-item">分类：{{ getCategoryName(topic.categoryId) }}</span>
            <span class="meta-item">回复数：{{ topic.replyCount || 0 }}</span>
            <span class="meta-item">
              <button class="btn-like-topic" @click="likeTopic">
                👍 点赞话题 ({{ topic.likeCount || 0 }})
              </button>
            </span>
          </div>
        </div>
        <div class="topic-body">
          <div class="topic-content">{{ topic.content }}</div>
        </div>
      </div>
      
      <!-- 回复列表 -->
      <div class="replies-section">
        <div class="section-header">
          <h3>回复 ({{ replies.length }})</h3>
          <button 
            class="btn-primary" 
            @click="showReplyDialog = true"
            :disabled="topic.isLocked === 1"
          >
            {{ topic.isLocked === 1 ? '话题已锁定' : '发表回复' }}
          </button>
        </div>
        
        <div v-if="replies.length === 0" class="empty-replies">
          <p>暂无回复，快来发表第一个回复吧！</p>
        </div>
        
        <div v-else class="replies-list">
          <div 
            v-for="reply in replies" 
            :key="reply.id" 
            class="reply-item"
          >
            <div class="reply-header">
              <span class="reply-author">{{ getUserDisplayName(reply.replierId) }}</span>
              <span class="reply-time">{{ formatDateTime(reply.replyTime) }}</span>
            </div>
            <div class="reply-content">{{ reply.content }}</div>
            <div class="reply-footer">
              <button class="btn-like-reply" @click="likeReply(reply)">
                👍 点赞 ({{ reply.likeCount || 0 }})
              </button>
            </div>
          </div>
        </div>
        
        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            class="page-btn" 
            @click="prevPage" 
            :disabled="currentPage === 1 || loading"
          >
            上一页
          </button>
          <span class="page-info">
            第 {{ currentPage }} 页，共 {{ totalPages }} 页（共 {{ total }} 条）
          </span>
          <button 
            class="page-btn" 
            @click="nextPage" 
            :disabled="currentPage === totalPages || loading"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
    
    <!-- 发表回复对话框 -->
    <div v-if="showReplyDialog" class="export-dialog-overlay" @click="showReplyDialog = false">
      <div class="export-dialog" @click.stop>
        <div class="dialog-header">
          <h3>发表回复</h3>
          <button class="close-btn" @click="showReplyDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>回复内容 *</label>
            <textarea
              v-model="replyForm.content"
              placeholder="请输入回复内容"
              class="form-textarea"
              rows="6"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showReplyDialog = false">取消</button>
          <button class="btn-confirm" @click="handleSubmitReply">发表</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getForumDetail, likeForum } from '@/api/forum'
import { getReplyList, addReply, likeReply as likeReplyApi, type ForumReply } from '@/api/reply'
import { useAuthStore } from '@/stores/auth'
import { batchUserInfo } from '@/api/auth'
import type { DiscussionForum } from '@/api/forum'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const topic = ref<DiscussionForum | null>(null)
const replies = ref<ForumReply[]>([])
const showReplyDialog = ref(false)
// 用户昵称映射表
const userDisplayNames = ref<Record<string, string>>({})

// 分页
const currentPage = ref(1)
const pageSize = 20
const totalPages = ref(1)
const total = ref(0)

// 回复表单
const replyForm = ref({
  content: ''
})

// 加载话题详情
const loadTopicDetail = async () => {
  const topicId = route.params.id as string
  if (!topicId) {
    alert('话题ID不存在')
    router.push('/forum')
    return
  }
  
  loading.value = true
  try {
    const response = await getForumDetail(Number(topicId))
    if (response.code === 200 || response.code === 0) {
      topic.value = response.data as DiscussionForum
      // 加载用户显示名称
      await loadUserDisplayNames()
    } else {
      alert('加载话题失败：' + (response.msg || '未知错误'))
      router.push('/forum')
    }
  } catch (error: any) {
    alert('加载话题失败：' + (error.message || '未知错误'))
    router.push('/forum')
  } finally {
    loading.value = false
  }
}

// 加载回复列表
const loadReplies = async () => {
  if (!topic.value) return
  
  loading.value = true
  try {
    const response = await getReplyList({
      forumId: topic.value.id || topic.value.discussionId,
      page: currentPage.value,
      limit: pageSize
    })
    
    if (response.code === 200 || response.code === 0) {
      replies.value = (response.data || []) as ForumReply[]
      total.value = response.count || 0
      totalPages.value = Math.ceil(total.value / pageSize)
      
      // 加载用户显示名称
      await loadUserDisplayNames()
    }
  } catch (error: any) {
    console.error('加载回复列表失败:', error)
  } finally {
    loading.value = false
  }
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
  
  // 添加话题发布者
  if (topic.value?.posterId) {
    userIds.add(topic.value.posterId)
  }
  
  // 添加所有回复者
  replies.value.forEach(reply => {
    if (reply.replierId) {
      userIds.add(reply.replierId)
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

// 发表回复
const handleSubmitReply = async () => {
  if (!replyForm.value.content?.trim()) {
    alert('请输入回复内容')
    return
  }
  
  if (!topic.value) {
    alert('话题不存在')
    return
  }
  
  try {
    const response = await addReply({
      forumId: topic.value.id || topic.value.discussionId,
      replierId: authStore.userPhone || '',
      content: replyForm.value.content.trim(),
      likeCount: 0
    })
    
    if (response.code === 200 || response.code === 0) {
      alert('回复成功')
      showReplyDialog.value = false
      replyForm.value.content = ''
      // 重新加载回复列表和话题详情
      currentPage.value = 1
      loadReplies()
      loadTopicDetail()
    } else {
      alert('回复失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    alert('回复失败：' + (error.message || '未知错误'))
  }
}

// 点赞话题
const likeTopic = async () => {
  if (!topic.value) return
  
  const topicId = topic.value.id || topic.value.discussionId
  if (!topicId) {
    alert('无法获取话题ID')
    return
  }
  
  try {
    const response = await likeForum(topicId)
    if (response.code === 200 || response.code === 0) {
      // 更新本地数据
      if (topic.value) {
        topic.value.likeCount = (topic.value.likeCount || 0) + 1
      }
    } else {
      alert('点赞失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    console.error('点赞失败:', error)
    alert('点赞失败：' + (error.message || '未知错误'))
  }
}

// 点赞回复
const likeReply = async (reply: ForumReply) => {
  if (!reply.id) {
    alert('无法获取回复ID')
    return
  }
  
  try {
    const response = await likeReplyApi(reply.id)
    if (response.code === 200 || response.code === 0) {
      // 更新本地数据
      reply.likeCount = (reply.likeCount || 0) + 1
    } else {
      alert('点赞失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    console.error('点赞失败:', error)
    alert('点赞失败：' + (error.message || '未知错误'))
  }
}

// 分页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadReplies()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadReplies()
  }
}

// 返回列表
const goBack = () => {
  router.push('/forum')
}

// 页面加载
onMounted(async () => {
  await loadTopicDetail()
  await loadReplies()
})
</script>

<style scoped>
.forum-detail-page {
  max-width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.btn-back {
  padding: 8px 16px;
  background: var(--card-bg);
  color: var(--text-regular);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.25s ease;
}

.btn-back:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(91, 155, 213, 0.05);
}

.page-title {
  font-size: 26px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.topic-detail {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.topic-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.topic-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.topic-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 14px;
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
}

.topic-body {
  margin-top: 16px;
}

.topic-content {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-regular);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.replies-section {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.section-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reply-item {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: #fafafa;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.reply-author {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.reply-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.reply-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-regular);
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-bottom: 12px;
}

.reply-footer {
  display: flex;
  gap: 12px;
}

.empty-replies {
  text-align: center;
  padding: 40px 20px;
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

.loading-state {
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

.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  resize: vertical;
  min-height: 120px;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
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

.btn-cancel:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(91, 155, 213, 0.05);
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

.btn-confirm:hover {
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 155, 213, 0.3);
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
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 155, 213, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  padding: 4px 8px;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-like-topic {
  padding: 8px 16px;
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.btn-like-topic:hover {
  background: #ffeaa7;
  border-color: #fdcb6e;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.btn-like-topic:active {
  transform: translateY(0);
}

.btn-like-reply {
  padding: 6px 12px;
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.btn-like-reply:hover {
  background: #ffeaa7;
  border-color: #fdcb6e;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-like-reply:active {
  transform: translateY(0);
}
</style>
