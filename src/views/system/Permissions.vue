<template>
  <div class="permissions-page">
    <div class="page-header">
      <h1 class="page-title">权限管理</h1>
      <p class="page-desc">管理系统权限定义、角色权限配置及用户权限覆盖</p>
    </div>

    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="tab"
        :class="{ on: activeTab === t.id }"
        @click="activeTab = t.id; onTabChange(t.id)"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Tab 1: 权限定义 -->
    <div v-show="activeTab === 'def'" class="tab-content">
      <div class="card">
        <div class="card-header">
          <h3>权限定义</h3>
          <span class="hint">系统可配置的权限列表，按模块分组</span>
        </div>
        <div class="table-wrap">
          <table class="data-table" v-if="permissionDefs.length > 0">
            <thead>
              <tr>
                <th width="180">权限代码</th>
                <th width="160">权限名称</th>
                <th width="120">所属模块</th>
                <th>描述</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in permissionDefs" :key="p.id || i">
                <td><code>{{ p.permissionCode }}</code></td>
                <td>{{ p.permissionName }}</td>
                <td>{{ p.module || '-' }}</td>
                <td>{{ p.description || '-' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <p>{{ loadingDefs ? '加载中...' : '暂无权限定义，请执行 init_permission_data.sql 初始化' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: 角色权限 -->
    <div v-show="activeTab === 'role'" class="tab-content">
      <div class="card">
        <div class="card-header">
          <h3>角色权限配置</h3>
          <span class="hint">选择角色，勾选该角色拥有的权限</span>
        </div>
        <div class="role-permission-form">
          <div class="form-row">
            <label>选择角色：</label>
            <select class="form-select" v-model="selectedRoleId" @change="loadRolePermissions">
              <option :value="null">请选择角色</option>
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.roleName }}（{{ r.roleCode }}）</option>
            </select>
          </div>
          <div v-if="selectedRoleId" class="permission-grid">
            <div v-for="mod in groupedDefs" :key="mod.name" class="module-group">
              <div class="module-title">{{ mod.name }}</div>
              <div class="check-row" v-for="p in mod.perms" :key="p.permissionCode">
                <label>
                  <input type="checkbox" :value="p.permissionCode" v-model="roleSelectedCodes" />
                  {{ p.permissionName }} <code class="code-sm">{{ p.permissionCode }}</code>
                </label>
              </div>
            </div>
          </div>
          <div v-if="selectedRoleId" class="form-actions">
            <button class="btn-primary" @click="saveRolePermissions" :disabled="savingRole">
              {{ savingRole ? '保存中...' : '保存角色权限' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: 用户权限 -->
    <div v-show="activeTab === 'user'" class="tab-content">
      <div class="card">
        <div class="card-header user-perm-header">
          <h3>用户权限管理</h3>
          <span class="hint">为指定用户单独授予或收回权限，优先级高于角色权限</span>
        </div>
        <div class="search-form">
          <div class="form-row">
            <div class="form-item">
              <label>用户手机：</label>
              <input type="text" class="form-input" placeholder="手机号" v-model="searchForm.userPhone" />
            </div>
            <div class="form-item">
              <label>权限代码：</label>
              <input type="text" class="form-input" placeholder="权限代码" v-model="searchForm.permissionCode" />
            </div>
            <div class="form-actions">
              <button class="btn-query" @click="handleSearch" :disabled="loading">查询</button>
              <button class="btn-reset" @click="handleReset">重置</button>
              <button class="btn-primary" @click="openAddUserPerm(false)">单个添加</button>
              <button class="btn-primary btn-outline" @click="openAddUserPerm(true)">批量添加</button>
              <button class="btn-danger" @click="handleBatchDelete" :disabled="selectedIds.length === 0">
                批量删除 ({{ selectedIds.length }})
              </button>
            </div>
          </div>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th width="50"><input type="checkbox" @change="handleSelectAll" :checked="selectedIds.length === permissions.length && permissions.length > 0" /></th>
                <th width="60">序号</th>
                <th width="120">用户ID</th>
                <th width="130">用户手机</th>
                <th width="140">权限代码</th>
                <th width="140">权限名称</th>
                <th width="80">类型</th>
                <th width="80">状态</th>
                <th width="120">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="permissions.length === 0">
                <td colspan="9" class="empty-state">暂无数据</td>
              </tr>
              <tr v-for="(row, index) in permissions" :key="row.id || index">
                <td><input type="checkbox" :value="row.id" v-model="selectedIds" /></td>
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ row.userId ?? '-' }}</td>
                <td>{{ row.userPhone ?? '-' }}</td>
                <td><code>{{ row.permissionCode }}</code></td>
                <td>{{ row.permissionName }}</td>
                <td><span class="badge" :class="row.grantType === 'revoke' ? 'revoke' : 'grant'">{{ row.grantType === 'revoke' ? '收回' : '授予' }}</span></td>
                <td><span class="badge" :class="row.isActive === 1 ? 'active' : 'inactive'">{{ row.isActive === 1 ? '启用' : '禁用' }}</span></td>
                <td>
                  <button class="btn-link" @click="openViewUserPerm(row.userPhone || '')" title="查看该用户当前权限">查看</button>
                  <button class="btn-link" @click="openEditUserPerm(row)">编辑</button>
                  <button class="btn-link danger" @click="handleDeleteOne(row)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button class="page-btn" @click="prevPage" :disabled="currentPage <= 1 || loading">上一页</button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页，共 {{ total }} 条</span>
          <button class="page-btn" @click="nextPage" :disabled="currentPage >= totalPages || loading">下一页</button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑用户权限 对话框 -->
    <div v-if="showUserPermDialog" class="dialog-overlay" @click="showUserPermDialog = false">
      <div class="dialog" :class="{ wide: isBatchAdd }" @click.stop>
        <div class="dialog-header">
          <h3>
            {{ userPermMode === 'edit' ? '编辑用户权限' : (isBatchAdd ? '批量添加用户权限' : '单个添加用户权限') }}
          </h3>
          <button class="close-btn" @click="showUserPermDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>选择用户 *</label>
            <input v-if="userOptions.length > 10" type="text" class="form-input form-input-search" placeholder="搜索姓名/手机号..." v-model="userSearchKeyword" style="margin-bottom:8px" />
            <div class="user-select-row">
              <select class="form-input form-select-user" v-model="userPermForm.userId" @change="onUserSelect">
                <option :value="null">从列表选择...</option>
                <option v-for="u in filteredUserOptions" :key="u.id" :value="u.id">
                  {{ u.studentName || u.phone }}（{{ u.phone }}）{{ getUserTypeLabel(u.userType) }}
                </option>
              </select>
              <span class="or-tip">或直接输入手机号：</span>
              <input type="text" class="form-input form-input-phone" placeholder="手机号" v-model="userPermForm.userPhone" @input="onPhoneInput" />
            </div>
            <p v-if="userPermForm.userPhone" class="form-hint">将为用户 {{ userPermForm.userPhone }} 添加权限</p>
          </div>

          <!-- 单个添加：下拉选择权限 -->
          <template v-if="!isBatchAdd">
            <div class="form-group">
              <label>权限 *</label>
              <select class="form-input" v-model="userPermForm.permissionCode" @change="onPermSelect">
                <option value="">请选择权限</option>
                <optgroup v-for="mod in groupedDefs" :key="mod.name" :label="mod.name">
                  <option v-for="p in mod.perms" :key="p.permissionCode" :value="p.permissionCode">
                    {{ p.permissionName }}（{{ p.permissionCode }}）
                  </option>
                </optgroup>
              </select>
            </div>
          </template>
          <!-- 批量添加：按模块勾选 -->
          <div v-else class="form-group batch-perms">
            <label>选择要添加的权限 *</label>
            <div class="permission-grid-dialog">
              <div v-for="mod in groupedDefs" :key="mod.name" class="module-group">
                <div class="module-title">{{ mod.name }}</div>
                <div class="check-row" v-for="p in mod.perms" :key="p.permissionCode">
                  <label>
                    <input type="checkbox" :value="p.permissionCode" v-model="batchSelectedCodes" />
                    {{ p.permissionName }} <code class="code-sm">{{ p.permissionCode }}</code>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>操作类型</label>
            <select class="form-input" v-model="userPermForm.grantType">
              <option value="grant">授予</option>
              <option value="revoke">收回</option>
            </select>
          </div>
          <div v-if="!isBatchAdd" class="form-group">
            <label>状态</label>
            <select class="form-input" v-model="userPermForm.isActive">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="showUserPermDialog = false">取消</button>
          <button class="btn-primary" @click="saveUserPerm" :disabled="savingUserPerm">
            {{ savingUserPerm ? '保存中...' : (isBatchAdd ? `保存（已选 ${batchSelectedCodes.length} 项）` : '保存') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 查看用户权限 对话框 -->
    <div v-if="showViewPermDialog" class="dialog-overlay" @click="showViewPermDialog = false">
      <div class="dialog dialog-view-perm" @click.stop>
        <div class="dialog-header">
          <h3>用户 {{ viewPermPhone }} 的当前权限</h3>
          <button class="close-btn" @click="showViewPermDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div v-if="viewPermLoading" class="loading-inline">加载中...</div>
          <div v-else class="perm-tag-list">
            <span v-for="code in viewPermCodes" :key="code" class="perm-tag">{{ code }}</span>
            <span v-if="viewPermCodes.length === 0" class="empty-hint">该用户暂无任何权限（或权限数据未初始化）</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getPermissionDefList,
  getRoleList,
  getRolePermissions,
  setRolePermissions,
  getPermissionList,
  addPermission,
  updatePermission,
  deletePermission,
  getUserPermissions,
  type PermissionDef,
  type Role,
  type UserPermission
} from '@/api/permissions'
import { getStudentsList, type Students } from '@/api/students'

const tabs = [
  { id: 'def', label: '权限定义' },
  { id: 'role', label: '角色权限' },
  { id: 'user', label: '用户权限' }
]

const activeTab = ref('def')
const loadingDefs = ref(false)
const permissionDefs = ref<PermissionDef[]>([])
const roles = ref<Role[]>([])
const selectedRoleId = ref<number | null>(null)
const roleSelectedCodes = ref<string[]>([])
const savingRole = ref(false)

const loading = ref(false)
const permissions = ref<UserPermission[]>([])
const selectedIds = ref<number[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const searchForm = ref({
  userPhone: '',
  permissionCode: ''
})

const showUserPermDialog = ref(false)
const isBatchAdd = ref(false)
const userPermMode = ref<'add' | 'edit'>('add')
const userPermForm = ref({
  id: null as number | null,
  userId: null as number | null,
  userPhone: '',
  permissionCode: '',
  permissionName: '',
  grantType: 'grant',
  isActive: 1
})
const userOptions = ref<Students[]>([])
const userSearchKeyword = ref('')
const batchSelectedCodes = ref<string[]>([])
const savingUserPerm = ref(false)

const showViewPermDialog = ref(false)
const viewPermPhone = ref('')
const viewPermCodes = ref<string[]>([])
const viewPermLoading = ref(false)

const filteredUserOptions = computed(() => {
  const kw = userSearchKeyword.value.trim().toLowerCase()
  if (!kw) return userOptions.value
  return userOptions.value.filter(u =>
    (u.phone || '').toLowerCase().includes(kw) ||
    (u.studentName || '').toLowerCase().includes(kw)
  )
})

const groupedDefs = computed(() => {
  const map = new Map<string, PermissionDef[]>()
  for (const p of permissionDefs.value) {
    const mod = p.module || '其他'
    if (!map.has(mod)) map.set(mod, [])
    map.get(mod)!.push(p)
  }
  return Array.from(map.entries()).map(([name, perms]) => ({ name, perms }))
})

const onTabChange = (id: string) => {
  if (id === 'def' && permissionDefs.value.length === 0) loadPermissionDefs()
  if (id === 'role' && roles.value.length === 0) loadRoles()
  if (id === 'user') fetchUserPermissions()
}

const loadPermissionDefs = async () => {
  loadingDefs.value = true
  try {
    const res = await getPermissionDefList()
    permissionDefs.value = (res.data || []) as PermissionDef[]
  } catch {
    permissionDefs.value = []
  } finally {
    loadingDefs.value = false
  }
}

const loadRoles = async () => {
  try {
    const res = await getRoleList()
    roles.value = (res.data || []) as Role[]
    if (permissionDefs.value.length === 0) await loadPermissionDefs()
  } catch {
    roles.value = []
  }
}

const loadRolePermissions = async () => {
  if (!selectedRoleId.value) {
    roleSelectedCodes.value = []
    return
  }
  try {
    const res = await getRolePermissions(selectedRoleId.value)
    roleSelectedCodes.value = [...(res.data || [])]
  } catch {
    roleSelectedCodes.value = []
  }
}

const saveRolePermissions = async () => {
  if (!selectedRoleId.value) return
  savingRole.value = true
  try {
    await setRolePermissions(selectedRoleId.value, roleSelectedCodes.value)
    alert('保存成功')
  } catch (e: any) {
    alert(e?.message || '保存失败')
  } finally {
    savingRole.value = false
  }
}

const fetchUserPermissions = async () => {
  loading.value = true
  try {
    const res = await getPermissionList({
      page: currentPage.value,
      limit: pageSize.value,
      userPhone: searchForm.value.userPhone || undefined,
      permissionCode: searchForm.value.permissionCode || undefined
    })
    permissions.value = res.data || []
    total.value = res.count || 0
  } catch {
    permissions.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUserPermissions()
}

const handleReset = () => {
  searchForm.value = { userPhone: '', permissionCode: '' }
  currentPage.value = 1
  fetchUserPermissions()
}

const prevPage = () => { if (currentPage.value > 1) { currentPage.value--; fetchUserPermissions() } }
const nextPage = () => { if (currentPage.value < totalPages.value) { currentPage.value++; fetchUserPermissions() } }

const handleSelectAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  selectedIds.value = checked ? permissions.value.map(p => p.id!).filter(Boolean) : []
}

const getUserTypeLabel = (t?: number) => {
  if (t === 3) return '[管理员]'
  if (t === 2) return '[讲师]'
  return '[学员]'
}

const openAddUserPerm = async (batch: boolean) => {
  isBatchAdd.value = batch
  userPermMode.value = 'add'
  userPermForm.value = { id: null, userId: null, userPhone: '', permissionCode: '', permissionName: '', grantType: 'grant', isActive: 1 }
  batchSelectedCodes.value = []
  userSearchKeyword.value = ''
  if (permissionDefs.value.length === 0) await loadPermissionDefs()
  const res = await getStudentsList({ page: 1, limit: 500 })
  userOptions.value = res.data || []
  showUserPermDialog.value = true
}

const onUserSelect = () => {
  const u = userOptions.value.find(x => x.id === userPermForm.value.userId)
  if (u) {
    userPermForm.value.userPhone = u.phone || ''
  } else {
    userPermForm.value.userPhone = ''
  }
}

const onPhoneInput = () => {
  if (userPermForm.value.userPhone) userPermForm.value.userId = null
}

const onPermSelect = () => {
  const p = permissionDefs.value.find(x => x.permissionCode === userPermForm.value.permissionCode)
  if (p) userPermForm.value.permissionName = p.permissionName
}

const openViewUserPerm = async (phone: string) => {
  if (!phone) return
  viewPermPhone.value = phone
  viewPermCodes.value = []
  viewPermLoading.value = true
  showViewPermDialog.value = true
  try {
    const res = await getUserPermissions(phone)
    viewPermCodes.value = res.data || []
  } catch {
    viewPermCodes.value = []
  } finally {
    viewPermLoading.value = false
  }
}

const openEditUserPerm = (row: UserPermission) => {
  isBatchAdd.value = false
  userPermMode.value = 'edit'
  userPermForm.value = {
    id: row.id ?? null,
    userId: row.userId ?? null,
    userPhone: row.userPhone || '',
    permissionCode: row.permissionCode || '',
    permissionName: row.permissionName || '',
    grantType: row.grantType || 'grant',
    isActive: row.isActive ?? 1
  }
  if (userOptions.value.length === 0) {
    getStudentsList({ page: 1, limit: 500 }).then(r => { userOptions.value = r.data || [] })
  }
  showUserPermDialog.value = true
}

const saveUserPerm = async () => {
  const f = userPermForm.value
  const phone = (f.userPhone || '').trim()
  if (!f.userId && !phone) {
    alert('请选择用户或输入手机号')
    return
  }
  if (userPermMode.value === 'edit') {
    if (!f.permissionCode) { alert('请选择权限'); return }
    savingUserPerm.value = true
    try {
      const payload: any = {
        userId: f.userId,
        userPhone: phone || undefined,
        permissionCode: f.permissionCode,
        permissionName: f.permissionName || f.permissionCode,
        grantType: f.grantType,
        isActive: f.isActive,
        id: f.id
      }
      await updatePermission(payload)
      showUserPermDialog.value = false
      fetchUserPermissions()
    } catch (e: any) {
      alert(e?.message || '保存失败')
    } finally {
      savingUserPerm.value = false
    }
    return
  }
  if (isBatchAdd.value) {
    if (batchSelectedCodes.value.length === 0) {
      alert('请至少勾选一个权限')
      return
    }
    savingUserPerm.value = true
    try {
      const perms = permissionDefs.value
      let success = 0
      for (const code of batchSelectedCodes.value) {
        const p = perms.find(x => x.permissionCode === code)
        const payload: any = {
          userId: f.userId,
          userPhone: phone || undefined,
          permissionCode: code,
          permissionName: p?.permissionName || code,
          grantType: f.grantType,
          isActive: 1
        }
        await addPermission(payload)
        success++
      }
      showUserPermDialog.value = false
      alert(`成功添加 ${success} 项权限`)
      fetchUserPermissions()
    } catch (e: any) {
      alert(e?.message || '保存失败')
    } finally {
      savingUserPerm.value = false
    }
    return
  }
  if (!f.permissionCode) {
    alert('请选择权限')
    return
  }
  savingUserPerm.value = true
  try {
    const payload: any = {
      userId: f.userId,
      userPhone: phone || undefined,
      permissionCode: f.permissionCode,
      permissionName: f.permissionName || f.permissionCode,
      grantType: f.grantType,
      isActive: f.isActive
    }
    await addPermission(payload)
    showUserPermDialog.value = false
    alert('添加成功')
    fetchUserPermissions()
  } catch (e: any) {
    alert(e?.message || '保存失败')
  } finally {
    savingUserPerm.value = false
  }
}

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return
  if (!confirm(`确定删除选中的 ${selectedIds.value.length} 条用户权限吗？`)) return
  try {
    await deletePermission(selectedIds.value.join(','))
    selectedIds.value = []
    fetchUserPermissions()
  } catch (e: any) {
    alert(e?.message || '删除失败')
  }
}

const handleDeleteOne = async (row: UserPermission) => {
  if (!row.id) return
  if (!confirm('确定删除该条用户权限吗？')) return
  try {
    await deletePermission(String(row.id))
    fetchUserPermissions()
  } catch (e: any) {
    alert(e?.message || '删除失败')
  }
}

onMounted(() => {
  loadPermissionDefs()
})
</script>

<style scoped>
.permissions-page { max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 600; margin: 0 0 8px 0; }
.page-desc { color: var(--text-secondary); font-size: 14px; margin: 0; }

.tabs { display: flex; gap: 8px; margin-bottom: 20px; }
.tab { padding: 10px 20px; border: 1px solid var(--border-color); background: #fff; border-radius: 8px; cursor: pointer; }
.tab.on { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }

.tab-content { min-height: 300px; }
.card { background: var(--card-bg); border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden; }
.card-header { padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.card-header h3 { margin: 0 0 4px 0; font-size: 16px; }
.card-header .hint { font-size: 12px; color: var(--text-secondary); }

.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border-color); }
.data-table th { background: #f5f7fa; font-weight: 500; }
.empty-state { padding: 40px; text-align: center; color: var(--text-secondary); }

.role-permission-form { padding: 20px; }
.form-row { margin-bottom: 16px; display: flex; align-items: center; gap: 12px; }
.form-select { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; min-width: 220px; }
.permission-grid { display: flex; flex-wrap: wrap; gap: 24px; margin: 20px 0; max-height: 450px; overflow-y: auto; }
.module-group { flex: 0 0 280px; }
.module-title { font-weight: 600; margin-bottom: 10px; color: var(--primary-color); }
.check-row { margin: 6px 0; }
.check-row label { cursor: pointer; font-size: 13px; }
.code-sm { font-size: 11px; color: var(--text-secondary); margin-left: 4px; }
.form-actions { margin-top: 16px; }

.search-form { padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.form-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.form-item { display: flex; align-items: center; gap: 8px; }
.form-item label { white-space: nowrap; }
.form-input { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; min-width: 140px; }
.form-actions { display: flex; gap: 8px; margin-left: auto; }
.btn-query, .btn-reset { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border-color); background: #fff; cursor: pointer; }
.btn-query { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
.btn-primary { padding: 8px 16px; background: var(--primary-color); color: #fff; border: none; border-radius: 6px; cursor: pointer; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; }
.page-btn { padding: 6px 14px; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; background: #fff; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { font-size: 14px; color: var(--text-secondary); }

.badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.badge.grant { background: #dcfce7; color: #166534; }
.badge.revoke { background: #fee2e2; color: #991b1b; }
.badge.active { background: #dcfce7; color: #166534; }
.badge.inactive { background: #fef3c7; color: #92400e; }

.btn-link { padding: 4px 8px; margin-right: 8px; border: none; background: none; color: var(--primary-color); cursor: pointer; font-size: 13px; }
.btn-link.danger { color: #dc2626; }
.btn-link:hover { text-decoration: underline; }

code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }

.dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999; }
.dialog { width: 480px; max-width: 95vw; background: #fff; border-radius: 10px; overflow: hidden; }
.dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--border-color); }
.dialog-body { padding: 16px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px; border-top: 1px solid var(--border-color); }
.close-btn { border: none; background: none; font-size: 22px; cursor: pointer; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 14px; }
.btn-cancel { padding: 8px 16px; border: 1px solid var(--border-color); background: #fff; border-radius: 6px; cursor: pointer; }
.btn-outline { background: transparent; border: 1px solid var(--primary-color); color: var(--primary-color); }
.btn-danger { padding: 8px 16px; background: #dc2626; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.user-perm-header .hint { font-size: 12px; color: var(--text-secondary); }
.user-select-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.form-select-user { min-width: 200px; flex: 1; }
.form-input-phone { min-width: 120px; width: 140px; }
.or-tip { font-size: 12px; color: var(--text-secondary); white-space: nowrap; }
.form-hint { font-size: 12px; color: var(--primary-color); margin: 8px 0 0 0; }

.dialog.wide { width: 680px; max-width: 95vw; }
.permission-grid-dialog { max-height: 320px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 20px; margin-top: 8px; }
.batch-perms .module-group { flex: 0 0 200px; }

.loading-inline { padding: 20px; text-align: center; color: var(--text-secondary); }
.perm-tag-list { display: flex; flex-wrap: wrap; gap: 8px; }
.perm-tag { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; font-size: 12px; }
.empty-hint { color: var(--text-secondary); font-size: 13px; }
</style>
