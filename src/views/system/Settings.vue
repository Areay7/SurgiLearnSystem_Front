<template>
  <div class="settings-page">
    <h1 class="page-title">系统设置</h1>
    
    <div class="settings-content">
      <div class="settings-panel">
        <div class="setting-section">
          <h3 class="section-title">基本设置</h3>
          <div class="setting-item">
            <label class="setting-label">系统名称</label>
            <input 
              type="text" 
              class="setting-input" 
              v-model="config.systemName" 
              placeholder="外科护理主管护师培训学习系统"
            />
          </div>
          <div class="setting-item">
            <label class="setting-label">系统 Logo</label>
            <div class="logo-upload-area">
              <div v-if="config.systemLogo" class="logo-preview">
                <img :src="logoDisplayUrl" alt="Logo" class="logo-img" @error="onLogoError" />
                <button type="button" class="btn-remove-logo" @click="removeLogo">移除</button>
              </div>
              <div v-else class="upload-placeholder" @click="triggerLogoUpload">
                <span>点击上传 Logo</span>
                <span class="upload-hint">支持 png、jpg、jpeg、gif、svg、webp</span>
              </div>
              <input ref="logoInputRef" type="file" accept="image/*" class="hidden-input" @change="onLogoSelected" />
            </div>
          </div>
          <div class="setting-item">
            <label class="setting-label">每页显示数量</label>
            <select class="setting-select" v-model.number="config.pageSize">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>
        
        <div class="setting-section">
          <h3 class="section-title">安全设置</h3>
          <div class="setting-item">
            <label class="setting-label">密码最小长度</label>
            <input 
              type="number" 
              class="setting-input" 
              v-model.number="config.passwordMinLength" 
              min="6" 
              max="32"
            />
          </div>
          <div class="setting-item">
            <label class="setting-label">登录失败锁定次数</label>
            <input 
              type="number" 
              class="setting-input" 
              v-model.number="config.loginLockCount" 
              min="3" 
              max="20"
            />
          </div>
        </div>
        
        <div class="settings-actions">
          <button class="btn-save" @click="saveSettings" :disabled="saving">
            {{ saving ? '保存中...' : '保存设置' }}
          </button>
          <button class="btn-reset" @click="loadConfig" :disabled="saving">重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getSystemConfig, saveSystemConfig, uploadLogo, getLogoUrl } from '@/api/settings'
import { useSystemConfigStore } from '@/stores/systemConfig'
import type { SystemConfig } from '@/api/settings'

const systemConfigStore = useSystemConfigStore()

const config = ref<SystemConfig>({
  systemName: '外科护理主管护师培训学习系统',
  pageSize: 10,
  passwordMinLength: 8,
  loginLockCount: 5
})

const saving = ref(false)
const logoInputRef = ref<HTMLInputElement | null>(null)
const logoError = ref(false)
const logoVersion = ref(0)

const logoDisplayUrl = computed(() => {
  if (!config.value.systemLogo || logoError.value) return ''
  return getLogoUrl() + '&v=' + logoVersion.value
})

function triggerLogoUpload() {
  logoInputRef.value?.click()
}

function onLogoSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  saving.value = true
  uploadLogo(file)
    .then((res: any) => {
      if (res.code === 200 || (res.code === 0 && res.data)) {
        config.value.systemLogo = res.data
        logoError.value = false
        logoVersion.value++
      } else {
        alert(res.msg || '上传失败')
      }
    })
    .catch((err: any) => {
      alert(err?.message || '上传失败')
    })
    .finally(() => {
      saving.value = false
      input.value = ''
    })
}

function onLogoError() {
  logoError.value = true
}

function removeLogo() {
  config.value.systemLogo = ''
  logoError.value = false
}

async function loadConfig() {
  try {
    const res = await getSystemConfig()
    if (res?.data) {
      config.value = {
        systemName: res.data.systemName ?? '外科护理主管护师培训学习系统',
        pageSize: res.data.pageSize ?? 10,
        systemLogo: res.data.systemLogo ?? '',
        passwordMinLength: res.data.passwordMinLength ?? 8,
        loginLockCount: res.data.loginLockCount ?? 5
      }
      logoError.value = false
    }
  } catch {
    console.error('加载配置失败')
  }
}

async function saveSettings() {
  saving.value = true
  try {
    const res = await saveSystemConfig(config.value)
    if (res?.code === 200 || res?.code === 0) {
      await systemConfigStore.refresh()
      alert('保存成功')
    } else {
      alert(res?.msg || '保存失败')
    }
  } catch (err: any) {
    alert(err?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<style scoped>
.settings-page { max-width: 100%; }

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.settings-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.setting-section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--border-color);
}

.setting-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.setting-item { margin-bottom: 20px; }

.setting-label {
  display: block;
  font-size: 14px;
  color: var(--text-regular);
  margin-bottom: 8px;
}

.setting-input, .setting-select {
  width: 100%;
  max-width: 400px;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
}

.logo-upload-area { max-width: 400px; }

.upload-placeholder {
  padding: 40px;
  border: 2px dashed var(--border-color);
  border-radius: 6px;
  text-align: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
}

.upload-placeholder:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.upload-hint { display: block; font-size: 12px; margin-top: 8px; }

.logo-preview {
  position: relative;
  display: inline-block;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.logo-img { max-height: 80px; max-width: 200px; display: block; }

.btn-remove-logo {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 4px 8px;
  font-size: 12px;
  background: #f5222d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.hidden-input { display: none; }

.settings-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.btn-save {
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-save:hover:not(:disabled) { background: #66b1ff; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-reset {
  padding: 12px 24px;
  background: white;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-reset:hover:not(:disabled) { border-color: var(--primary-color); color: var(--primary-color); }
</style>
