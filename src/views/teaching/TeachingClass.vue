<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">班级管理</h1>
      <button class="btn-primary" @click="openAdd">新建班级</button>
    </div>

    <div class="filters">
      <input class="search-input" v-model="searchText" placeholder="搜索班级名称/编码..." @keyup.enter="load" />
      <button class="btn" @click="load" :disabled="loading">{{ loading ? '加载中...' : '查询' }}</button>
    </div>

    <div class="layout">
      <div class="left">
        <div class="card list">
          <div class="row" v-for="c in classes" :key="c.id" :class="{ active: c.id === selectedId }" @click="selectClass(c)">
            <div class="name">{{ c.className }}</div>
            <div class="meta">
              <span>编码：{{ c.classCode || '-' }}</span>
              <span>状态：{{ c.status || '-' }}</span>
            </div>
          </div>
          <div v-if="!loading && classes.length === 0" class="empty">暂无班级</div>
        </div>
      </div>

      <div class="right">
        <div v-if="!selectedId" class="placeholder">请选择左侧班级，查看讲师与学员</div>

        <div v-else class="card detail">
          <div class="detail-head">
            <div>
              <div class="detail-title">{{ selected?.className }}</div>
              <div class="detail-sub">{{ selected?.description || '暂无描述' }}</div>
            </div>
            <div class="detail-actions">
              <button class="btn" @click="openEdit" :disabled="!selected">编辑</button>
              <button class="btn danger" @click="removeOne" :disabled="!selected?.id">删除</button>
            </div>
          </div>

          <div class="tabs">
            <button class="tab" :class="{on: activeTab==='students'}" @click="activeTab='students'">学员</button>
            <button class="tab" :class="{on: activeTab==='instructors'}" @click="activeTab='instructors'">讲师</button>
          </div>

          <div v-if="activeTab==='students'" class="section">
            <div class="section-head">
              <div class="section-title">学员列表（{{ classStudents.length }}）</div>
              <div class="section-actions">
                <button class="btn" @click="openPick('student')">批量添加学员</button>
                <button class="btn danger" @click="batchRemoveSelected('student')" :disabled="selectedStudentIds.length===0">批量删除</button>
              </div>
            </div>
            <div class="table">
              <label class="check-row" v-for="s in classStudents" :key="s.id">
                <input type="checkbox" :value="s.id" v-model="selectedStudentIds" />
                <span class="who">{{ s.studentName || '-' }}</span>
                <span class="sub">手机号：{{ s.phone || '-' }}</span>
              </label>
              <div v-if="classStudents.length===0" class="empty">暂无学员</div>
            </div>
          </div>

          <div v-else class="section">
            <div class="section-head">
              <div class="section-title">讲师列表（{{ classInstructors.length }}）</div>
              <div class="section-actions">
                <button class="btn" @click="openPick('instructor')">添加讲师</button>
                <button class="btn danger" @click="batchRemoveSelected('instructor')" :disabled="selectedInstructorIds.length===0">批量删除</button>
              </div>
            </div>
            <div class="table">
              <label class="check-row" v-for="s in classInstructors" :key="s.id">
                <input type="checkbox" :value="s.id" v-model="selectedInstructorIds" />
                <span class="who">{{ s.studentName || '-' }}</span>
                <span class="sub">手机号：{{ s.phone || '-' }}</span>
              </label>
              <div v-if="classInstructors.length===0" class="empty">暂无讲师</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑班级 -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ dialogMode==='add' ? '新建班级' : '编辑班级' }}</h3>
          <button class="close-btn" @click="closeDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group">
              <label>班级名称 *</label>
              <input class="form-input" v-model="form.className" />
            </div>
            <div class="form-group">
              <label>班级编码</label>
              <input class="form-input" v-model="form.classCode" />
            </div>
            <div class="form-group">
              <label>状态</label>
              <select class="form-input" v-model="form.status">
                <option value="正常">正常</option>
                <option value="停用">停用</option>
              </select>
            </div>
            <div class="form-group">
              <label>描述</label>
              <textarea class="form-input" rows="3" v-model="form.description"></textarea>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="closeDialog">取消</button>
          <button class="btn-primary" @click="saveClass" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>

    <!-- 选择人员（批量添加） -->
    <div v-if="showPick" class="dialog-overlay" @click="closePick">
      <div class="dialog pick" @click.stop>
        <div class="dialog-header">
          <h3>{{ pickMode==='student' ? '批量选择学员' : '选择讲师' }}</h3>
          <button class="close-btn" @click="closePick">×</button>
        </div>
        <div class="dialog-body">
          <div class="filters">
            <input class="search-input" v-model="pickSearch" placeholder="搜索姓名/手机号/员工号..." @keyup.enter="loadPickList" />
            <button class="btn" @click="loadPickList" :disabled="pickLoading">查询</button>
          </div>
          <div class="table">
            <label class="check-row" v-for="s in pickList" :key="s.id">
              <input type="checkbox" :value="s.id" v-model="pickSelectedIds" />
              <span class="who">{{ s.studentName || '-' }}</span>
              <span class="sub">手机号：{{ s.phone || '-' }}</span>
            </label>
            <div v-if="!pickLoading && pickList.length===0" class="empty">暂无可选人员</div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="closePick">取消</button>
          <button class="btn-primary" @click="confirmPick" :disabled="pickSelectedIds.length===0">确定添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getStudentsList, type Students } from '@/api/students'
import {
  addTeachingClass,
  batchAddClassInstructors,
  batchAddClassStudents,
  batchRemoveClassInstructors,
  batchRemoveClassStudents,
  deleteTeachingClass,
  listClassInstructors,
  listClassStudents,
  listTeachingClasses,
  updateTeachingClass,
  type TeachingClass
} from '@/api/teachingClass'

const loading = ref(false)
const saving = ref(false)
const searchText = ref('')
const classes = ref<TeachingClass[]>([])
const selectedId = ref<number | null>(null)
const selected = ref<TeachingClass | null>(null)

const activeTab = ref<'students' | 'instructors'>('students')
const classStudents = ref<Students[]>([])
const classInstructors = ref<Students[]>([])
const selectedStudentIds = ref<number[]>([])
const selectedInstructorIds = ref<number[]>([])

const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const form = reactive<TeachingClass>({ status: '正常' })

const showPick = ref(false)
const pickMode = ref<'student' | 'instructor'>('student')
const pickSearch = ref('')
const pickLoading = ref(false)
const pickList = ref<Students[]>([])
const pickSelectedIds = ref<number[]>([])

const load = async () => {
  loading.value = true
  try {
    const res = await listTeachingClasses({ page: 1, limit: 200, searchText: searchText.value || undefined })
    classes.value = res.data || []
  } finally {
    loading.value = false
  }
}

const selectClass = async (c: TeachingClass) => {
  selectedId.value = c.id || null
  selected.value = c
  selectedStudentIds.value = []
  selectedInstructorIds.value = []
  await refreshMembers()
}

const refreshMembers = async () => {
  if (!selectedId.value) return
  const [a, b] = await Promise.all([
    listClassStudents(selectedId.value),
    listClassInstructors(selectedId.value)
  ])
  classStudents.value = (a.data as any) || []
  classInstructors.value = (b.data as any) || []
}

const openAdd = () => {
  dialogMode.value = 'add'
  Object.assign(form, { id: undefined, className: '', classCode: '', description: '', status: '正常' })
  showDialog.value = true
}
const openEdit = () => {
  if (!selected.value) return
  dialogMode.value = 'edit'
  Object.assign(form, { ...selected.value })
  showDialog.value = true
}
const closeDialog = () => { showDialog.value = false }

const saveClass = async () => {
  if (!form.className?.trim()) return alert('请输入班级名称')
  saving.value = true
  try {
    const res = dialogMode.value === 'add' ? await addTeachingClass(form) : await updateTeachingClass(form)
    if (res.code === 200 || res.code === 0) {
      showDialog.value = false
      await load()
    } else {
      alert(res.msg || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

const removeOne = async () => {
  if (!selected.value?.id) return
  if (!confirm('确定删除该班级吗？（会同时清空关联学员/讲师）')) return
  const res = await deleteTeachingClass(String(selected.value.id))
  if (res.code === 200 || res.code === 0) {
    selectedId.value = null
    selected.value = null
    classStudents.value = []
    classInstructors.value = []
    await load()
  } else {
    alert(res.msg || '删除失败')
  }
}

const openPick = (mode: 'student' | 'instructor') => {
  pickMode.value = mode
  pickSearch.value = ''
  pickSelectedIds.value = []
  showPick.value = true
  loadPickList()
}
const closePick = () => { showPick.value = false }

const loadPickList = async () => {
  pickLoading.value = true
  try {
    const userType = pickMode.value === 'student' ? 1 : 2
    const res = await getStudentsList({ page: 1, limit: 200, searchText: pickSearch.value || undefined, userType })
    pickList.value = res.data || []
  } finally {
    pickLoading.value = false
  }
}

const confirmPick = async () => {
  if (!selectedId.value) return
  const ids = pickSelectedIds.value
  const res = pickMode.value === 'student'
    ? await batchAddClassStudents(selectedId.value, ids)
    : await batchAddClassInstructors(selectedId.value, ids)
  if (res.code === 200 || res.code === 0) {
    showPick.value = false
    await refreshMembers()
  } else {
    alert(res.msg || '添加失败')
  }
}

const batchRemoveSelected = async (mode: 'student' | 'instructor') => {
  if (!selectedId.value) return
  const ids = mode === 'student' ? selectedStudentIds.value : selectedInstructorIds.value
  if (ids.length === 0) return
  if (!confirm('确定批量删除所选人员吗？')) return
  const res = mode === 'student'
    ? await batchRemoveClassStudents(selectedId.value, ids)
    : await batchRemoveClassInstructors(selectedId.value, ids)
  if (res.code === 200 || res.code === 0) {
    if (mode === 'student') selectedStudentIds.value = []
    else selectedInstructorIds.value = []
    await refreshMembers()
  } else {
    alert(res.msg || '删除失败')
  }
}

onMounted(load)
</script>

<style scoped>
.page-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;}
.page-title{font-size:24px;font-weight:700;color:var(--text-primary);}
.filters{display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap;}
.search-input{flex:1;min-width:220px;padding:10px 12px;border:1px solid var(--border-color);border-radius:10px;}
.btn-primary{padding:10px 14px;background:var(--primary-color);color:#fff;border:none;border-radius:10px;cursor:pointer;}
.btn{padding:10px 12px;border:1px solid var(--border-color);background:#fff;border-radius:10px;cursor:pointer;}
.btn.danger{border-color:rgba(245,108,108,0.35);color:var(--danger-color);}
.layout{display:grid;grid-template-columns:360px 1fr;gap:12px;align-items:start;}
.card{background:#fff;border:1px solid var(--border-color);border-radius:12px;}
.list{overflow:hidden;}
.row{padding:12px 12px;border-bottom:1px solid var(--border-color);cursor:pointer;}
.row:last-child{border-bottom:none;}
.row.active{background:rgba(64,158,255,0.08);}
.name{font-weight:700;color:var(--text-primary);}
.meta{margin-top:6px;color:var(--text-secondary);font-size:12px;display:flex;gap:12px;flex-wrap:wrap;}
.placeholder{padding:20px;color:var(--text-secondary);background:#fff;border:1px dashed var(--border-color);border-radius:12px;}
.detail{padding:12px;}
.detail-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;}
.detail-title{font-weight:800;font-size:16px;}
.detail-sub{margin-top:6px;color:var(--text-secondary);font-size:12px;}
.detail-actions{display:flex;gap:8px;flex-wrap:wrap;}
.tabs{display:flex;gap:8px;margin-top:12px;}
.tab{padding:8px 10px;border:1px solid var(--border-color);background:#fff;border-radius:10px;cursor:pointer;}
.tab.on{border-color:var(--primary-color);color:var(--primary-color);background:rgba(64,158,255,0.08);}
.section{margin-top:12px;}
.section-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px;}
.section-title{font-weight:700;}
.section-actions{display:flex;gap:8px;flex-wrap:wrap;}
.table{border:1px solid var(--border-color);border-radius:12px;overflow:hidden;}
.check-row{display:flex;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--border-color);}
.check-row:last-child{border-bottom:none;}
.who{flex:0 0 auto;font-weight:600;}
.sub{color:var(--text-secondary);font-size:12px;}
.empty{padding:14px;text-align:center;color:var(--text-secondary);}
.dialog-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;}
.dialog{width:92%;max-width:860px;background:#fff;border-radius:14px;overflow:hidden;}
.dialog.pick{max-width:760px;}
.dialog-header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border-color);}
.dialog-body{padding:16px;}
.dialog-footer{display:flex;justify-content:flex-end;gap:10px;padding:14px 16px;border-top:1px solid var(--border-color);}
.close-btn{border:none;background:transparent;font-size:22px;cursor:pointer;}
.form-grid{display:grid;gap:12px;}
.form-group label{display:block;font-size:12px;color:var(--text-secondary);margin-bottom:6px;}
.form-input{width:100%;padding:10px 12px;border:1px solid var(--border-color);border-radius:10px;}
@media (max-width: 900px){.layout{grid-template-columns:1fr;}}
</style>

