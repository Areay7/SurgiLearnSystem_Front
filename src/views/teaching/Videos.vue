<template>
  <div class="videos-page">
    <div class="page-header">
      <h1 class="page-title">视频讲座播放</h1>
      <div class="header-actions">
        <button class="btn-action" @click="handlePrintAll">打印全部</button>
        <button class="btn-action" @click="handlePrintSelected">打印勾选</button>
        <button class="btn-action" v-if="selectedVideoIds.length > 0" @click="restoreSelection">还原</button>
        <button 
          v-if="isAdmin && selectedVideoIds.length > 0" 
          class="btn-danger" 
          @click="handleDeleteSelected"
        >
          删除选中 ({{ selectedVideoIds.length }})
        </button>
        <button 
          v-if="canUpload" 
          class="btn-primary" 
          @click="openUploadDialog"
        >
          上传视频
        </button>
      </div>
    </div>

    <div v-if="!canView" class="no-permission card">
      <p>您没有观看视频的权限，请联系管理员。</p>
    </div>
    <div v-else class="layout">
      <!-- 视频播放器 -->
      <div class="player card">
        <div v-if="currentVideo" class="player-container">
          <div v-if="videoLoading" class="video-loading">加载视频中...</div>
          <video
            v-show="!videoLoading && videoBlobUrl"
            ref="videoPlayer"
            :src="videoBlobUrl"
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
            v-if="canFavorite"
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
          <select v-model="selectedCategory" @change="handleTypeChange" class="select">
            <option value="">全部分类</option>
            <option v-for="c in videoCategories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        
        <div class="list-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: listMode === 'all' }"
            @click="switchToListAll"
          >
            全部视频
          </button>
          <button 
            v-if="canFavorite"
            class="tab-btn" 
            :class="{ active: listMode === 'favorites' }"
            @click="switchToFavorites"
          >
            我的收藏
          </button>
        </div>
        
        <div v-if="isAdmin && videos.length > 0" class="list-select-bar">
          <label class="select-all">
            <input 
              type="checkbox" 
              :checked="selectedVideoIds.length === videos.length" 
              :indeterminate="selectedVideoIds.length > 0 && selectedVideoIds.length < videos.length"
              @change="handleSelectAllVideos"
            />
            全选
          </label>
        </div>
        
        <div class="items">
          <div v-if="loading" class="loading-state">加载中...</div>
          <div v-else-if="videos.length === 0" class="empty-state">暂无视频</div>
          <div
            v-else
            v-for="video in videos"
            :key="video.id"
            class="item"
            :class="{ active: currentVideo?.id === video.id }"
            @click="selectVideo(video)"
          >
            <div v-if="isAdmin" class="item-checkbox" @click.stop>
              <input 
                type="checkbox" 
                :checked="selectedVideoIds.includes(video.id!)" 
                @change="toggleVideoSelect(video.id!)"
              />
            </div>
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
              <div class="type-tag small">{{ video.category || '无分类' }}</div>
            </div>
            <div v-if="canFavorite && video.isFavorited" class="favorite-mark">★</div>
          </div>
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
            <label>分类</label>
            <select v-model="uploadForm.category" class="form-input">
              <option value="">请选择分类</option>
              <option v-for="c in videoCategories" :key="c" :value="c">{{ c }}</option>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { 
  getVideoList, 
  getVideoDetail,
  getVideoPreviewBlob,
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

const authStore = useAuthStore()

// 权限控制
const canUpload = ref(false)
const isAdmin = computed(() => authStore.userType === 1)
const canView = computed(() => authStore.hasPermission('video:view'))
const canFavorite = computed(() => authStore.hasPermission('video:favorite'))
const selectedVideoIds = ref<number[]>([])
const userType = ref<number>(0) // 1-学员 2-讲师 3-管理员

// 当前视频
const currentVideo = ref<Video | null>(null)
const videoPlayer = ref<HTMLVideoElement | null>(null)
// 视频播放地址（通过带认证的 blob 请求获取，解决 video 元素不携带 Authorization 的问题）
const videoBlobUrl = ref('')
const videoLoading = ref(false)

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
const videoCategories = ref<string[]>(['护理技巧','案例分析','经验分享','其他'])
const selectedCategory = ref('')
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
      category: selectedCategory.value || undefined,
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

// 切换列表
const switchToListAll = () => {
  listMode.value = 'all'
  selectedVideoIds.value = []
  loadVideoList()
}
const switchToFavorites = () => {
  listMode.value = 'favorites'
  selectedVideoIds.value = []
  loadFavorites()
}

// 全选/取消全选视频
const handleSelectAllVideos = () => {
  if (selectedVideoIds.value.length === videos.value.length) {
    selectedVideoIds.value = []
  } else {
    selectedVideoIds.value = videos.value.map(v => v.id!).filter(Boolean)
  }
}

// 打印 / 还原
const handlePrintAll = () => {
  window.print()
}

const handlePrintSelected = () => {
  if (selectedVideoIds.value.length === 0) {
    alert('请先选择要打印的视频')
    return
  }
  alert(`准备打印 ${selectedVideoIds.value.length} 个视频`)
}

const restoreSelection = () => {
  selectedVideoIds.value = []
}

// 切换单个视频选中状态
const toggleVideoSelect = (id: number) => {
  const idx = selectedVideoIds.value.indexOf(id)
  if (idx >= 0) {
    selectedVideoIds.value = selectedVideoIds.value.filter(x => x !== id)
  } else {
    selectedVideoIds.value = [...selectedVideoIds.value, id]
  }
}

// 删除选中视频
const handleDeleteSelected = async () => {
  if (selectedVideoIds.value.length === 0) {
    alert('请先选择要删除的视频')
    return
  }
  if (!confirm(`确定要删除选中的 ${selectedVideoIds.value.length} 个视频吗？`)) {
    return
  }
  try {
    const idsToDelete = [...selectedVideoIds.value]
    const res = await deleteVideo(idsToDelete.join(','))
    if (res.code === 200 || res.code === 0) {
      alert('删除成功')
      selectedVideoIds.value = []
      if (currentVideo.value && idsToDelete.includes(currentVideo.value.id!)) {
        currentVideo.value = null
      }
      if (listMode.value === 'all') {
        loadVideoList()
      } else {
        loadFavorites()
      }
      loadVideoTypes()
    } else {
      alert('删除失败：' + (res.msg || '未知错误'))
    }
  } catch (e: any) {
    alert('删除失败：' + (e.message || '未知错误'))
  }
}

// 释放旧的 blob URL
const revokeVideoBlobUrl = () => {
  if (videoBlobUrl.value) {
    URL.revokeObjectURL(videoBlobUrl.value)
    videoBlobUrl.value = ''
  }
}

// 选择视频
const selectVideo = async (video: Video) => {
  revokeVideoBlobUrl()
  currentVideo.value = video
  videoLoading.value = true
  
  try {
    // 加载视频详情（更新收藏状态等）
    const response = await getVideoDetail(video.id!)
    if (response.code === 200 || response.code === 0) {
      currentVideo.value = response.data as Video
    }
    
    // 通过带认证的请求获取视频流，video 元素直接 src 不会携带 Authorization
    const blob = await getVideoPreviewBlob(video.id!)
    videoBlobUrl.value = URL.createObjectURL(blob)
    if (videoPlayer.value) {
      videoPlayer.value.load()
    }
  } catch (error) {
    console.error('加载视频失败:', error)
    alert('加载视频失败，请检查是否有观看权限')
  } finally {
    videoLoading.value = false
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
    description: '',
    category: ''
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
    formData.append('category', uploadForm.value.category || '')
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

// 初始化
onMounted(async () => {
  await checkUserPermission()
  if (canView.value) {
    await loadVideoTypes()
    await loadVideoList()
  }
})

watch(canView, (val) => {
  if (val) {
    loadVideoTypes()
    loadVideoList()
  }
})

watch(currentVideo, (v) => {
  if (!v) revokeVideoBlobUrl()
})

onUnmounted(() => {
  revokeVideoBlobUrl()
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
  flex-wrap: wrap;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-danger {
  padding: 10px 22px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.25s ease;
}

.btn-danger:hover {
  background: #f78989;
  transform: translateY(-1px);
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

.list-select-bar {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  background: #f9fafb;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-regular);
}

.select-all input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
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
.video-loading,
.no-permission {
  padding: 48px 24px;
  text-align: center;
  color: var(--text-secondary);
}

.no-permission p {
  margin: 0;
  font-size: 16px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.item {
  width: 100%;
  display: flex;
  align-items: center;
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

.item-checkbox {
  flex-shrink: 0;
}

.item-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
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
