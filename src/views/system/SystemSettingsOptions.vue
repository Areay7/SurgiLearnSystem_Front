<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">系统设置选项</h1>
      <div class="header-actions">
        <button class="btn-primary" @click="openAddDialog">新增设置</button>
      </div>
    </div>

    <div class="toolbar">
      <input
        class="search-input"
        placeholder="按课程类型搜索..."
        v-model="searchText"
        @keyup.enter="handleSearch"
      />
      <button class="btn-query" @click="handleSearch" :disabled="loading">查询</button>
      <button class="btn-reset" @click="handleReset" :disabled="loading">重置</button>
    </div>

    <div class="card table-card" v-if="!loading">
      <div class="table">
        <div class="tr th">
          <div class="td index-col">序号</div>
          <div class="td actions">操作</div>
          <div class="td">设置ID</div>
          <div class="td">课程类型</div>
          <div class="td">学习模式</div>
          <div class="td">考试时限</div>
          <div class="td">视频质量</div>
          <div class="td">题库类型</div>
          <div class="td">更新频率</div>
        </div>
        <div class="tr" v-for="(item, index) in list" :key="item.id">
          <div class="td index-col">
            {{ (currentPage - 1) * pageSize + index + 1 }}
          </div>
          <div class="td actions">
            <button class="btn" @click="openEditDialog(item)">编辑</button>
            <button class="btn danger" @click="handleDelete(item)">删除</button>
          </div>
          <div class="td">{{ item.settingsId ?? '-' }}</div>
          <div class="td">{{ item.courseType || '-' }}</div>
          <div class="td">{{ item.learningMode || '-' }}</div>
          <div class="td">{{ item.examTimeLimit || '-' }}</div>
          <div class="td">{{ item.videoQuality || '-' }}</div>
          <div class="td">{{ item.questionBankType || '-' }}</div>
          <div class="td">{{ item.updateFrequency || '-' }}</div>
        </div>
        <div class="tr empty-row" v-if="list.length === 0">
          <div class="td" style="grid-column: 1 / -1; text-align: center; padding: 24px;">
            暂无数据
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading-state">加载中...</div>

    <div class="pagination">
      <button class="page-btn" @click="prevPage" :disabled="currentPage === 1 || loading">上一页</button>
      <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页（共 {{ total }} 条）</span>
      <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages || loading">
        下一页
      </button>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog edit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '新增系统设置' : '编辑系统设置' }}</h3>
          <button class="close-btn" @click="closeDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="edit-form">
            <div class="form-row">
              <div class="form-group">
                <label>设置ID</label>
                <input
                  class="form-input"
                  type="number"
                  v-model.number="form.settingsId"
                  :disabled="saving"
                  min="1"
                />
              </div>
              <div class="form-group">
                <label>课程类型</label>
                <input class="form-input" v-model="form.courseType" :disabled="saving" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>学习模式</label>
                <input class="form-input" v-model="form.learningMode" :disabled="saving" />
              </div>
              <div class="form-group">
                <label>考试时限</label>
                <input
                  class="form-input"
                  v-model="form.examTimeLimit"
                  :disabled="saving"
                  placeholder="例如：60分钟"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>视频质量</label>
                <input
                  class="form-input"
                  v-model="form.videoQuality"
                  :disabled="saving"
                  placeholder="例如：1080p"
                />
              </div>
              <div class="form-group">
                <label>题库类型</label>
                <input
                  class="form-input"
                  v-model="form.questionBankType"
                  :disabled="saving"
                  placeholder="例如：章节练习/模拟考试"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>更新频率</label>
                <input
                  class="form-input"
                  v-model="form.updateFrequency"
                  :disabled="saving"
                  placeholder="例如：每月/每季度"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeDialog" :disabled="saving">取消</button>
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
import type { SystemSettingsOption } from '@/api/settings'
import {
  addSystemSettings,
  deleteSystemSettings,
  getSystemSettingsList,
  updateSystemSettings
} from '@/api/settings'

const loading = ref(false)
const saving = ref(false)
const list = ref<SystemSettingsOption[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchText = ref('')

const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const form = reactive<SystemSettingsOption>({
  settingsId: undefined,
  courseType: '',
  learningMode: '',
  examTimeLimit: '',
  videoQuality: '',
  questionBankType: '',
  updateFrequency: ''
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const loadData = async () => {
  loading.value = true
  try {
    const res = await getSystemSettingsList({
      page: currentPage.value,
      limit: pageSize.value,
      searchText: searchText.value || undefined
    })
    list.value = res.data || []
    total.value = res.count || 0
  } catch (e: any) {
    alert(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handleReset = () => {
  searchText.value = ''
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

const openAddDialog = () => {
  dialogMode.value = 'add'
  Object.assign(form, {
    id: undefined,
    settingsId: undefined,
    courseType: '',
    learningMode: '',
    examTimeLimit: '',
    videoQuality: '',
    questionBankType: '',
    updateFrequency: ''
  })
  showDialog.value = true
}

const openEditDialog = (row: SystemSettingsOption) => {
  dialogMode.value = 'edit'
  Object.assign(form, { ...row })
  showDialog.value = true
}

const closeDialog = () => {
  if (saving.value) return
  showDialog.value = false
}

const handleSave = async () => {
  if (!form.courseType || !String(form.courseType).trim()) {
    alert('请填写课程类型')
    return
  }

  saving.value = true
  try {
    if (dialogMode.value === 'add') {
      const res = await addSystemSettings(form)
      if (res.code === 0 || res.code === 200) {
        alert('新增成功')
        showDialog.value = false
        loadData()
      } else {
        alert(res.msg || '新增失败')
      }
    } else {
      const res = await updateSystemSettings(form)
      if (res.code === 0 || res.code === 200) {
        alert('保存成功')
        showDialog.value = false
        loadData()
      } else {
        alert(res.msg || '保存失败')
      }
    }
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row: SystemSettingsOption) => {
  if (!row.id) return
  if (!confirm('确认删除该设置吗？')) return
  try {
    loading.value = true
    const res = await deleteSystemSettings(String(row.id))
    if (res.code === 0 || res.code === 200) {
      alert('删除成功')
      loadData()
    } else {
      alert(res.msg || '删除失败')
    }
  } catch (e: any) {
    alert(e.message || '删除失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
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
.header-actions {
  display: flex;
  gap: 10px;
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

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.search-input {
  flex: 1;
  min-width: 220px;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.btn-query,
.btn-reset {
  padding: 10px 18px;
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
.btn-reset {
  background: white;
  color: var(--text-regular);
  border: 1px solid var(--border-color);
}
.btn-query:hover {
  background: #66b1ff;
}
.btn-reset:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.table-card {
  margin-top: 8px;
}

.table {
  width: 100%;
}
.tr {
  display: grid;
  grid-template-columns: 0.6fr 1.6fr 1fr 1.4fr 1.4fr 1.4fr 1.4fr 1.4fr 1.4fr;
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
.index-col {
  text-align: center;
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}
.btn {
  padding: 6px 10px;
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
.empty-row {
  background: #fafafa;
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
  max-width: 700px;
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
.dialog-body {
  padding: 20px;
}
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}
.btn-cancel,
.btn-confirm {
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
.btn-confirm {
  background: var(--primary-color);
  color: white;
}
.btn-confirm:hover {
  background: #66b1ff;
}
.btn-cancel:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

@media (max-width: 900px) {
  .toolbar {
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
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>


