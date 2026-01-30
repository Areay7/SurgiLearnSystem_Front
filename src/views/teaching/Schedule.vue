<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">课程安排设置</h1>
      <button v-if="canManage" class="btn-primary" @click="openAdd">新建课程安排</button>
    </div>

    <div v-if="!canManage" class="permission-hint">
      你当前只有查看权限（学员仅可查看，讲师/管理员可新建与维护课程安排）。
    </div>

    <div class="filters">
      <select class="select" v-model="filterStatus" @change="load">
        <option value="">全部状态</option>
        <option value="未开始">未开始</option>
        <option value="进行中">进行中</option>
        <option value="已结束">已结束</option>
      </select>
      <input class="search-input" v-model="searchText" placeholder="搜索课程/讲师/地点..." @keyup.enter="load" />
      <button class="btn" @click="load" :disabled="loading">{{ loading ? '加载中...' : '查询' }}</button>
    </div>

    <div class="grid">
      <div class="card" v-for="c in courses" :key="c.id">
        <div class="card-head">
          <div>
            <div class="title">{{ c.courseName }}</div>
            <div class="sub">讲师：{{ c.instructorName || '-' }} · 地点：{{ c.classroom || '-' }}</div>
          </div>
          <span class="badge" :class="badgeClass((c.status || '未开始') as any)">{{ c.status || '未开始' }}</span>
        </div>
        <div class="meta">
          <div class="meta-item">
            <div class="k">日期</div>
            <div class="v">{{ c.scheduleDate || '-' }}</div>
          </div>
          <div class="meta-item">
            <div class="k">时间</div>
            <div class="v">{{ timeRange(c.startTime, c.endTime) }}</div>
          </div>
          <div class="meta-item">
            <div class="k">状态</div>
            <div class="v">{{ c.status || '-' }}</div>
          </div>
        </div>
        <div class="actions">
          <button class="btn" @click="openView(c)">查看</button>
          <button v-if="canManage" class="btn" @click="openEdit(c)">编辑</button>
          <button v-if="canManage" class="btn danger" @click="removeOne(c)" :disabled="!c.id">删除</button>
        </div>
      </div>
    </div>

    <!-- 新建/编辑/查看 -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '新建课程安排' : dialogMode === 'edit' ? '编辑课程安排' : '查看课程安排' }}</h3>
          <button class="close-btn" @click="closeDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group">
              <label>课程名称 *</label>
              <input class="form-input" v-model="form.courseName" :disabled="dialogMode==='view'" />
            </div>
            <div class="form-group">
              <label>讲师姓名 *</label>
              <input class="form-input" v-model="form.instructorName" :disabled="dialogMode==='view'" />
            </div>
            <div class="form-group">
              <label>地点</label>
              <input class="form-input" v-model="form.classroom" :disabled="dialogMode==='view'" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>日期 *</label>
                <input class="form-input" type="date" v-model="form.scheduleDate" :disabled="dialogMode==='view'" />
              </div>
              <div class="form-group">
                <label>开始</label>
                <input class="form-input" v-model="form.startTime" placeholder="例如 09:00" :disabled="dialogMode==='view'" />
              </div>
              <div class="form-group">
                <label>结束</label>
                <input class="form-input" v-model="form.endTime" placeholder="例如 11:00" :disabled="dialogMode==='view'" />
              </div>
            </div>
            <div class="form-group">
              <label>状态</label>
              <select class="form-input" v-model="form.status" :disabled="dialogMode==='view'">
                <option value="未开始">未开始</option>
                <option value="进行中">进行中</option>
                <option value="已结束">已结束</option>
              </select>
            </div>
            <div class="form-group">
              <label>备注</label>
              <textarea class="form-input" rows="3" v-model="form.description" :disabled="dialogMode==='view'"></textarea>
            </div>
          </div>
        </div>
        <div class="dialog-footer" v-if="dialogMode!=='view'">
          <button class="btn" @click="closeDialog">取消</button>
          <button class="btn-primary" @click="save" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getStudentsList, type Students } from '@/api/students'
import { addSchedule, deleteSchedule, listSchedule, type ScheduleItem, updateSchedule } from '@/api/schedule'

type CourseStatus = '未开始' | '进行中' | '已结束'

const auth = useAuthStore()
const currentStudentRecord = ref<Students | null>(null)

const isAdmin = computed(() => (auth.userType || 0) === 1)
const isInstructor = computed(() => (currentStudentRecord.value?.userType || 0) === 2)
const canManage = computed(() => isAdmin.value || isInstructor.value)

const courses = ref<ScheduleItem[]>([])
const loading = ref(false)
const saving = ref(false)
const searchText = ref('')
const filterStatus = ref('')

const showDialog = ref(false)
const dialogMode = ref<'add'|'edit'|'view'>('view')
const form = ref<ScheduleItem>({ status: '未开始' })

function badgeClass(status: CourseStatus) {
  if (status === '进行中') return 'warn'
  if (status === '未开始') return 'info'
  return 'muted'
}

function timeRange(start?: string, end?: string) {
  if (!start && !end) return '-'
  if (start && end) return `${start}-${end}`
  return start || end || '-'
}

const loadCurrentUserRole = async () => {
  // 讲师/学员角色来自学员档案表（userType: 1-学员 2-讲师 3-管理员）
  const phone = auth.userPhone || localStorage.getItem('userPhone') || ''
  if (!phone) return
  try {
    const res = await getStudentsList({ page: 1, limit: 1, phone })
    currentStudentRecord.value = (res.data && res.data.length > 0) ? res.data[0] : null
  } catch {
    currentStudentRecord.value = null
  }
}

onMounted(loadCurrentUserRole)

const load = async () => {
  loading.value = true
  try {
    const res = await listSchedule({ page: 1, limit: 50, searchText: searchText.value || undefined, status: filterStatus.value || undefined })
    courses.value = res.data || []
  } finally {
    loading.value = false
  }
}

onMounted(load)

// 自动刷新：让“到点开始/结束”在前端无需手动刷新即可看到变化
let autoRefreshTimer: number | undefined
onMounted(() => {
  autoRefreshTimer = window.setInterval(() => {
    // 避免用户正在编辑时打断体验
    if (showDialog.value) return
    load()
  }, 30_000)
})
onUnmounted(() => {
  if (autoRefreshTimer) window.clearInterval(autoRefreshTimer)
})

const openAdd = () => {
  dialogMode.value = 'add'
  form.value = { status: '未开始' }
  showDialog.value = true
}
const openEdit = (c: ScheduleItem) => {
  dialogMode.value = 'edit'
  form.value = { ...c }
  showDialog.value = true
}
const openView = (c: ScheduleItem) => {
  dialogMode.value = 'view'
  form.value = { ...c }
  showDialog.value = true
}
const closeDialog = () => { showDialog.value = false }

const save = async () => {
  if (!form.value.courseName?.trim()) return alert('请输入课程名称')
  if (!form.value.instructorName?.trim()) return alert('请输入讲师姓名')
  if (!form.value.scheduleDate) return alert('请选择日期')
  saving.value = true
  try {
    const res = dialogMode.value === 'add' ? await addSchedule(form.value) : await updateSchedule(form.value)
    if (res.code === 200 || res.code === 0) {
      alert('保存成功')
      showDialog.value = false
      await load()
    } else {
      alert(res.msg || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

const removeOne = async (c: ScheduleItem) => {
  if (!c.id) return
  if (!confirm('确定删除该课程安排吗？')) return
  const res = await deleteSchedule(String(c.id))
  if (res.code === 200 || res.code === 0) {
    alert('删除成功')
    load()
  } else {
    alert(res.msg || '删除失败')
  }
}
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
.btn-primary:hover {
  background: #66b1ff;
}
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.select,
.search-input {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.search-input {
  flex: 1;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
}
.card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}
.title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}
.sub {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 12px;
}
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  background: #fff;
  white-space: nowrap;
}
.badge.warn {
  border-color: rgba(230, 162, 60, 0.35);
  background: rgba(230, 162, 60, 0.12);
  color: #b36a00;
}
.badge.info {
  border-color: rgba(64, 158, 255, 0.35);
  background: rgba(64, 158, 255, 0.12);
  color: #1d7fd7;
}
.badge.muted {
  background: #f5f7fa;
}
.meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}
.meta-item .k {
  font-size: 12px;
  color: var(--text-secondary);
}
.meta-item .v {
  margin-top: 4px;
  color: var(--text-regular);
}
.actions {
  display: flex;
  gap: 8px;
}
.btn {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}
.btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}
.btn.danger:hover {
  border-color: var(--danger-color);
  color: var(--danger-color);
}
.permission-hint{
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px dashed rgba(64, 158, 255, 0.35);
  background: rgba(64, 158, 255, 0.08);
  color: var(--text-secondary);
  font-size: 13px;
}
.dialog-overlay{position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000;}
.dialog{background:#fff; width:92%; max-width:900px; border-radius:14px; overflow:hidden;}
.dialog-header{display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-bottom:1px solid var(--border-color);}
.dialog-body{padding:16px;}
.dialog-footer{display:flex; justify-content:flex-end; gap:10px; padding:14px 16px; border-top:1px solid var(--border-color);}
.close-btn{border:none; background:transparent; font-size:22px; cursor:pointer;}
.form-grid{display:grid; gap:12px;}
.form-row{display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;}
.form-group label{display:block; font-size:12px; color:var(--text-secondary); margin-bottom:6px;}
.form-input{width:100%; padding:10px 12px; border:1px solid var(--border-color); border-radius:10px; font-size:14px;}
.hint {
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 12px;
}
@media (max-width: 900px) {
  .filters {
    flex-direction: column;
  }
  .meta {
    grid-template-columns: 1fr;
  }
  .form-row{grid-template-columns:1fr;}
}
</style>


