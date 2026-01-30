<template>
  <div class="videos-page">
    <div class="page-header">
      <h1 class="page-title">视频讲座播放</h1>
      <button 
        v-if="canUpload" 
        class="btn-primary" 
        @click="openUploadDialog"
      >
        上传视频
      </button>
    </div>

    <div class="layout">
      <!-- 视频播放器 -->
      <div class="player card">
        <div v-if="currentVideo" class="player-container">
          <video
            ref="videoPlayer"
            :src="getVideoUrl(currentVideo.id)"
            controls
            class="video-player"
            @loadedmetadata="onVideoLoaded"
            @timeupdate="onTimeUpdate"
            @play="onPlay"
            @pause="onPause"
          ></video>
          
          <div class="player-info">
            <h3 class="player-title">{{ currentVideo.videoTitle }}</h3>
            <div class="player-meta">
              <span>上传者：{{ currentVideo.instructorName || '未知' }}</span>
              <span>·</span>
              <span>时长：{{ formatDuration(displayDuration) }}</span>
              <span>·</span>
              <span>观看：{{ currentVideo.viewCount || 0 }}次</span>
            </div>
            <div v-if="currentVideo.description" class="player-description">
              {{ currentVideo.description }}
            </div>
          </div>
        </div>
        <div v-else class="player-placeholder">
          <div class="play-icon">▶</div>
          <div class="placeholder-text">请选择视频播放</div>
        </div>
        
        <!-- 播放器控制栏 -->
        <div v-if="currentVideo" class="player-controls">
          <div class="control-group">
            <label class="control-label">倍速：</label>
            <select v-model="playbackRate" @change="onPlaybackRateChange" class="control-select">
              <option :value="0.5">0.5×</option>
              <option :value="0.75">0.75×</option>
              <option :value="1">1.0×</option>
              <option :value="1.25">1.25×</option>
              <option :value="1.5">1.5×</option>
              <option :value="2">2.0×</option>
            </select>
          </div>
          
          <div class="control-group">
            <label class="control-label">清晰度：</label>
            <select v-model="quality" @change="onQualityChange" class="control-select">
              <option value="auto">自动</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
            </select>
          </div>
          
          <div class="control-group">
            <label class="control-label">进度：</label>
            <input 
              type="range" 
              v-model="currentTime" 
              :max="duration" 
              :step="1"
              @input="onSeek"
              class="progress-slider"
            />
            <span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
          </div>
          
          <button 
            class="btn-favorite" 
            :class="{ favorited: currentVideo.isFavorited }"
            @click="toggleFavorite"
          >
            {{ currentVideo.isFavorited ? '★ 已收藏' : '☆ 收藏' }}
          </button>
        </div>
      </div>

      <!-- 视频列表 -->
      <div class="list card">
        <div class="list-head">
          <input 
            v-model="searchText" 
            @input="handleSearch"
            class="search-input" 
            placeholder="搜索视频..." 
          />
          <select v-model="selectedType" @change="handleTypeChange" class="select">
            <option value="">全部专题</option>
            <option v-for="type in videoTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
        
        <div class="list-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: listMode === 'all' }"
            @click="listMode = 'all'; loadVideoList()"
          >
            全部视频
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: listMode === 'favorites' }"
            @click="listMode = 'favorites'; loadFavorites()"
          >
            我的收藏
          </button>
        </div>
        
        <div class="items">
          <div v-if="loading" class="loading-state">加载中...</div>
          <div v-else-if="videos.length === 0" class="empty-state">暂无视频</div>
          <button
            v-else
            v-for="video in videos"
            :key="video.id"
            class="item"
            :class="{ active: currentVideo?.id === video.id }"
            @click="selectVideo(video)"
          >
            <div class="thumb">
              <img v-if="video.thumbnailUrl" :src="video.thumbnailUrl" alt="" />
              <span v-else>🎬</span>
            </div>
            <div class="info">
              <div class="title">{{ video.videoTitle }}</div>
              <div class="sub">
                上传者：{{ video.instructorName || '未知' }} · 
                {{ formatDuration(video.duration) }} · 
                观看{{ video.viewCount || 0 }}次
              </div>
              <div class="type-tag">{{ video.videoType || '未分类' }}</div>
            </div>
            <div v-if="video.isFavorited" class="favorite-mark">★</div>
          </button>
        </div>
        
        <div class="pagination">
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
    
    <!-- 上传视频对话框 -->
    <div v-if="showUploadDialog" class="dialog-overlay" @click="showUploadDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>上传视频</h3>
          <button class="close-btn" @click="showUploadDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>视频标题 *</label>
            <input
              v-model="uploadForm.videoTitle"
              type="text"
              placeholder="请输入视频标题"
              class="form-input"
              maxlength="200"
            />
          </div>
          <div class="form-group">
            <label>视频类型（专题） *</label>
            <select v-model="uploadForm.videoType" class="form-input">
              <option value="">请选择专题</option>
              <option v-for="type in videoTypes" :key="type" :value="type">
                {{ type }}
              </option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>视频描述</label>
            <textarea
              v-model="uploadForm.description"
              placeholder="请输入视频描述"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>
          <div class="form-group">
            <label>选择视频文件 *</label>
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              accept="video/*"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  getVideoList, 
  getVideoDetail,
  uploadVideo,
  deleteVideo,
  addFavorite,
  removeFavorite,
  getMyFavorites,
  getVideoTypes,
  type Video 
} from '@/api/videos'
import { useAuthStore } from '@/stores/auth'
import { getStudentInfo, type StudentInfo } from '@/api/auth'
import { API_BASE_URL } from '@/config/api'

const authStore = useAuthStore()

// 权限控制
const canUpload = ref(false)
const userType = ref<number>(0) // 1-学员 2-讲师 3-管理员

// 当前视频
const currentVideo = ref<Video | null>(null)
const videoPlayer = ref<HTMLVideoElement | null>(null)

// 播放控制
const playbackRate = ref(1)
const quality = ref('auto')
const currentTime = ref(0)
const duration = ref(0)

// 显示时长：优先用播放器解析的真实时长，否则用后端存储的
const displayDuration = computed(() => {
  if (duration.value > 0) return duration.value
  return currentVideo.value?.duration ?? 0
})

// 视频列表
const videos = ref<Video[]>([])
const videoTypes = ref<string[]>([])
const selectedType = ref('')
const searchText = ref('')
const listMode = ref<'all' | 'favorites'>('all')

// 分页
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(1)
const total = ref(0)
const loading = ref(false)

// 上传对话框
const showUploadDialog = ref(false)
const uploading = ref(false)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadForm = ref({
  videoTitle: '',
  videoType: '',
  description: ''
})

// 检查用户权限
const checkUserPermission = async () => {
  if (!authStore.userPhone) {
    canUpload.value = false
    return
  }
  
  try {
    const response = await getStudentInfo(authStore.userPhone)
    if (response.code === 200 || response.code === 0) {
      const studentInfo = response.data as StudentInfo
      userType.value = studentInfo?.userType || 0
      // 讲师(2)或管理员(3)可以上传
      canUpload.value = userType.value === 2 || userType.value === 3 || authStore.userType === 1
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 如果获取失败，使用authStore中的userType
    canUpload.value = authStore.userType === 1
  }
}

// 加载视频列表
const loadVideoList = async () => {
  loading.value = true
  try {
    const response = await getVideoList({
      page: currentPage.value,
      limit: pageSize,
      videoType: selectedType.value || undefined,
      searchText: searchText.value || undefined
    })
    
    if (response.code === 200 || response.code === 0) {
      videos.value = response.data || []
      total.value = response.count || 0
      totalPages.value = Math.ceil(total.value / pageSize)
      
      // 如果当前视频不在列表中，选择第一个
      if (videos.value.length > 0 && !currentVideo.value) {
        selectVideo(videos.value[0])
      }
    }
  } catch (error: any) {
    console.error('加载视频列表失败:', error)
    alert('加载视频列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 加载收藏列表
const loadFavorites = async () => {
  loading.value = true
  try {
    const response = await getMyFavorites({
      page: currentPage.value,
      limit: pageSize
    })
    
    if (response.code === 200 || response.code === 0) {
      videos.value = response.data || []
      total.value = response.count || 0
      totalPages.value = Math.ceil(total.value / pageSize)
      
      if (videos.value.length > 0 && !currentVideo.value) {
        selectVideo(videos.value[0])
      }
    }
  } catch (error: any) {
    console.error('加载收藏列表失败:', error)
    alert('加载收藏列表失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 加载视频类型列表
const loadVideoTypes = async () => {
  try {
    const response = await getVideoTypes()
    if (response.code === 200 || response.code === 0) {
      videoTypes.value = response.data || []
    }
  } catch (error) {
    console.error('加载视频类型失败:', error)
  }
}

// 选择视频
const selectVideo = async (video: Video) => {
  currentVideo.value = video
  
  // 加载视频详情（更新收藏状态等）
  try {
    const response = await getVideoDetail(video.id!)
    if (response.code === 200 || response.code === 0) {
      currentVideo.value = response.data as Video
      
      // 等待视频元素加载后设置播放
      if (videoPlayer.value) {
        videoPlayer.value.load()
      }
    }
  } catch (error) {
    console.error('加载视频详情失败:', error)
  }
}

// 视频加载完成
const onVideoLoaded = () => {
  if (videoPlayer.value) {
    duration.value = videoPlayer.value.duration || 0
  }
}

// 时间更新
const onTimeUpdate = () => {
  if (videoPlayer.value) {
    currentTime.value = videoPlayer.value.currentTime
  }
}

// 播放
const onPlay = () => {
  // 可以在这里记录播放进度
}

// 暂停
const onPause = () => {
  // 可以在这里保存播放进度
}

// 倍速改变
const onPlaybackRateChange = () => {
  if (videoPlayer.value) {
    videoPlayer.value.playbackRate = playbackRate.value
  }
}

// 清晰度改变（实际应用中需要后端提供不同清晰度的URL）
const onQualityChange = () => {
  // 这里可以根据quality值切换视频源
  // 实际应用中需要后端提供不同清晰度的视频URL
  console.log('切换清晰度:', quality.value)
}

// 进度调节
const onSeek = () => {
  if (videoPlayer.value) {
    videoPlayer.value.currentTime = currentTime.value
  }
}

// 切换收藏
const toggleFavorite = async () => {
  if (!currentVideo.value || !authStore.userPhone) {
    alert('请先登录')
    return
  }
  
  try {
    if (currentVideo.value.isFavorited) {
      await removeFavorite(currentVideo.value.id!)
      currentVideo.value.isFavorited = false
      
      // 如果在"我的收藏"标签页，从列表中移除该视频
      if (listMode.value === 'favorites') {
        videos.value = videos.value.filter(v => v.id !== currentVideo.value!.id)
        total.value = Math.max(0, total.value - 1)
        
        // 如果列表为空，选择第一个视频（如果有）
        if (videos.value.length > 0) {
          selectVideo(videos.value[0])
        } else {
          currentVideo.value = null
        }
      } else {
        // 更新列表中的收藏状态
        const video = videos.value.find(v => v.id === currentVideo.value!.id)
        if (video) {
          video.isFavorited = false
        }
      }
    } else {
      await addFavorite(currentVideo.value.id!)
      currentVideo.value.isFavorited = true
      
      // 更新列表中的收藏状态
      const video = videos.value.find(v => v.id === currentVideo.value!.id)
      if (video) {
        video.isFavorited = true
      }
    }
  } catch (error: any) {
    alert('操作失败：' + (error.message || '未知错误'))
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  if (listMode.value === 'all') {
    loadVideoList()
  }
}

// 类型改变
const handleTypeChange = () => {
  currentPage.value = 1
  if (listMode.value === 'all') {
    loadVideoList()
  }
}

// 分页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    if (listMode.value === 'all') {
      loadVideoList()
    } else {
      loadFavorites()
    }
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    if (listMode.value === 'all') {
      loadVideoList()
    } else {
      loadFavorites()
    }
  }
}

// 打开上传对话框
const openUploadDialog = () => {
  showUploadDialog.value = true
  uploadForm.value = {
    videoTitle: '',
    videoType: '',
    description: ''
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
  }
}

// 上传视频
const handleUpload = async () => {
  if (!uploadForm.value.videoTitle?.trim()) {
    alert('请输入视频标题')
    return
  }
  if (!uploadForm.value.videoType) {
    alert('请选择视频类型')
    return
  }
  if (!selectedFile.value) {
    alert('请选择要上传的视频文件')
    return
  }
  
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('videoTitle', uploadForm.value.videoTitle.trim())
    formData.append('videoType', uploadForm.value.videoType)
    formData.append('description', uploadForm.value.description?.trim() || '')
    formData.append('instructorId', authStore.userPhone || '')
    formData.append('instructorName', authStore.nickname || authStore.userPhone || '')
    
    const response = await uploadVideo(formData)
    
    if (response.code === 200 || response.code === 0) {
      alert('上传成功')
      showUploadDialog.value = false
      currentPage.value = 1
      loadVideoList()
      loadVideoTypes() // 重新加载类型列表
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

// 格式化时长（秒转分:秒）
const formatDuration = (seconds?: number) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 获取视频URL - 使用预览接口
const getVideoUrl = (videoId?: number) => {
  if (!videoId) return ''
  // 使用视频预览接口
  return `${API_BASE_URL}/VideosController/preview/${videoId}`
}

// 初始化
onMounted(async () => {
  await checkUserPermission()
  await loadVideoTypes()
  await loadVideoList()
})
</script>

<style scoped>
.videos-page {
  max-width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 26px;
  font-weight: 500;
  color: var(--text-primary);
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

.btn-primary:hover {
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 155, 213, 0.3);
}

.layout {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
}

.card {
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.player {
  padding: 16px;
}

.player-container {
  width: 100%;
}

.video-player {
  width: 100%;
  max-height: 500px;
  border-radius: 8px;
  background: #000;
}

.player-placeholder {
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #0f172a 0%, #1f2a44 100%);
  border-radius: 8px;
  color: white;
}

.play-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.placeholder-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.player-info {
  margin-top: 16px;
}

.player-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.player-meta {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.player-meta span {
  margin-right: 8px;
}

.player-description {
  font-size: 14px;
  color: var(--text-regular);
  line-height: 1.6;
}

.player-controls {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
}

.control-select {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.progress-slider {
  flex: 1;
  min-width: 150px;
}

.time-display {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.btn-favorite {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.25s ease;
}

.btn-favorite:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-favorite.favorited {
  background: #fff3cd;
  border-color: #ffc107;
  color: #856404;
}

.list-head {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  gap: 10px;
}

.search-input,
.select {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.search-input {
  flex: 1;
}

.list-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.25s ease;
}

.tab-btn:hover {
  background: var(--hover-bg);
}

.tab-btn.active {
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
}

.items {
  max-height: 500px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.item {
  width: 100%;
  display: flex;
  gap: 12px;
  padding: 12px;
  border: none;
  background: white;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.3s;
  position: relative;
}

.item:hover {
  background: #f5f7fa;
}

.item.active {
  background: #ecf5ff;
}

.thumb {
  width: 80px;
  height: 60px;
  border-radius: 6px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  overflow: hidden;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  flex: 1;
  min-width: 0;
}

.info .title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info .sub {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.type-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 12px;
}

.favorite-mark {
  position: absolute;
  top: 12px;
  right: 12px;
  color: #ffc107;
  font-size: 18px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 14px;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}

/* 对话框样式 */
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
  background: var(--card-bg);
  border-radius: 14px;
  width: 90%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
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

.file-info {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
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

@media (max-width: 1000px) {
  .layout {
    grid-template-columns: 1fr;
  }
  
  .video-player {
    max-height: 300px;
  }
}
</style>
