<template>
  <div class="exam-records-page">
    <div class="page-header">
      <h1 class="page-title">考试记录</h1>
      <div class="header-actions">
        <button class="btn" @click="goBack">返回考试系统</button>
      </div>
    </div>

    <div class="search-form">
      <div class="form-row">
        <div class="form-item">
          <label>考试：</label>
          <select class="form-input" v-model="searchForm.examId">
            <option :value="undefined">全部考试</option>
            <option v-for="e in examOptions" :key="e.id" :value="e.id">{{ e.examName }}</option>
          </select>
        </div>
        <div class="form-item">
          <label>学员：</label>
          <input
            type="text"
            class="form-input"
            placeholder="姓名或手机号"
            v-model="searchForm.studentKeyword"
          />
        </div>
        <div class="form-item">
          <label>状态：</label>
          <select class="form-input" v-model="searchForm.status">
            <option value="">全部</option>
            <option value="进行中">进行中</option>
            <option value="已完成">已完成</option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn-query" @click="loadData" :disabled="loading">查询</button>
          <button class="btn-reset" @click="handleReset" :disabled="loading">重置</button>
        </div>
      </div>
    </div>

    <div class="loading-overlay" v-if="loading">
      <span>加载中...</span>
    </div>
    <div class="table-container" v-show="!loading">
      <table class="data-table">
        <thead>
          <tr>
            <th width="60">序号</th>
            <th width="200">考试名称</th>
            <th width="120">学员姓名</th>
            <th width="130">学员手机</th>
            <th width="80">总分</th>
            <th width="80">得分</th>
            <th width="80">及格分</th>
            <th width="100">状态</th>
            <th width="100">用时(分钟)</th>
            <th width="160">提交时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="records.length === 0">
            <td colspan="10" class="empty-state">暂无考试记录</td>
          </tr>
          <tr v-for="(row, index) in records" :key="row.id || index" class="table-row">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ row.examName || '-' }}</td>
            <td>{{ row.studentName || '-' }}</td>
            <td>{{ row.studentId || '-' }}</td>
            <td>{{ row.totalScore ?? '-' }}</td>
            <td>
              <span :class="getScoreClass(row)">{{ row.obtainedScore ?? '-' }}</span>
            </td>
            <td>{{ row.passScore ?? '-' }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(row.status)">
                {{ row.status || '-' }}
              </span>
            </td>
            <td>{{ row.duration ?? '-' }}</td>
            <td>{{ formatDateTime(row.submitTime) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button class="page-btn" @click="prevPage" :disabled="currentPage <= 1 || loading">上一页</button>
      <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
      <button class="page-btn" @click="nextPage" :disabled="currentPage >= totalPages || loading">下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getExamResultList } from '@/api/examResult'
import type { ExamResult } from '@/api/examResult'
import { getExamList } from '@/api/exam'
import type { Exam } from '@/api/exam'

const router = useRouter()
const loading = ref(false)
const records = ref<ExamResult[]>([])
const examOptions = ref<Exam[]>([])

const currentPage = ref(1)
const pageSize = ref(15)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const searchForm = reactive({
  examId: undefined as number | undefined,
  studentKeyword: '',
  status: ''
})

const loadExamOptions = async () => {
  try {
    const res = await getExamList({ page: 1, limit: 200 })
    examOptions.value = res.data || []
  } catch {
    examOptions.value = []
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    }
    if (searchForm.examId) params.examId = searchForm.examId
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.studentKeyword?.trim()) params.studentKeyword = searchForm.studentKeyword.trim()

    const res = await getExamResultList(params)
    if (res.code === 0 || res.code === 200) {
      records.value = res.data || []
      total.value = res.count || 0
    } else {
      records.value = []
    }
  } catch (e: any) {
    records.value = []
    alert(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  searchForm.examId = undefined
  searchForm.studentKeyword = ''
  searchForm.status = ''
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

const goBack = () => router.push('/exam')

const formatDateTime = (s?: string) => {
  if (!s) return '-'
  try {
    const d = new Date(s)
    return d.toLocaleString('zh-CN').replace(/\//g, '-')
  } catch {
    return s
  }
}

const getScoreClass = (row: ExamResult) => {
  const score = row.obtainedScore ?? 0
  const pass = row.passScore ?? 0
  if (score >= pass) return 'score-pass'
  return 'score-fail'
}

const getStatusClass = (status?: string) => {
  if (status === '已完成') return 'status-done'
  if (status === '进行中') return 'status-ongoing'
  return ''
}

onMounted(() => {
  loadExamOptions()
  loadData()
})
</script>

<style scoped>
.exam-records-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  margin: 0;
}

.search-form {
  background: var(--card-bg);
  padding: 16px;
  border-radius: 10px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-item label {
  white-space: nowrap;
  font-size: 14px;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  min-width: 140px;
}

.form-actions {
  display: flex;
  gap: 8px;
}

.btn-query, .btn-reset {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.btn-query {
  background: var(--primary-color);
  color: white;
  border: none;
}

.btn-reset {
  background: #f5f5f5;
  border: 1px solid var(--border-color);
}

.table-container {
  background: var(--card-bg);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.data-table th {
  background: #f8f9fa;
  font-weight: 500;
  color: var(--text-regular);
}

.data-table tbody tr:hover {
  background: #fafafa;
}

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: var(--text-secondary);
}

.score-pass { color: #22c55e; font-weight: 500; }
.score-fail { color: #ef4444; font-weight: 500; }

.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.status-done { background: #dcfce7; color: #166534; }
.status-ongoing { background: #fef3c7; color: #92400e; }

.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: var(--card-bg);
  border-radius: 10px;
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

.page-btn {
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  background: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
