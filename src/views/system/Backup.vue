<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">数据备份</h1>
      <button class="btn-primary" @click="executeNow" :disabled="executing">
        {{ executing ? '备份中...' : '立即备份' }}
      </button>
    </div>

    <div class="cards">
      <div class="card metric">
        <div class="k">最近一次备份</div>
        <div class="v">{{ lastBackupTime || '-' }}</div>
        <div class="sub">{{ lastBackupInfo }}</div>
      </div>
      <div class="card metric">
        <div class="k">备份策略</div>
        <div class="v">{{ config.autoEnabled ? `每日 ${config.scheduleTime || '02:00'}` : '未启用' }}</div>
        <div class="sub">保留 {{ config.retentionDays || 30 }} 天</div>
      </div>
      <div class="card metric">
        <div class="k">备份内容</div>
        <div class="v">uploads + 数据库</div>
        <div class="sub">完整数据导出</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2 class="card-title">备份策略配置</h2>
        <div class="form">
          <div class="field">
            <div class="label">备份保存路径 *</div>
            <div class="value full">
              <input
                type="text"
                class="form-input path-input"
                v-model="config.backupPath"
                placeholder="如 /data/backups 或 C:\backups（留空使用用户目录/surgilearn_backups）"
              />
            </div>
          </div>
          <div class="field">
            <div class="label">自动备份</div>
            <div class="value">
              <label class="switch">
                <input type="checkbox" v-model="config.autoEnabled" :true-value="1" :false-value="0" />
                <span class="slider" />
              </label>
            </div>
          </div>
          <div class="field">
            <div class="label">备份时间</div>
            <div class="value">
              <select class="select" v-model="config.scheduleTime">
                <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>
          <div class="field">
            <div class="label">保留天数</div>
            <div class="value">
              <select class="select" v-model.number="config.retentionDays">
                <option :value="7">7 天</option>
                <option :value="14">14 天</option>
                <option :value="30">30 天</option>
                <option :value="60">60 天</option>
                <option :value="90">90 天</option>
              </select>
            </div>
          </div>
          <div class="field">
            <div class="label">备份内容</div>
            <div class="value full">
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.includeUploads" :true-value="1" :false-value="0" />
                包含 uploads 文件夹（上传的文件、视频、资料等）
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.includeDatabase" :true-value="1" :false-value="0" />
                包含数据库导出（SQL 文件）
              </label>
            </div>
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-primary" @click="saveConfig" :disabled="savingConfig">
            {{ savingConfig ? '保存中...' : '保存配置' }}
          </button>
          <button class="btn" @click="runCleanup">清理过期备份</button>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">备份记录</h2>
        <div class="table-wrap">
        <div class="table">
          <div class="tr th">
            <div class="td">时间</div>
            <div class="td">类型</div>
            <div class="td">大小</div>
              <div class="td">耗时</div>
            <div class="td">状态</div>
            <div class="td actions">操作</div>
          </div>
            <div v-if="loading" class="tr">
              <div class="td" colspan="6" style="text-align:center;padding:24px">加载中...</div>
            </div>
            <div v-else-if="backups.length === 0" class="tr">
              <div class="td empty-state" colspan="6">暂无备份记录</div>
            </div>
            <div v-else v-for="b in backups" :key="b.id" class="tr">
              <div class="td">{{ formatTime(b.createTime) }}</div>
              <div class="td">{{ b.backupType === 'auto' ? '自动' : '手动' }}</div>
              <div class="td">{{ formatSize(b.fileSize) }}</div>
              <div class="td">{{ b.durationSeconds != null ? b.durationSeconds + 's' : '-' }}</div>
              <div class="td">
                <span class="badge" :class="b.status === 'success' ? 'ok' : 'danger'">
                  {{ b.status === 'success' ? '成功' : '失败' }}
                </span>
                <span v-if="b.errorMsg" class="error-msg" :title="b.errorMsg">⚠</span>
            </div>
            <div class="td actions">
                <button class="btn" @click="downloadBackup(b)" :disabled="b.status !== 'success'">下载</button>
                <button class="btn danger" @click="deleteBackup(b)">删除</button>
              </div>
            </div>
          </div>
        </div>
        <div class="pagination">
          <button class="page-btn" @click="prevPage" :disabled="currentPage <= 1 || loading">上一页</button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button class="page-btn" @click="nextPage" :disabled="currentPage >= totalPages || loading">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getBackupConfig,
  saveBackupConfig,
  executeBackup,
  getBackupList,
  getBackupDownloadUrl,
  deleteBackup as deleteBackupApi,
  cleanupBackup,
  type BackupConfig,
  type BackupRecord
} from '@/api/backup'

const config = ref<BackupConfig>({
  backupPath: '',
  autoEnabled: 0,
  scheduleTime: '02:00',
  retentionDays: 30,
  includeUploads: 1,
  includeDatabase: 1
})

const timeOptions = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00',
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00'
]

const backups = ref<BackupRecord[]>([])
const loading = ref(false)
const savingConfig = ref(false)
const executing = ref(false)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const lastBackupTime = computed(() => {
  const first = backups.value[0]
  return first?.createTime ? formatTime(first.createTime) : null
})

const lastBackupInfo = computed(() => {
  const first = backups.value.find(b => b.status === 'success')
  if (!first) return '暂无成功备份'
  const type = first.backupType === 'auto' ? '自动' : '手动'
  const dur = first.durationSeconds != null ? first.durationSeconds + 's' : ''
  return `类型：${type}${dur ? ' · 耗时：' + dur : ''}`
})

function formatTime(t?: string) {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 19)
}

function formatSize(bytes?: number) {
  if (bytes == null || bytes === 0) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function loadConfig() {
  try {
    const res = await getBackupConfig()
    if (res?.data) {
      config.value = { ...config.value, ...res.data }
    }
  } catch {
    console.error('加载配置失败')
  }
}

async function loadList() {
  loading.value = true
  try {
    const res = await getBackupList({ page: currentPage.value, limit: pageSize })
    backups.value = res.data || []
    total.value = res.count || 0
  } catch {
    backups.value = []
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  savingConfig.value = true
  try {
    await saveBackupConfig(config.value)
    alert('配置已保存')
    loadConfig()
  } catch (e: any) {
    alert(e?.message || '保存失败')
  } finally {
    savingConfig.value = false
  }
}

async function executeNow() {
  executing.value = true
  try {
    const res = await executeBackup({
      backupPath: config.value.backupPath || undefined,
      includeUploads: config.value.includeUploads !== 0,
      includeDatabase: config.value.includeDatabase !== 0
    })
    if (res.code === 200 || res.code === 0) {
      alert('备份成功')
      loadList()
    } else {
      alert(res.msg || '备份失败')
    }
  } catch (e: any) {
    alert(e?.message || '备份失败，请确保服务器已安装 mysqldump 且路径正确')
  } finally {
    executing.value = false
  }
}

async function downloadBackup(b: BackupRecord) {
  if (!b.id || b.status !== 'success') return
  try {
    const url = await getBackupDownloadUrl(b.id)
    if (!url) {
      alert('获取下载地址失败')
      return
    }
    window.location.href = url
  } catch (e: any) {
    alert(e?.message || '下载失败')
  }
}

async function deleteBackup(b: BackupRecord) {
  if (!b.id) return
  if (!confirm('确定删除该备份记录及文件吗？')) return
  try {
    await deleteBackupApi(b.id)
    loadList()
  } catch (e: any) {
    alert(e?.message || '删除失败')
  }
}

async function runCleanup() {
  if (!confirm(`确定清理超过 ${config.value.retentionDays || 30} 天的备份吗？`)) return
  try {
    await cleanupBackup(config.value.retentionDays)
    alert('清理完成')
    loadList()
  } catch (e: any) {
    alert(e?.message || '清理失败')
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    loadList()
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadList()
  }
}

onMounted(() => {
  loadConfig()
  loadList()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 24px; font-weight: 600; color: var(--text-primary); }
.btn-primary { padding: 10px 18px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.btn-primary:hover { background: #66b1ff; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 16px; }
.card { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
.metric { padding: 16px; }
.k { color: var(--text-secondary); font-size: 12px; }
.v { margin-top: 8px; font-size: 18px; font-weight: 700; color: var(--text-primary); }
.sub { margin-top: 6px; font-size: 12px; color: var(--text-secondary); }

.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 16px; }
.card-title { padding: 14px 16px; border-bottom: 1px solid var(--border-color); font-weight: 600; }

.form { padding: 14px 16px; display: grid; gap: 12px; }
.field { display: flex; gap: 12px; align-items: flex-start; }
.field .label { min-width: 100px; padding-top: 8px; }
.field .value { flex: 1; }
.field .value.full { flex: 1; }
.path-input { width: 100%; max-width: 400px; }
.form-input { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px; }
.select { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px; min-width: 120px; }
.checkbox-label { display: block; margin: 6px 0; font-size: 13px; cursor: pointer; }
.checkbox-label input { margin-right: 8px; }

.actions { padding: 0 16px 16px; display: flex; gap: 8px; }
.btn { padding: 8px 14px; border: 1px solid var(--border-color); background: white; border-radius: 6px; cursor: pointer; font-size: 13px; }
.btn:hover { border-color: var(--primary-color); color: var(--primary-color); }
.btn.danger:hover { border-color: #dc2626; color: #dc2626; }

.table-wrap { overflow-x: auto; }
.table .tr { display: grid; grid-template-columns: 1.4fr 0.6fr 0.6fr 0.5fr 0.6fr 1fr; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-color); align-items: center; }
.table .tr:last-child { border-bottom: none; }
.th { background: #f7f9fc; color: var(--text-secondary); font-size: 12px; font-weight: 600; }
.td { color: var(--text-regular); font-size: 14px; }
.empty-state { padding: 24px; text-align: center; color: var(--text-secondary); }
.badge { padding: 4px 10px; border-radius: 999px; font-size: 12px; }
.badge.ok { background: rgba(103, 194, 58, 0.1); color: #3f9c1f; }
.badge.danger { background: rgba(245, 108, 108, 0.12); color: #d64545; }
.error-msg { margin-left: 4px; cursor: help; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; }
.page-btn { padding: 6px 14px; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; background: white; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { font-size: 14px; color: var(--text-secondary); }

@media (max-width: 768px) {
  .table .tr { grid-template-columns: 1fr; }
  .th { display: none; }
}
</style>
