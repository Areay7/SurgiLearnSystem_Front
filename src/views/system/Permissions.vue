<template>
  <div class="permissions-page">
    <div class="page-header">
      <h1 class="page-title">用户权限管理</h1>
      <div class="header-actions">
        <button class="btn-primary" @click="openAddDialog">新增权限</button>
        <button class="btn-action" @click="handleDeleteSelected" v-if="selectedIds.length > 0">删除选中</button>
      </div>
    </div>

    <div class="permissions-content">
      <!-- 搜索表单 -->
      <div class="search-form">
        <div class="form-row">
          <div class="form-item">
            <label>用户ID：</label>
            <input
              type="number"
              placeholder="请输入用户ID"
              class="form-input"
              v-model="searchForm.userIdText"
            />
          </div>
          <div class="form-item">
            <label>权限代码：</label>
            <input
              type="text"
              placeholder="请输入权限代码"
              class="form-input"
              v-model="searchForm.permissionCode"
            />
          </div>
          <div class="form-item">
            <label>权限名称：</label>
            <input
              type="text"
              placeholder="请输入权限名称"
              class="form-input"
              v-model="searchForm.permissionName"
            />
          </div>
          <div class="form-item">
            <label>状态：</label>
            <select class="form-input" v-model="searchForm.isActive">
              <option value="">全部</option>
              <option value="1">启用</option>
              <option value="0">禁用</option>
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
                  :checked="selectedIds.length === permissions.length && permissions.length > 0"
                />
              </th>
              <th width="60">序号</th>
              <th width="180">操作</th>
              <th width="100">ID</th>
              <th width="120">用户ID</th>
              <th width="180">权限代码</th>
              <th>权限名称</th>
              <th width="120">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="permissions.length === 0">
              <td colspan="8" class="empty-state">
                <p>暂无数据</p>
              </td>
            </tr>
            <tr v-for="(row, index) in permissions" :key="row.id || index" class="table-row">
              <td>
                <input type="checkbox" :value="row.id" v-model="selectedIds" />
              </td>
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>
                <button class="btn-link" @click="openEditDialog(row)">编辑</button>
                <button class="btn-link btn-danger" @click="handleDeleteSingle(row)">删除</button>
              </td>
              <td>{{ row.id ?? '-' }}</td>
              <td>{{ row.userId ?? '-' }}</td>
              <td>{{ row.permissionCode }}</td>
              <td>{{ row.permissionName }}</td>
              <td>
                <span class="status-badge" :class="row.isActive === 1 ? 'active' : 'inactive'">
                  {{ row.isActive === 1 ? '启用' : '禁用' }}
                </span>
              </td>
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
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '新增权限' : '编辑权限' }}</h3>
          <button class="close-btn" @click="showDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>ID：</label>
            <input type="text" class="form-input" :value="editForm.id ?? '-'" disabled />
          </div>
          <div class="form-group">
            <label>用户ID *</label>
            <input
              type="number"
              class="form-input"
              placeholder="请输入用户ID"
              v-model="editForm.userIdText"
              :disabled="saving"
            />
          </div>
          <div class="form-group">
            <label>权限代码 *</label>
            <input
              type="text"
              class="form-input"
              placeholder="如：FORUM_EDIT"
              v-model="editForm.permissionCode"
              maxlength="100"
              :disabled="saving"
            />
          </div>
          <div class="form-group">
            <label>权限名称 *</label>
            <input
              type="text"
              class="form-input"
              placeholder="如：论坛编辑权限"
              v-model="editForm.permissionName"
              maxlength="200"
              :disabled="saving"
            />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select class="form-input" v-model="editForm.isActive" :disabled="saving">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { UserPermission } from '@/api/permissions'
import { addPermission, deletePermission, getPermissionList, updatePermission } from '@/api/permissions'

const loading = ref(false)
const saving = ref(false)

const permissions = ref<UserPermission[]>([])
const selectedIds = ref<number[]>([])

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const totalPages = computed(() => {
  const t = Math.ceil(total.value / pageSize.value)
  return t <= 0 ? 1 : t
})

const searchForm = reactive({
  userIdText: '' as string,
  permissionCode: '',
  permissionName: '',
  isActive: '' as string
})

const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editForm = reactive({
  id: null as number | null,
  userIdText: '' as string,
  permissionCode: '',
  permissionName: '',
  isActive: 1 as 0 | 1
})

const parseUserId = (val: string): number | null => {
  if (!val || val.trim() === '') return null
  const n = Number(val)
  if (Number.isNaN(n)) return null
  return n
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getPermissionList({
      page: currentPage.value,
      limit: pageSize.value,
      userId: parseUserId(searchForm.userIdText),
      permissionCode: searchForm.permissionCode || undefined,
      permissionName: searchForm.permissionName || undefined,
      isActive: searchForm.isActive === '' ? null : Number(searchForm.isActive),
    })
    permissions.value = res.data || []
    total.value = res.count || 0
    selectedIds.value = []
  } catch (e: any) {
    alert(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  currentPage.value = 1
  await fetchList()
}

const handleReset = async () => {
  searchForm.userIdText = ''
  searchForm.permissionCode = ''
  searchForm.permissionName = ''
  searchForm.isActive = ''
  currentPage.value = 1
  await fetchList()
}

const prevPage = async () => {
  if (currentPage.value <= 1) return
  currentPage.value -= 1
  await fetchList()
}

const nextPage = async () => {
  if (currentPage.value >= totalPages.value) return
  currentPage.value += 1
  await fetchList()
}

const handleSelectAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    selectedIds.value = permissions.value.map((p) => p.id).filter((id): id is number => typeof id === 'number')
  } else {
    selectedIds.value = []
  }
}

const openAddDialog = () => {
  dialogMode.value = 'add'
  editForm.id = null
  editForm.userIdText = ''
  editForm.permissionCode = ''
  editForm.permissionName = ''
  editForm.isActive = 1
  showDialog.value = true
}

const openEditDialog = (row: UserPermission) => {
  dialogMode.value = 'edit'
  editForm.id = row.id ?? null
  editForm.userIdText = row.userId != null ? String(row.userId) : ''
  editForm.permissionCode = row.permissionCode || ''
  editForm.permissionName = row.permissionName || ''
  editForm.isActive = (row.isActive === 0 ? 0 : 1) as 0 | 1
  showDialog.value = true
}

const handleSave = async () => {
  const userId = parseUserId(editForm.userIdText)
  if (userId == null) {
    alert('请输入有效的用户ID')
    return
  }
  if (!editForm.permissionCode || editForm.permissionCode.trim() === '') {
    alert('权限代码不能为空')
    return
  }
  if (!editForm.permissionName || editForm.permissionName.trim() === '') {
    alert('权限名称不能为空')
    return
  }

  saving.value = true
  try {
    if (dialogMode.value === 'add') {
      await addPermission({
        userId,
        permissionCode: editForm.permissionCode.trim(),
        permissionName: editForm.permissionName.trim(),
        isActive: editForm.isActive
      })
    } else {
      if (!editForm.id) {
        alert('缺少ID，无法编辑')
        return
      }
      await updatePermission({
        id: editForm.id,
        userId,
        permissionCode: editForm.permissionCode.trim(),
        permissionName: editForm.permissionName.trim(),
        isActive: editForm.isActive
      } as any)
    }
    showDialog.value = false
    await fetchList()
  } catch (e: any) {
    alert(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleDeleteSingle = async (row: UserPermission) => {
  if (!row.id) {
    alert('缺少ID，无法删除')
    return
  }
  if (!confirm('确定删除该权限记录吗？')) return
  try {
    await deletePermission(String(row.id))
    await fetchList()
  } catch (e: any) {
    alert(e?.message || '删除失败')
  }
}

const handleDeleteSelected = async () => {
  if (selectedIds.value.length === 0) return
  if (!confirm(`确定删除选中的 ${selectedIds.value.length} 条记录吗？`)) return
  try {
    await deletePermission(selectedIds.value.join(','))
    await fetchList()
  } catch (e: any) {
    alert(e?.message || '删除失败')
  }
}

onMounted(async () => {
  await fetchList()
})
</script>

<style scoped>
.permissions-page {
  max-width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  gap: 10px;
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

.btn-primary:hover {
  background: #66b1ff;
}

.btn-action {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-action:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.search-form {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-item label {
  color: var(--text-secondary);
  font-size: 14px;
  white-space: nowrap;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn-query {
  padding: 10px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-reset {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
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
}

.data-table td {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  color: var(--text-regular);
  font-size: 14px;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
}

.status-badge {
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
  padding: 6px 10px;
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

.page-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}

.loading-state {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.dialog {
  width: 520px;
  max-width: calc(100vw - 32px);
  background: white;
  border-radius: 10px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-body {
  padding: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid var(--border-color);
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
  color: var(--text-secondary);
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

.btn-cancel {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.btn-confirm {
  padding: 10px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .table-container {
    font-size: 12px;
  }
  
  th, td {
    padding: 8px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .form-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>

