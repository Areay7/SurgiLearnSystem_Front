<template>
  <div class="profile-page">
    <div class="page-header">
      <h1 class="page-title">个人主页</h1>
    </div>
    
    <div class="profile-content">
      <div class="profile-card">
        <div class="card-header">
          <h2>个人信息</h2>
        </div>
        <div class="card-body">
          <div v-if="loading" class="loading-state">
            <p>加载中...</p>
          </div>
          
          <div v-else class="profile-form">
            <div class="form-group">
              <label>手机号</label>
              <input
                type="text"
                :value="userInfo.username"
                class="form-input"
                disabled
              />
              <span class="form-hint">手机号不可修改</span>
            </div>
            
            <div class="form-group">
              <label>昵称</label>
              <input
                v-model="formData.nickname"
                type="text"
                placeholder="请输入昵称"
                class="form-input"
                maxlength="50"
              />
              <span class="form-hint">设置昵称后，系统将显示昵称而不是手机号</span>
            </div>
            
            <div class="form-actions">
              <button class="btn-primary" @click="handleSave" :disabled="saving">
                {{ saving ? '保存中...' : '保存' }}
              </button>
              <button class="btn-cancel" @click="handleCancel" :disabled="saving">
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getUserInfo, updateUserInfo, type UserInfo } from '@/api/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const userInfo = ref<UserInfo>({
  username: authStore.userPhone || '',
  nickname: ''
})

const formData = ref({
  nickname: ''
})

// 加载用户信息
const loadUserInfo = async () => {
  if (!authStore.userPhone) {
    router.push('/login')
    return
  }
  
  loading.value = true
  try {
    const response = await getUserInfo(authStore.userPhone)
    if (response.code === 200 || response.code === 0) {
      userInfo.value = response.data as UserInfo
      formData.value.nickname = userInfo.value.nickname || ''
    } else {
      alert('获取用户信息失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    console.error('获取用户信息失败:', error)
    alert('获取用户信息失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 保存用户信息
const handleSave = async () => {
  if (!authStore.userPhone) {
    alert('用户未登录')
    return
  }
  
  saving.value = true
  try {
    const response = await updateUserInfo({
      username: authStore.userPhone,
      nickname: formData.value.nickname.trim()
    })
    
    if (response.code === 200 || response.code === 0) {
      alert('保存成功')
      // 更新store中的昵称
      authStore.updateNickname(formData.value.nickname.trim())
      // 重新加载用户信息
      await loadUserInfo()
    } else {
      alert('保存失败：' + (response.msg || '未知错误'))
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    alert('保存失败：' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

// 取消
const handleCancel = () => {
  formData.value.nickname = userInfo.value.nickname || ''
}

// 页面加载
onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.profile-page {
  max-width: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 26px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.3px;
}

.profile-content {
  display: flex;
  justify-content: center;
}

.profile-card {
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 600px;
  overflow: hidden;
}

.card-header {
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, rgba(91, 155, 213, 0.05) 0%, rgba(91, 155, 213, 0.02) 100%);
}

.card-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.card-body {
  padding: 24px;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(91, 155, 213, 0.1);
}

.form-input:disabled {
  background: #f5f7fa;
  color: var(--text-secondary);
  cursor: not-allowed;
}

.form-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: -4px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-primary {
  padding: 10px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.25s ease;
  font-weight: 400;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 155, 213, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  padding: 10px 24px;
  background: var(--card-bg);
  color: var(--text-regular);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.25s ease;
  font-weight: 400;
}

.btn-cancel:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(91, 155, 213, 0.05);
  transform: translateY(-1px);
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
