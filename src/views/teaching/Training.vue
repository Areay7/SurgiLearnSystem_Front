<template>
  <div class="training-page">
    <div class="page-header">
      <h1 class="page-title">护理培训</h1>
      <button class="btn-primary" @click="openCreateDialog">创建培训</button>
    </div>
    
    <div class="training-content">
      <div class="training-cards">
        <div class="training-card" v-for="item in list" :key="item.id">
          <div class="card-header">
            <h3 class="card-title">{{ item.trainingName || '-' }}</h3>
            <span class="card-status" :class="item.status === '已完成' ? 'completed' : item.status === '进行中' ? 'ongoing' : 'upcoming'">
              {{ item.status || '未开始' }}
            </span>
          </div>
          <p class="card-description">{{ item.description || '—' }}</p>
          <div class="card-info">
            <span>👨‍🏫 讲师：{{ item.instructorName || '—' }}</span>
            <span>👨‍🎓 学员：{{ item.currentParticipants ?? 0 }}人</span>
            <span>📅 时间：{{ formatDate(item.startDate) }} ~ {{ formatDate(item.endDate) }}</span>
          </div>
          <div class="card-actions">
            <button class="btn-view" @click="goDetail(item)">查看详情</button>
            <button class="btn-join" @click="goDetail(item)">开始学习</button>
          </div>
        </div>
      </div>
      
      <div class="pagination">
        <button class="page-btn" @click="prevPage" :disabled="page === 1 || loading">上一页</button>
        <span class="page-info">第 {{ page }} 页</span>
        <button class="page-btn" @click="nextPage" :disabled="loading || list.length < pageSize">下一页</button>
      </div>
    </div>
  </div>

  <!-- 创建培训（简单版） -->
  <div v-if="showDialog" class="dialog-overlay" @click="showDialog = false">
    <div class="dialog" @click.stop>
      <div class="dialog-header">
        <h3>创建培训</h3>
        <button class="close-btn" @click="showDialog = false">×</button>
      </div>
      <div class="dialog-body">
        <div class="form">
          <div class="form-group">
            <label>培训名称 *</label>
            <input class="form-input" v-model="form.trainingName" />
          </div>
          <div class="form-group">
            <label>培训类型</label>
            <input class="form-input" v-model="form.trainingType" placeholder="例如：外科护理/基础护理" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea class="form-input" v-model="form.description" rows="3"></textarea>
          </div>
        </div>
        <div class="hint">创建后，可在详情页关联学习资料并追踪进度。</div>
      </div>
      <div class="dialog-footer">
        <button class="btn-cancel" @click="showDialog = false">取消</button>
        <button class="btn-confirm" @click="save" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getTrainingList } from '@/api/training'
import { addTraining } from '@/api/trainingAdmin'
import type { Training } from '@/api/training'

const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const list = ref<Training[]>([])
const page = ref(1)
const pageSize = ref(10)

const showDialog = ref(false)
const form = reactive<Training>({
  trainingName: '',
  trainingType: '',
  description: '',
  status: '未开始'
})

const load = async () => {
  loading.value = true
  try {
    const res = await getTrainingList({ page: page.value, limit: pageSize.value })
    list.value = res.data || []
  } catch (e: any) {
    alert(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    load()
  }
}
const nextPage = () => {
  page.value++
  load()
}

const goDetail = (item: Training) => {
  if (!item.id) return
  router.push(`/training/${item.id}`)
}

const openCreateDialog = () => {
  Object.assign(form, { trainingName: '', trainingType: '', description: '', status: '未开始' })
  showDialog.value = true
}

const save = async () => {
  if (!form.trainingName?.trim()) {
    alert('请输入培训名称')
    return
  }
  saving.value = true
  try {
    const res = await addTraining(form)
    if (res.code === 0 || res.code === 200) {
      alert('创建成功')
      showDialog.value = false
      page.value = 1
      load()
    } else {
      alert(res.msg || '创建失败')
    }
  } catch (e: any) {
    alert(e.message || '创建失败')
  } finally {
    saving.value = false
  }
}

const formatDate = (s?: string) => {
  if (!s) return '-'
  try {
    return new Date(s).toLocaleDateString('zh-CN').replace(/\//g, '-')
  } catch {
    return s
  }
}

onMounted(load)
</script>

<style scoped>
.training-page {
  max-width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
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

.training-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.training-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.training-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.card-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.card-status.ongoing {
  background: #ecf5ff;
  color: var(--primary-color);
}

.card-status.completed {
  background: #f0f9ff;
  color: var(--success-color);
}

.card-status.upcoming {
  background: #fef0f0;
  color: var(--warning-color);
}

.card-description {
  color: var(--text-regular);
  line-height: 1.6;
  margin-bottom: 16px;
  font-size: 14px;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-view, .btn-join {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-view {
  background: white;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn-view:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-join {
  background: var(--primary-color);
  color: white;
}

.btn-join:hover {
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

.page-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}

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
  width: 92%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
}
.dialog-body { padding: 16px; }
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
}
.form { display: flex; flex-direction: column; gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-input {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
}
.btn-cancel, .btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.btn-cancel { background: white; color: var(--text-regular); border: 1px solid var(--border-color); }
.btn-confirm { background: var(--primary-color); color: white; }
.hint { margin-top: 10px; color: var(--text-secondary); font-size: 12px; }

@media (max-width: 768px) {
  .training-cards {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>

