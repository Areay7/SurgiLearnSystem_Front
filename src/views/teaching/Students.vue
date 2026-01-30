<template>
  <div class="students-page">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <div class="header-actions">
        <button class="btn-primary" @click="openAddDialog">新增用户</button>
        <button class="btn-action" @click="handleDeleteSelected" v-if="selectedIds.length > 0">删除选中</button>
      </div>
    </div>
    
    <div class="students-content">
      <!-- 搜索表单 -->
      <div class="search-form">
        <div class="form-row">
          <div class="form-item">
            <label>姓名：</label>
            <input 
              type="text" 
              placeholder="请输入姓名" 
              class="form-input" 
              v-model="searchForm.studentName" 
            />
          </div>
          <div class="form-item">
            <label>手机号：</label>
            <input 
              type="text" 
              placeholder="请输入手机号" 
              class="form-input" 
              v-model="searchForm.phone" 
            />
          </div>
          <div class="form-item">
            <label>员工编号：</label>
            <input 
              type="text" 
              placeholder="请输入员工编号" 
              class="form-input" 
              v-model="searchForm.employeeId" 
            />
          </div>
          <div class="form-item">
            <label>用户类型：</label>
            <select class="form-input" v-model="searchForm.userType">
              <option :value="undefined">全部</option>
              <option :value="1">学员</option>
              <option :value="2">讲师</option>
              <option :value="3">其他(管理员)</option>
            </select>
          </div>
          <div class="form-item">
            <label>状态：</label>
            <select class="form-input" v-model="searchForm.status">
              <option value="">全部</option>
              <option value="正常">正常</option>
              <option value="停用">停用</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn-query" @click="handleSearch" :disabled="loading">查询</button>
            <button class="btn-reset" @click="handleReset" :disabled="loading">重置</button>
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
                  :checked="selectedIds.length === students.length && students.length > 0"
                />
              </th>
              <th width="60">序号</th>
              <th width="180">操作</th>
              <th width="100">ID</th>
              <th width="120">姓名</th>
              <th width="120">手机号</th>
              <th width="120">员工编号</th>
              <th width="100">用户类型</th>
              <th width="100">部门</th>
              <th width="100">职位</th>
              <th width="100">状态</th>
              <th width="180">注册时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="students.length === 0">
              <td colspan="12" class="empty-state">
                <p>暂无数据</p>
              </td>
            </tr>
            <tr v-for="(row, index) in students" :key="row.id || index" class="table-row">
              <td>
                <input type="checkbox" :value="row.id" v-model="selectedIds" />
              </td>
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>
                <button class="btn-link" @click="openEditDialog(row)">编辑</button>
                <button class="btn-link btn-danger" @click="handleDeleteSingle(row)">删除</button>
                <button
                  v-if="isAdmin"
                  class="btn-link"
                  @click="openResetPasswordDialog(row)"
                >
                  重置密码
                </button>
              </td>
              <td>{{ row.studentId || row.id || '-' }}</td>
              <td>{{ row.studentName || '-' }}</td>
              <td>{{ row.phone || '-' }}</td>
              <td>{{ row.employeeId || '-' }}</td>
              <td>
                <span :class="getUserTypeClass(row.userType)">
                  {{ getUserTypeName(row.userType) }}
                </span>
              </td>
              <td>{{ row.department || '-' }}</td>
              <td>{{ row.position || '-' }}</td>
              <td>
                <span class="status-badge" :class="row.status === '正常' ? 'active' : 'inactive'">
                  {{ row.status || '-' }}
                </span>
              </td>
              <td>{{ formatDateTime(row.createTime) }}</td>
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
    
    <!-- 新增/编辑对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click="showDialog = false">
      <div class="dialog edit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '新增用户' : '编辑用户' }}</h3>
          <button class="close-btn" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="edit-form-grid">
            <div class="form-column">
              <div class="form-group">
                <label>ID：</label>
                <input type="text" class="form-input" :value="editForm.id ?? '-'" disabled />
              </div>
              <div class="form-group">
                <label>姓名 *</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入姓名"
                  v-model="editForm.studentName"
                  maxlength="100"
                  :disabled="saving"
                />
              </div>
              <div class="form-group">
                <label>手机号 *</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入手机号"
                  v-model="editForm.phone"
                  maxlength="20"
                  :disabled="saving"
                />
              </div>
              <div class="form-group">
                <label>邮箱</label>
                <input
                  type="email"
                  class="form-input"
                  placeholder="请输入邮箱"
                  v-model="editForm.email"
                  maxlength="100"
                  :disabled="saving"
                />
              </div>
              <div class="form-group">
                <label>性别</label>
                <select class="form-input" v-model="editForm.gender" :disabled="saving">
                  <option value="">请选择</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div class="form-group">
                <label>出生日期</label>
                <input
                  type="date"
                  class="form-input"
                  v-model="editForm.birthDate"
                  :disabled="saving"
                />
              </div>
            </div>
            <div class="form-column">
              <div class="form-group">
                <label>部门</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入部门"
                  v-model="editForm.department"
                  maxlength="100"
                  :disabled="saving"
                />
              </div>
              <div class="form-group">
                <label>职位</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入职位"
                  v-model="editForm.position"
                  maxlength="100"
                  :disabled="saving"
                />
              </div>
              <div class="form-group">
                <label>员工编号</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="请输入员工编号"
                  v-model="editForm.employeeId"
                  maxlength="50"
                  :disabled="saving"
                />
              </div>
              <div class="form-group">
                <label>用户类型 *</label>
                <select class="form-input" v-model="editForm.userType" :disabled="saving">
                  <option :value="1">学员</option>
                  <option :value="2">讲师</option>
                  <option :value="3">其他(管理员)</option>
                </select>
              </div>
              <div class="form-group">
                <label>状态</label>
                <select class="form-input" v-model="editForm.status" :disabled="saving">
                  <option value="正常">正常</option>
                  <option value="停用">停用</option>
                </select>
              </div>
              <div class="form-group">
                <label>入学日期</label>
                <input
                  type="date"
                  class="form-input"
                  v-model="editForm.enrollmentDate"
                  :disabled="saving"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showDialog = false" :disabled="saving">取消</button>
          <button class="btn-confirm" @click="handleSave" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 重置密码对话框 -->
    <div v-if="showResetDialog" class="dialog-overlay" @click="showResetDialog = false">
      <div class="dialog" @click.stop style="max-width: 420px;">
        <div class="dialog-header">
          <h3>重置密码</h3>
          <button class="close-btn" @click="showResetDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <p class="reset-hint">为 <strong>{{ resetTargetName }}</strong>（{{ resetTargetPhone }}）设置新密码</p>
          <div class="form-group">
            <label>新密码 *</label>
            <input
              v-model="resetPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              class="form-input"
              maxlength="50"
              :disabled="resetting"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showResetDialog = false" :disabled="resetting">取消</button>
          <button class="btn-confirm" @click="confirmResetPassword" :disabled="resetting">
            {{ resetting ? '重置中...' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { Students } from '@/api/students'
import { addStudent, deleteStudent, getStudentsList, updateStudent } from '@/api/students'
import { useAuthStore } from '@/stores/auth'
import { adminResetPassword } from '@/api/auth'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.userType === 1)

const loading = ref(false)
const saving = ref(false)

const students = ref<Students[]>([])
const selectedIds = ref<number[]>([])

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const totalPages = computed(() => {
  const t = Math.ceil(total.value / pageSize.value)
  return t <= 0 ? 1 : t
})

const searchForm = reactive({
  studentName: '',
  phone: '',
  employeeId: '',
  userType: undefined as number | undefined,
  status: ''
})

const showDialog = ref(false)
const showResetDialog = ref(false)
const resetTargetPhone = ref('')
const resetTargetName = ref('')
const resetPassword = ref('')
const resetting = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editForm = reactive<Students>({
  studentName: '',
  phone: '',
  email: '',
  gender: '',
  birthDate: '',
  department: '',
  position: '',
  employeeId: '',
  userType: 1,
  status: '正常',
  enrollmentDate: ''
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const response = await getStudentsList({
      page: currentPage.value,
      limit: pageSize.value,
      studentName: searchForm.studentName || undefined,
      phone: searchForm.phone || undefined,
      employeeId: searchForm.employeeId || undefined,
      userType: searchForm.userType,
      status: searchForm.status || undefined
    })
    
    if (response.code === 0 || response.code === 200) {
      students.value = response.data || []
      total.value = response.count || 0
    } else {
      console.error('加载数据失败:', response.msg)
      alert(response.msg || '加载数据失败')
    }
  } catch (error: any) {
    console.error('加载数据错误:', error)
    alert(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.studentName = ''
  searchForm.phone = ''
  searchForm.employeeId = ''
  searchForm.userType = undefined
  searchForm.status = ''
  currentPage.value = 1
  loadData()
}

// 全选
const handleSelectAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    selectedIds.value = students.value.map(s => s.id!).filter(id => id !== undefined)
  } else {
    selectedIds.value = []
  }
}

// 打开新增对话框
const openAddDialog = () => {
  dialogMode.value = 'add'
  Object.assign(editForm, {
    id: undefined,
    studentName: '',
    phone: '',
    email: '',
    gender: '',
    birthDate: '',
    department: '',
    position: '',
    employeeId: '',
    userType: 1,
    status: '正常',
    enrollmentDate: ''
  })
  showDialog.value = true
}

// 打开编辑对话框
const openEditDialog = (row: Students) => {
  dialogMode.value = 'edit'
  Object.assign(editForm, {
    ...row,
    birthDate: row.birthDate ? row.birthDate.split('T')[0] : '',
    enrollmentDate: row.enrollmentDate ? row.enrollmentDate.split('T')[0] : ''
  })
  showDialog.value = true
}

// 保存
const handleSave = async () => {
  if (!editForm.studentName?.trim()) {
    alert('请输入姓名')
    return
  }
  if (!editForm.phone?.trim()) {
    alert('请输入手机号')
    return
  }
  if (!editForm.userType) {
    alert('请选择用户类型')
    return
  }
  
  saving.value = true
  try {
    const data = { ...editForm }
    // 确保日期格式正确
    if (data.birthDate && !data.birthDate.includes('T')) {
      data.birthDate = data.birthDate + 'T00:00:00'
    }
    if (data.enrollmentDate && !data.enrollmentDate.includes('T')) {
      data.enrollmentDate = data.enrollmentDate + 'T00:00:00'
    }
    
    let response
    if (dialogMode.value === 'add') {
      response = await addStudent(data)
    } else {
      response = await updateStudent(data)
    }
    
    if (response.code === 200 || response.code === 0) {
      alert(dialogMode.value === 'add' ? '新增成功' : '更新成功')
      showDialog.value = false
      loadData()
    } else {
      alert(response.msg || '操作失败')
    }
  } catch (error: any) {
    console.error('保存错误:', error)
    alert(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 删除单个
const handleDeleteSingle = (row: Students) => {
  if (!row.id) return
  if (confirm(`确定要删除用户 "${row.studentName || row.phone}" 吗？`)) {
    handleDelete([row.id])
  }
}

// 打开重置密码对话框
const openResetPasswordDialog = (row: Students) => {
  if (!row.phone?.trim()) {
    alert('该用户没有手机号，无法重置密码（密码与登录手机号关联）')
    return
  }
  resetTargetPhone.value = row.phone
  resetTargetName.value = row.studentName || row.phone
  resetPassword.value = ''
  showResetDialog.value = true
}

// 确认重置密码
const confirmResetPassword = async () => {
  const pwd = resetPassword.value?.trim()
  if (!pwd) {
    alert('请输入新密码')
    return
  }
  if (pwd.length < 6) {
    alert('密码长度至少 6 位')
    return
  }
  resetting.value = true
  try {
    const res = await adminResetPassword({
      phone: resetTargetPhone.value,
      newPassword: pwd
    })
    if (res.code === 200 || res.code === 0) {
      alert('密码重置成功')
      showResetDialog.value = false
    } else {
      alert(res.msg || '密码重置失败')
    }
  } catch (e: any) {
    alert(e.message || '密码重置失败')
  } finally {
    resetting.value = false
  }
}

// 删除选中
const handleDeleteSelected = () => {
  if (selectedIds.value.length === 0) {
    alert('请选择要删除的记录')
    return
  }
  if (confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`)) {
    handleDelete(selectedIds.value)
  }
}

// 执行删除
const handleDelete = async (ids: number[]) => {
  loading.value = true
  try {
    const response = await deleteStudent(ids.join(','))
    if (response.code === 200 || response.code === 0) {
      alert('删除成功')
      selectedIds.value = []
      loadData()
    } else {
      alert(response.msg || '删除失败')
    }
  } catch (error: any) {
    console.error('删除错误:', error)
    alert(error.message || '删除失败')
  } finally {
    loading.value = false
  }
}

// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadData()
  }
}

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadData()
  }
}

// 格式化日期时间
const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\//g, '-')
  } catch {
    return dateStr
  }
}

// 获取用户类型名称
const getUserTypeName = (userType?: number) => {
  if (userType === 1) return '学员'
  if (userType === 2) return '讲师'
  if (userType === 3) return '其他(管理员)'
  return '-'
}

// 获取用户类型样式类
const getUserTypeClass = (userType?: number) => {
  if (userType === 1) return 'user-type-badge student'
  if (userType === 2) return 'user-type-badge instructor'
  if (userType === 3) return 'user-type-badge admin'
  return ''
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.students-page {
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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

.btn-action {
  padding: 10px 20px;
  background: white;
  color: var(--text-regular);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-action:hover {
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.search-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
  flex: 1;
}

.form-item label {
  font-size: 14px;
  color: var(--text-secondary);
}

.form-input {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.form-input:disabled {
  background: #f5f7fa;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.btn-query, .btn-reset {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-query {
  background: var(--primary-color);
  color: white;
}

.btn-query:hover {
  background: #66b1ff;
}

.btn-reset {
  background: white;
  color: var(--text-regular);
  border: 1px solid var(--border-color);
}

.btn-reset:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f5f7fa;
}

.data-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
  white-space: nowrap;
}

.data-table td {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  color: var(--text-regular);
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.user-type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.user-type-badge.student {
  background: #f0f9ff;
  color: var(--info-color);
}

.user-type-badge.instructor {
  background: #fef0f0;
  color: var(--primary-color);
}

.user-type-badge.admin {
  background: #fef0f0;
  color: var(--danger-color);
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #f0f9ff;
  color: var(--success-color);
}

.status-badge.inactive {
  background: #fef0f0;
  color: var(--danger-color);
}

.btn-link {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 8px;
  transition: all 0.3s;
}

.btn-link:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-link.btn-danger:hover {
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
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
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--text-primary);
}

.dialog-body {
  padding: 20px;
}

.edit-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  color: var(--text-secondary);
}

.reset-hint {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--text-regular);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel, .btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-cancel {
  background: white;
  color: var(--text-regular);
  border: 1px solid var(--border-color);
}

.btn-cancel:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-confirm {
  background: var(--primary-color);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-cancel:disabled, .btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .edit-form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
