<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">学习进度跟踪</h1>
      <button class="btn-primary" @click="exportReport" :disabled="loading">导出报表</button>
    </div>

    <div class="filters">
      <select class="select" v-model="filters.trainingId" @change="loadData">
        <option :value="undefined">全部培训</option>
        <option v-for="t in trainingList" :key="t.id" :value="t.id">{{ t.trainingName || '-' }}</option>
      </select>
      <select class="select" v-model="filters.status" @change="loadData">
        <option value="">全部状态</option>
        <option value="学习中">学习中</option>
        <option value="已完成">已完成</option>
      </select>
      <input
        class="search-input"
        v-model="filters.searchText"
        placeholder="搜索学员姓名或手机号..."
        @keyup.enter="loadData"
      />
      <button class="btn-query" @click="loadData" :disabled="loading">查询</button>
      <button class="btn-reset" @click="resetFilters" :disabled="loading">重置</button>
    </div>

    <div class="cards">
      <div class="card metric">
        <div class="k">平均完成率</div>
        <div class="v">{{ statistics.avgProgressPercent }}%</div>
      </div>
      <div class="card metric">
        <div class="k">完成率</div>
        <div class="v">{{ statistics.completedRate }}%</div>
      </div>
      <div class="card metric">
        <div class="k">已完成人数</div>
        <div class="v">{{ statistics.completedCount }}</div>
      </div>
      <div class="card metric">
        <div class="k">待跟进学员</div>
        <div class="v">{{ statistics.needFollowCount }}</div>
      </div>
    </div>

    <div class="card" v-if="!loading">
      <!-- 手机端：卡片列表模式 -->
      <div v-if="isMobile" class="mobile-list">
        <div v-for="item in progressList" :key="item.id" class="mobile-card">
          <div class="mc-header">
            <div class="mc-title">
              <div class="name">{{ item.studentName || `学员ID: ${item.studentId}` }}</div>
              <div class="sub" v-if="item.studentId">ID: {{ item.studentId }}</div>
            </div>
            <span class="badge" :class="item.status === '已完成' ? 'ok' : 'muted'">
              {{ item.status || '学习中' }}
            </span>
          </div>

          <div class="mc-row">
            <span class="label">培训</span>
            <span class="value">
              {{ trainingMap[item.trainingId!]?.trainingName || `培训ID: ${item.trainingId}` }}
            </span>
          </div>

          <div class="mc-progress">
            <div class="bar big">
              <div class="fill" :style="{ width: (item.progressPercent || 0) + '%' }" />
            </div>
            <div class="pct">
              {{ item.progressPercent || 0 }}%（{{ item.completedCount || 0 }}/{{ item.totalCount || 0 }}）
            </div>
          </div>

          <div class="mc-row">
            <span class="label">最近学习</span>
            <span class="value text-muted">{{ formatDateTime(item.lastStudyTime) }}</span>
          </div>

          <div class="mc-actions">
            <button class="btn primary" @click="viewDetail(item)">查看详情</button>
            <button class="btn" @click="openEdit(item)">编辑</button>
            <button class="btn danger" @click="removeItem(item)">删除</button>
          </div>
        </div>

        <div v-if="progressList.length === 0" class="empty-mobile">暂无进度数据</div>
      </div>

      <!-- 桌面端：表格模式 -->
      <div v-else class="table">
        <div class="tr th">
          <div class="td">学员</div>
          <div class="td">培训</div>
          <div class="td">完成进度</div>
          <div class="td">完成情况</div>
          <div class="td">状态</div>
          <div class="td">最近学习</div>
          <div class="td actions">操作</div>
        </div>
        <div class="tr" v-for="item in progressList" :key="item.id">
          <div class="td name">
            <div class="title">{{ item.studentName || `学员ID: ${item.studentId}` }}</div>
            <div class="sub" v-if="item.studentId">ID: {{ item.studentId }}</div>
          </div>
          <div class="td training-name">
            <span v-if="trainingMap[item.trainingId!]">{{ trainingMap[item.trainingId!].trainingName }}</span>
            <span v-else class="text-muted">培训ID: {{ item.trainingId }}</span>
          </div>
          <div class="td">
            <div class="bar">
              <div class="fill" :style="{ width: (item.progressPercent || 0) + '%' }" />
            </div>
            <div class="pct">{{ item.progressPercent || 0 }}% ({{ item.completedCount || 0 }}/{{ item.totalCount || 0 }})</div>
          </div>
          <div class="td">
            <span class="badge" :class="(item.progressPercent || 0) >= 100 ? 'ok' : 'warn'">
              {{ (item.progressPercent || 0) >= 100 ? '已完成' : '进行中' }}
            </span>
          </div>
          <div class="td">
            <span class="badge" :class="item.status === '已完成' ? 'ok' : 'muted'">
              {{ item.status || '学习中' }}
            </span>
          </div>
          <div class="td">
            <span class="text-muted">{{ formatDateTime(item.lastStudyTime) }}</span>
          </div>
          <div class="td actions">
            <button class="btn" @click="viewDetail(item)">详情</button>
            <button class="btn" @click="openEdit(item)">编辑</button>
            <button class="btn danger" @click="removeItem(item)">删除</button>
          </div>
        </div>
        <div class="tr empty-row" v-if="progressList.length === 0">
          <div class="td" style="grid-column: 1 / -1; text-align: center; padding: 24px;">暂无进度数据</div>
        </div>
      </div>
      <div class="pagination">
        <button class="page-btn" @click="prevPage" :disabled="currentPage === 1 || loading">上一页</button>
        <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页（共 {{ total }} 条）</span>
        <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages || loading">下一页</button>
      </div>
    </div>
    <div v-else class="loading-state">加载中...</div>

    <!-- 详情弹窗 -->
    <div v-if="showDetailDialog" class="dialog-overlay" @click="closeDetail">
      <div class="dialog detail-dialog" @click.stop>
        <div class="dialog-header">
          <h3>进度详情</h3>
          <button class="close-btn" @click="closeDetail">×</button>
        </div>
        <div class="dialog-body" v-if="detailData">
          <div class="detail-section">
            <h4>学员信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">姓名：</span>
                <span class="value">{{ detailData.student?.studentName || detailData.progress?.studentName || '-' }}</span>
              </div>
              <div class="info-item" v-if="detailData.student?.phone">
                <span class="label">手机号：</span>
                <span class="value">{{ detailData.student.phone }}</span>
              </div>
              <div class="info-item" v-if="detailData.student?.department">
                <span class="label">部门：</span>
                <span class="value">{{ detailData.student.department }}</span>
              </div>
              <div class="info-item" v-if="detailData.student?.position">
                <span class="label">职位：</span>
                <span class="value">{{ detailData.student.position }}</span>
              </div>
            </div>
          </div>
          <div class="detail-section">
            <h4>培训信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">培训名称：</span>
                <span class="value">{{ detailData.training?.trainingName || '-' }}</span>
              </div>
              <div class="info-item" v-if="detailData.training?.trainingType">
                <span class="label">培训类型：</span>
                <span class="value">{{ detailData.training.trainingType }}</span>
              </div>
            </div>
          </div>
          <div class="detail-section">
            <h4>学习进度</h4>
            <div class="progress-summary">
              <div class="progress-item">
                <span class="label">总体进度：</span>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: (detailData.progress?.progressPercent || 0) + '%' }"></div>
                </div>
                <span class="value">{{ detailData.progress?.progressPercent || 0 }}%</span>
              </div>
              <div class="progress-item">
                <span class="label">完成情况：</span>
                <span class="value">{{ detailData.progress?.completedCount || 0 }} / {{ detailData.progress?.totalCount || 0 }}</span>
              </div>
              <div class="progress-item">
                <span class="label">状态：</span>
                <span class="badge" :class="detailData.progress?.status === '已完成' ? 'ok' : 'muted'">
                  {{ detailData.progress?.status || '学习中' }}
                </span>
              </div>
              <div class="progress-item" v-if="detailData.progress?.lastStudyTime">
                <span class="label">最近学习：</span>
                <span class="value">{{ formatDateTime(detailData.progress.lastStudyTime) }}</span>
              </div>
            </div>
          </div>
          <div class="detail-section" v-if="detailData.materialProgressList && detailData.materialProgressList.length > 0">
            <h4>资料完成明细</h4>
            <div class="material-list">
              <div
                v-for="mp in detailData.materialProgressList"
                :key="mp.id || mp.materialId"
                class="material-item"
              >
                <span class="material-id">资料ID: {{ mp.materialId }}</span>
                <div class="material-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: (mp.progressPercent || 0) + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ mp.progressPercent || 0 }}%</span>
                </div>
                <span class="badge" :class="mp.completed === 1 ? 'ok' : 'muted'">
                  {{ mp.completed === 1 ? '已完成' : '进行中' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeDetail">关闭</button>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditDialog" class="dialog-overlay" @click="showEditDialog = false">
      <div class="dialog edit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>编辑学习进度</h3>
          <button class="close-btn" @click="showEditDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="edit-form">
            <div class="form-row">
              <div class="form-group">
                <label>进度百分比</label>
                <input type="number" class="form-input" v-model.number="editForm.progressPercent" min="0" max="100" />
              </div>
              <div class="form-group">
                <label>已完成数</label>
                <input type="number" class="form-input" v-model.number="editForm.completedCount" min="0" />
              </div>
              <div class="form-group">
                <label>总数</label>
                <input type="number" class="form-input" v-model.number="editForm.totalCount" min="0" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>状态</label>
                <select class="form-input" v-model="editForm.status">
                  <option value="学习中">学习中</option>
                  <option value="已完成">已完成</option>
                </select>
              </div>
              <div class="form-group">
                <label>最近学习时间</label>
                <input type="datetime-local" class="form-input" v-model="editForm.lastStudyTime" />
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showEditDialog = false">取消</button>
          <button class="btn-confirm" @click="handleEditSave" :disabled="savingEdit">{{ savingEdit ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getProgressList, getProgressStatistics, getProgressDetail, updateProgress, deleteProgress } from '@/api/progress'
import type { ProgressDetail } from '@/api/progress'
import { getTrainingList } from '@/api/training'
import type { Training, TrainingProgress } from '@/api/training'

const loading = ref(false)
const progressList = ref<TrainingProgress[]>([])
const trainingList = ref<Training[]>([])
const trainingMap = ref<Record<number, Training>>({})
const statistics = ref({
  avgProgressPercent: 0,
  completedRate: 0,
  completedCount: 0,
  learningCount: 0,
  needFollowCount: 0
})

const filters = reactive({
  trainingId: undefined as number | undefined,
  status: '',
  searchText: ''
})

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const showDetailDialog = ref(false)
const detailData = ref<ProgressDetail | null>(null)
const loadingDetail = ref(false)
// 编辑弹窗与表单
const showEditDialog = ref(false)
const savingEdit = ref(false)
const editForm = reactive({
  id: undefined as number | undefined,
  progressPercent: undefined as number | undefined,
  completedCount: undefined as number | undefined,
  totalCount: undefined as number | undefined,
  status: '' as string,
  lastStudyTime: '' as string
})

const isMobile = computed(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches)

const loadTrainingList = async () => {
  try {
    const res = await getTrainingList({ page: 1, limit: 1000 })
    trainingList.value = res.data || []
    const map: Record<number, Training> = {}
    trainingList.value.forEach(t => {
      if (t.id) map[t.id] = t
    })
    trainingMap.value = map
  } catch (e: any) {
    console.error('加载培训列表失败:', e)
  }
}

const loadStatistics = async () => {
  try {
    const res = await getProgressStatistics(filters.trainingId)
    if (res.code === 0 || res.code === 200) {
      statistics.value = res.data || statistics.value
    }
  } catch (e: any) {
    console.error('加载统计失败:', e)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getProgressList({
      page: currentPage.value,
      limit: pageSize.value,
      trainingId: filters.trainingId,
      status: filters.status || undefined,
      searchText: filters.searchText || undefined
    })
    if (res.code === 0 || res.code === 200) {
      progressList.value = res.data || []
      total.value = res.count || 0
    } else {
      alert(res.msg || '加载失败')
    }
    await loadStatistics()
  } catch (e: any) {
    alert(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.trainingId = undefined
  filters.status = ''
  filters.searchText = ''
  currentPage.value = 1
  loadData()
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

const viewDetail = async (item: TrainingProgress) => {
  if (!item.id) return
  loadingDetail.value = true
  showDetailDialog.value = true
  try {
    const res = await getProgressDetail(item.id)
    if (res.code === 0 || res.code === 200) {
      detailData.value = res.data || null
    } else {
      alert(res.msg || '加载详情失败')
      showDetailDialog.value = false
    }
  } catch (e: any) {
    alert(e.message || '加载详情失败')
    showDetailDialog.value = false
  } finally {
    loadingDetail.value = false
  }
}

const closeDetail = () => {
  showDetailDialog.value = false
  detailData.value = null
}

// 打开编辑弹窗
const openEdit = async (item: TrainingProgress) => {
  if (!item.id) {
    alert('记录ID不存在')
    return
  }
  try {
    const res = await getProgressDetail(item.id)
    if (res.code === 0 || res.code === 200) {
      const d = res.data
      if (d && d.progress) {
        editForm.id = d.progress.id
        editForm.progressPercent = d.progress.progressPercent ?? 0
        editForm.completedCount = d.progress.completedCount ?? 0
        editForm.totalCount = d.progress.totalCount ?? 0
        editForm.status = d.progress.status || ''
        editForm.lastStudyTime = d.progress.lastStudyTime ? new Date(d.progress.lastStudyTime).toISOString().slice(0,16) : ''
        showEditDialog.value = true
      } else {
        alert('无法加载进度数据')
      }
    } else {
      alert(res.msg || '加载失败')
    }
  } catch (e: any) {
    alert(e.message || '加载失败')
  }
}

// 保存编辑
const handleEditSave = async () => {
  if (!editForm.id) return alert('记录ID为空')
  if (editForm.progressPercent != null && (editForm.progressPercent < 0 || editForm.progressPercent > 100)) return alert('进度百分比应在0到100之间')
  if (editForm.completedCount != null && editForm.totalCount != null && editForm.completedCount > editForm.totalCount) return alert('已完成数不能大于总数')
  savingEdit.value = true
  try {
    const payload: any = {
      id: editForm.id,
      progressPercent: editForm.progressPercent,
      completedCount: editForm.completedCount,
      totalCount: editForm.totalCount,
      status: editForm.status,
      lastStudyTime: editForm.lastStudyTime ? new Date(editForm.lastStudyTime).toISOString() : undefined
    }
    const res = await updateProgress(payload)
    if (res.code === 0 || res.code === 200) {
      showEditDialog.value = false
      await loadData()
    } else {
      alert(res.msg || '保存失败')
    }
  } catch (e: any) {
    alert(e.message || '保存失败')
  } finally {
    savingEdit.value = false
  }
}

// 删除记录
const removeItem = async (item: TrainingProgress) => {
  if (!item.id) return alert('记录ID不存在')
  if (!confirm('确认删除此学习进度记录？')) return
  try {
    const res = await deleteProgress(String(item.id))
    if (res.code === 0 || res.code === 200) {
      await loadData()
    } else {
      alert(res.msg || '删除失败')
    }
  } catch (e: any) {
    alert(e.message || '删除失败')
  }
}

const exportReport = () => {
  alert('导出功能待实现')
}

const formatDateTime = (s?: string) => {
  if (!s) return '-'
  try {
    const d = new Date(s)
    return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return s
  }
}

onMounted(async () => {
  await loadTrainingList()
  await loadData()
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
.btn-primary:hover:not(:disabled) {
  background: #66b1ff;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.search-input,
.select {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.search-input {
  flex: 1;
  min-width: 200px;
}
.btn-query, .btn-reset {
  padding: 10px 18px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.btn-query:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}
.btn-reset:hover:not(:disabled) {
  border-color: #909399;
  color: #909399;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.metric {
  padding: 16px;
}
.k {
  color: var(--text-secondary);
  font-size: 12px;
}
.v {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
}
.tr {
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 1.2fr 0.9fr 0.8fr 1fr 1fr;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}
.tr:last-child {
  border-bottom: none;
}
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
.name .title {
  font-weight: 600;
  color: var(--text-primary);
}
.name .sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
.training-name {
  color: var(--text-primary);
}
.text-muted {
  color: var(--text-secondary);
  font-size: 12px;
}
.bar {
  height: 8px;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;
}
.bar.big { height: 12px; }
.fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, #66b1ff 100%);
}
.pct {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--text-secondary);
}
.badge.ok {
  border-color: rgba(103, 194, 58, 0.35);
  background: rgba(103, 194, 58, 0.1);
  color: #3f9c1f;
}
.badge.warn {
  border-color: rgba(230, 162, 60, 0.35);
  background: rgba(230, 162, 60, 0.12);
  color: #b36a00;
}
.badge.muted {
  background: #f5f7fa;
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.btn {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.18s ease-in-out;
  box-shadow: 0 1px 0 rgba(16,24,40,0.02), inset 0 0 0 rgba(0,0,0,0);
}
.btn.primary {
  background: linear-gradient(90deg, var(--primary-color) 0%, #66b1ff 100%);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 18px rgba(102,177,255,0.12);
}
.btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(102,177,255,0.16);
}
.btn:hover:not(.primary):not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-1px);
}
.empty-row {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
}
.loading-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
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
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}
.page-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}
.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog {
  background: white;
  border-radius: 10px;
  width: 92%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}
.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
}
.dialog-body {
  padding: 16px;
  overflow-y: auto;
  max-height: calc(90vh - 120px);
}
.detail-section {
  margin-bottom: 24px;
}
.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.info-item .label {
  color: var(--text-secondary);
  font-size: 14px;
}
.info-item .value {
  color: var(--text-primary);
  font-size: 14px;
}
.progress-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.progress-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.progress-item .label {
  min-width: 80px;
  color: var(--text-secondary);
  font-size: 14px;
}
.progress-bar {
  flex: 1;
  height: 10px;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, #66b1ff 100%);
}
.material-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.material-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
}
.material-id {
  min-width: 100px;
  font-size: 13px;
  color: var(--text-secondary);
}
.material-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.material-progress .progress-bar {
  flex: 1;
}
.progress-text {
  min-width: 40px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
}
.btn-cancel {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.18s;
  box-shadow: none;
}

.btn-confirm {
  padding: 10px 20px;
  background: linear-gradient(90deg, var(--primary-color) 0%, #66b1ff 100%);
  border: none;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 6px 18px rgba(102,177,255,0.12);
}
.btn-confirm:disabled, .btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }

.btn.danger {
  background: white;
  border: 1px solid var(--danger-color, #f56c6c);
  color: var(--danger-color, #f56c6c);
}
.btn.danger:hover:not(:disabled) {
  background: var(--danger-color, #f56c6c);
  color: #fff;
  border-color: transparent;
  transform: translateY(-1px);
}

@media (max-width: 980px) {
  .filters {
    flex-direction: column;
  }
  .tr {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .th {
    display: none;
  }
  .actions {
    justify-content: flex-start;
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
}

/* 手机端：进度列表卡片 */
@media (max-width: 768px) {
  .btn-primary { width: 100%; }
  .btn-query, .btn-reset { width: 100%; }
  .cards { grid-template-columns: 1fr; }
  .v { font-size: 22px; }

  .mobile-list { display: flex; flex-direction: column; gap: 12px; }
  .mobile-card {
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 14px;
    background: #fff;
  }
  .mc-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
  .mc-title .name { font-weight: 700; color: var(--text-primary); font-size: 15px; }
  .mc-title .sub { margin-top: 2px; font-size: 12px; color: var(--text-secondary); }
  .mc-row { display: flex; justify-content: space-between; gap: 10px; margin-top: 10px; }
  .mc-row .label { color: var(--text-secondary); font-size: 12px; }
  .mc-row .value { color: var(--text-primary); font-size: 13px; text-align: right; }
  .mc-progress { margin-top: 12px; }
  .mc-actions { margin-top: 12px; }
  .mc-actions .btn { width: 100%; padding: 12px; border-radius: 10px; font-size: 14px; }
  .empty-mobile { text-align: center; color: var(--text-secondary); padding: 20px; }
}
</style>
