<template>
  <div class="training-page">
    <div class="page-header">
      <h1 class="page-title">护理培训</h1>
      <div class="page-actions" v-if="canCreate">
        <button class="btn-primary" @click="openCreateDialog">创建培训</button>
        <button v-if="canDelete" class="btn-danger" @click="toggleDeleteMode">
          {{ deleteMode ? '完成删除' : '删除培训' }}
        </button>
      </div>
    </div>
    
    <div class="training-content">
      <div class="filter-bar">
        <input v-model="searchText" class="filter-input" placeholder="搜索培训名称/描述" @keyup.enter="load" />
        <input v-model="trainingTypeFilter" class="filter-input" placeholder="培训类型" @keyup.enter="load" />
        <select v-model="statusFilter" class="filter-select" @change="load">
          <option value="">全部状态</option>
          <option value="未开始">未开始</option>
          <option value="进行中">进行中</option>
          <option value="已完成">已完成</option>
        </select>
        <select v-model="requiredFilter" class="filter-select" @change="load">
          <option value="">全部</option>
          <option value="1">必修</option>
          <option value="0">选修</option>
        </select>
        <button class="btn-action" @click="load" :disabled="loading">查询</button>
      </div>
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
            <span>👨‍🎓 学员：{{ item.currentParticipants ?? 0 }} / {{ item.maxParticipants ?? '∞' }} 人</span>
            <span>📅 时间：{{ formatDate(item.startDate) }} ~ {{ formatDate(item.endDate) }}</span>
            <span>必修：{{ item.required === 1 ? '是' : '否' }}</span>
            <span>班级：{{ (item as any).classIds ? (item as any).classIds.length : 0 }}</span>
          </div>
          <div class="card-actions">
            <!-- 有管理权限：编辑 + 编辑内容 + 查看进度 -->
            <template v-if="canEdit || canEditMaterials || canViewProgress">
              <button v-if="canEdit" class="btn-view" @click="openEdit(item)">编辑培训</button>
              <button v-if="canEditMaterials" class="btn-join" @click="goEditContent(item)">编辑内容</button>
              <button v-if="canViewProgress" class="btn-join" @click="goProgress(item)">学习进度</button>
            </template>
            <!-- 学员：查看 + 开始学习 -->
            <template v-else>
              <button class="btn-view" @click="goDetail(item)">查看详情</button>
              <button class="btn-join" @click="goDetail(item)">开始学习</button>
            </template>
            <button
              v-if="deleteMode && canDelete"
              class="btn-delete-card"
              @click="removeOne(item)"
            >
              删除
            </button>
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

  <!-- 创建/编辑培训 -->
  <div v-if="showDialog" class="dialog-overlay" @click="showDialog = false">
    <div class="dialog" @click.stop>
      <div class="dialog-header">
        <h3>{{ dialogMode === 'add' ? '创建培训' : '编辑培训' }}</h3>
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
          <div class="form-row">
            <div class="form-group">
              <label>开始日期 *</label>
              <input type="date" class="form-input" v-model="form.startDate" />
            </div>
            <div class="form-group">
              <label>结束日期</label>
              <input type="date" class="form-input" v-model="form.endDate" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>学生上限</label>
              <input type="number" min="0" class="form-input" v-model.number="form.maxParticipants" />
            </div>
            <div class="form-group">
              <label>是否必修</label>
              <select class="form-input" v-model.number="form.required">
                <option :value="1">是</option>
                <option :value="0">否</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>讲师 *</label>
            <div class="form-row-inline">
              <input class="form-input" v-model="form.instructorName" :disabled="!isAdmin" placeholder="讲师姓名" />
              <button v-if="isAdmin" class="btn" @click="openPickInstructor">选择讲师</button>
            </div>
            <div class="hint-small" v-if="!isAdmin">由当前登录讲师账号自动作为讲师</div>
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea class="form-input" v-model="form.description" rows="3"></textarea>
          </div>
          <div class="form-group" v-if="canCreate">
            <label>指定可见班级</label>
            <div class="class-select-hint">不选择=全员可见；选择后仅指定班级学员可见</div>
            <div class="class-check-list">
              <label v-for="c in classOptions" :key="c.id" class="class-check-item">
                <input type="checkbox" :value="c.id" v-model="form.classIds" />
                <span>{{ c.className || c.classCode || '-' }}</span>
              </label>
              <span v-if="classOptions.length === 0 && !classLoading" class="hint-small">暂无班级，请先在班级管理中创建</span>
              <span v-if="classLoading" class="hint-small">加载中...</span>
            </div>
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

  <!-- 选择讲师 -->
  <div v-if="showPick" class="dialog-overlay" @click="closePick">
    <div class="dialog" @click.stop>
      <div class="dialog-header">
        <h3>选择讲师</h3>
        <button class="close-btn" @click="closePick">×</button>
      </div>
      <div class="dialog-body">
        <div class="filters">
          <input class="search-input" v-model="pickSearch" placeholder="搜索讲师姓名/手机号/员工号..." @keyup.enter="loadPickList" />
          <button class="btn" @click="loadPickList" :disabled="pickLoading">查询</button>
        </div>
        <div class="pick-list">
          <div class="pick-row" v-for="s in pickList" :key="s.id" @click="chooseInstructor(s)">
            <div class="pick-name">{{ s.studentName || '-' }}</div>
            <div class="pick-sub">手机号：{{ s.phone || '-' }}</div>
          </div>
          <div v-if="!pickLoading && pickList.length===0" class="empty">暂无讲师</div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn-cancel" @click="closePick">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getTrainingList, getTrainingDetail } from '@/api/training'
import { addTraining, updateTraining, deleteTraining } from '@/api/trainingAdmin'
import type { Training } from '@/api/training'
import { useAuthStore } from '@/stores/auth'
import { getStudentsList, type Students } from '@/api/students'
import { listTeachingClassesForAssign, type TeachingClass } from '@/api/teachingClass'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const list = ref<Training[]>([])
const page = ref(1)
const pageSize = ref(10)
const deleteMode = ref(false)
const searchText = ref('')
const trainingTypeFilter = ref('')
const statusFilter = ref('')
const requiredFilter = ref('')

const showDialog = ref(false)
const dialogMode = ref<'add'|'edit'>('add')
const form = reactive<Training & { startDate?: string; endDate?: string; instructorId?: string; instructorName?: string; classIds?: number[] }>({
  trainingName: '',
  trainingType: '',
  description: '',
  status: '未开始',
  startDate: '',
  endDate: '',
  instructorId: '',
  instructorName: '',
  classIds: []
})

const currentStudentRecord = ref<Students | null>(null)
const isAdmin = computed(() => (auth.userType || 0) === 1)
const isInstructor = computed(() => (currentStudentRecord.value?.userType || 0) === 2)
const canCreate = computed(() => auth.hasPermission('training:create') || isAdmin.value || isInstructor.value)
const canEdit = computed(() => auth.hasPermission('training:edit') || isAdmin.value || isInstructor.value)
const canEditMaterials = computed(() => auth.hasPermission('training:materials') || isAdmin.value || isInstructor.value)
const canViewProgress = computed(() => auth.hasPermission('training:progress') || isAdmin.value || isInstructor.value)
const canDelete = computed(() => auth.hasPermission('training:delete') || isAdmin.value || isInstructor.value)

const showPick = ref(false)
const pickSearch = ref('')
const pickLoading = ref(false)
const pickList = ref<Students[]>([])

const classOptions = ref<TeachingClass[]>([])
const classLoading = ref(false)

const load = async () => {
  // whenever loading fresh list due to query, start from first page
  if (page.value !== 1) page.value = 1
  loading.value = true
  try {
    const res = await getTrainingList({
      page: page.value,
      limit: pageSize.value,
      searchText: searchText.value || undefined,
      trainingType: trainingTypeFilter.value || undefined,
      status: statusFilter.value || undefined,
      required: requiredFilter.value || undefined
    })
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

const loadClassOptions = async () => {
  if (!canCreate.value) return
  classLoading.value = true
  try {
    const res = await listTeachingClassesForAssign({ page: 1, limit: 200 })
    classOptions.value = res.data || []
  } catch {
    classOptions.value = []
  } finally {
    classLoading.value = false
  }
}

const openCreateDialog = () => {
  dialogMode.value = 'add'
  Object.assign(form, {
    id: undefined,
    trainingName: '',
    trainingType: '',
    description: '',
    status: '未开始',
    startDate: '',
    endDate: '',
    instructorId: '',
    instructorName: '',
    classIds: []
  })
  // 讲师：默认讲师为自己
  if (!isAdmin.value && isInstructor.value && currentStudentRecord.value) {
    form.instructorId = String(currentStudentRecord.value.id)
    form.instructorName = currentStudentRecord.value.studentName || currentStudentRecord.value.phone || ''
  }
  loadClassOptions()
  showDialog.value = true
}

const toggleDeleteMode = () => {
  deleteMode.value = !deleteMode.value
}

const removeOne = async (item: Training) => {
  if (!item.id) return
  if (!confirm(`确定要删除培训「${item.trainingName || '-'}」吗？该培训的学习记录可能也会受影响。`)) {
    return
  }
  try {
    const res = await deleteTraining(String(item.id))
    if (res.code === 0 || res.code === 200) {
      alert('删除成功')
      load()
    } else {
      alert(res.msg || '删除失败')
    }
  } catch (e: any) {
    alert(e.message || '删除失败')
  }
}

const openEdit = async (item: Training) => {
  if (!item.id) return
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: item.id,
    trainingName: item.trainingName || '',
    trainingType: item.trainingType || '',
    description: item.description || '',
    status: item.status || '未开始',
    startDate: item.startDate ? String(item.startDate).substring(0, 10) : '',
    endDate: item.endDate ? String(item.endDate).substring(0, 10) : '',
    instructorId: item.instructorId || '',
    instructorName: item.instructorName || '',
    maxParticipants: item.maxParticipants,
    required: item.required || 0,
    classIds: (item as any).classIds || []
  })
  loadClassOptions()
  try {
    const res = await getTrainingDetail(item.id)
    if (res.data && (res.data as any).classIds) {
      form.classIds = (res.data as any).classIds
    }
  } catch {
    // 使用默认空
  }
  showDialog.value = true
}

const goProgress = (item: Training) => {
  if (!item.id) return
  router.push({ name: 'Progress', query: { trainingId: item.id } })
}

const goEditContent = (item: Training) => {
  if (!item.id) return
  router.push({ name: 'TrainingMaterialEditor', params: { id: item.id } })
}

const save = async () => {
  if (!form.trainingName?.trim()) {
    alert('请输入培训名称')
    return
  }
  if (!form.startDate) {
    alert('请选择开始日期')
    return
  }
  if (!form.instructorName?.trim()) {
    alert('请选择讲师')
    return
  }
  saving.value = true
  try {
    const api = dialogMode.value === 'edit' ? updateTraining : addTraining
    const res = await api(form)
    if (res.code === 0 || res.code === 200) {
      alert(dialogMode.value === 'edit' ? '保存成功' : '创建成功')
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

// 加载当前用户在 students 表中的记录（判断是否讲师）
const loadCurrentStudent = async () => {
  const phone = auth.userPhone || localStorage.getItem('userPhone') || ''
  if (!phone) return
  try {
    const res = await getStudentsList({ page: 1, limit: 1, phone })
    currentStudentRecord.value = (res.data && res.data.length > 0) ? res.data[0] : null
  } catch {
    currentStudentRecord.value = null
  }
}
onMounted(loadCurrentStudent)

const openPickInstructor = () => {
  pickSearch.value = ''
  showPick.value = true
  loadPickList()
}
const closePick = () => { showPick.value = false }

const loadPickList = async () => {
  pickLoading.value = true
  try {
    const res = await getStudentsList({ page: 1, limit: 200, searchText: pickSearch.value || undefined, userType: 2 })
    pickList.value = res.data || []
  } finally {
    pickLoading.value = false
  }
}

const chooseInstructor = (s: Students) => {
  form.instructorId = s.id ? String(s.id) : ''
  form.instructorName = s.studentName || s.phone || ''
  showPick.value = false
}
</script>

<style scoped>
.training-page {
  max-width: 100%;
}

.filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  align-items: center;
}
.filter-input, .filter-select {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
}
.filter-select { background: #fff; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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

.btn-danger {
  padding: 10px 20px;
  background: #f56c6c;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-danger:hover {
  background: #f78989;
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

.btn-delete-card {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #f56c6c;
  background: #fff5f5;
  color: #f56c6c;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.btn-delete-card:hover {
  background: #fde2e2;
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
.form-row { display:flex; gap:12px; }
.form-row-inline{display:flex;gap:8px;align-items:center;}
.hint-small{font-size:12px;color:var(--text-secondary);margin-top:4px;}
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
.class-select-hint { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
.class-check-list { max-height: 160px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px; padding: 8px; background: #f9fafb; }
.class-check-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; cursor: pointer; font-size: 14px; }
.class-check-item input { flex-shrink: 0; }

@media (max-width: 768px) {
  .training-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-title {
    font-size: 18px;
  }

  .btn-primary {
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
  }

  .training-card {
    padding: 16px;
    border-radius: 10px;
  }

  .card-header {
    align-items: flex-start;
    gap: 10px;
  }

  .card-title {
    font-size: 16px;
    line-height: 1.35;
  }

  .card-status {
    flex-shrink: 0;
  }

  .card-description {
    font-size: 13px;
    margin-bottom: 12px;
  }

  .card-info {
    font-size: 12px;
    gap: 6px;
    margin-bottom: 12px;
  }

  .card-actions {
    flex-direction: column;
    gap: 10px;
  }

  .btn-view, .btn-join {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
  }

  .pagination {
    flex-wrap: wrap;
    gap: 10px;
  }

  .page-btn {
    flex: 1;
    min-width: 120px;
    padding: 10px 14px;
    border-radius: 10px;
  }
}
</style>

