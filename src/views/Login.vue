<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="system-title">{{ systemConfig.systemName || '外科护理主管护师培训学习系统' }} V1.0</h1>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="phone">手机号</label>
          <input
            id="phone"
            v-model="form.phone"
            type="text"
            placeholder="请输入手机号"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            class="form-input"
          />
        </div>
        
        <div class="form-options">
          <label class="remember-me">
            <input
              v-model="form.remember"
              type="checkbox"
            />
            <span>记住我</span>
          </label>
          <a href="#" class="forgot-password" @click.prevent>忘记密码？</a>
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <button 
          type="submit" 
          class="login-btn" 
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? '登录中...' : '登录' }}
        </button>
        
        <div class="register-link">
          <span>还没有账号？</span>
          <a href="#" @click.prevent="openRegisterDialog">立即注册</a>
        </div>
      </form>
    </div>
    
    <!-- 注册对话框 -->
    <div v-if="showRegisterDialog" class="register-dialog-overlay" @click="showRegisterDialog = false">
      <div class="register-dialog" @click.stop>
        <div class="dialog-header">
          <h3>用户注册</h3>
          <button class="close-btn" @click="showRegisterDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <form @submit.prevent="handleRegister" class="register-form">
            <div class="form-group">
              <label>手机号</label>
              <input
                v-model="registerForm.phone"
                type="text"
                placeholder="请输入手机号"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>密码</label>
              <input
                v-model="registerForm.password"
                type="password"
                placeholder="请输入密码（至少6位）"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>确认密码</label>
              <input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                class="form-input"
              />
            </div>
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
            <button 
              type="submit" 
              class="register-btn"
              :disabled="authStore.loading"
            >
              {{ authStore.loading ? '注册中...' : '注册' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSystemConfigStore } from '@/stores/systemConfig'

const router = useRouter()
const systemConfig = useSystemConfigStore()
const authStore = useAuthStore()

const form = ref({
  phone: '',
  password: '',
  remember: false
})

const errorMessage = ref('')
const showRegisterDialog = ref(false)
const registerForm = ref({
  phone: '',
  password: '',
  confirmPassword: ''
})

// 页面加载时检查是否有记住的手机号
onMounted(() => {
  const remembered = localStorage.getItem('rememberedPhone')
  if (remembered) {
    form.value.phone = remembered
    form.value.remember = true
  }
  
  // 如果已经登录，跳转到首页
  if (authStore.isLoggedIn) {
    router.push('/dashboard')
  }
})

// 处理登录
const handleLogin = async () => {
  errorMessage.value = ''
  
  // 验证输入
  if (!form.value.phone.trim()) {
    errorMessage.value = '请输入手机号'
    return
  }
  
  if (!form.value.password.trim()) {
    errorMessage.value = '请输入密码'
    return
  }
  
  // 简单的手机号验证
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(form.value.phone)) {
    errorMessage.value = '请输入正确的手机号'
    return
  }
  
  try {
    const success = await authStore.login(
      form.value.phone, 
      form.value.password, 
      form.value.remember
    )
    
    if (success) {
      // 登录成功，跳转到首页
      router.push('/dashboard')
    }
  } catch (error: any) {
    errorMessage.value = error.message || '登录失败，请稍后重试'
  }
}

// 处理注册
const handleRegister = async () => {
  errorMessage.value = ''
  
  if (!registerForm.value.phone.trim()) {
    errorMessage.value = '请输入手机号'
    return
  }
  
  if (!registerForm.value.password.trim()) {
    errorMessage.value = '请输入密码'
    return
  }
  
  if (registerForm.value.password.length < 6) {
    errorMessage.value = '密码长度至少6位'
    return
  }
  
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }
  
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(registerForm.value.phone)) {
    errorMessage.value = '请输入正确的手机号'
    return
  }
  
  try {
    const success = await authStore.register(
      registerForm.value.phone,
      registerForm.value.password
    )
    
    if (success) {
      alert('注册成功，请登录')
      showRegisterDialog.value = false
      form.value.phone = registerForm.value.phone
      registerForm.value = {
        phone: '',
        password: '',
        confirmPassword: ''
      }
    }
  } catch (error: any) {
    // 显示详细错误信息
    const errorMsg = error.message || '注册失败，请稍后重试'
    errorMessage.value = errorMsg
    console.error('注册错误详情:', error)
  }
}

// 打开注册对话框
const openRegisterDialog = () => {
  showRegisterDialog.value = true
  errorMessage.value = ''
  registerForm.value = {
    phone: '',
    password: '',
    confirmPassword: ''
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #a8e6cf 0%, #c5e1a5 50%, #b2dfdb 100%);
  padding: 20px;
}

.login-container {
  background: var(--card-bg);
  border-radius: 18px;
  padding: 50px 42px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}

.system-title {
  font-size: 21px;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 34px;
  letter-spacing: -0.2px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  outline: none;
}

.form-input:focus {
  border-color: var(--primary-color);
}

.form-input::placeholder {
  color: var(--text-secondary);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-regular);
  cursor: pointer;
}

.remember-me input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.forgot-password {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.3s;
}

.forgot-password:hover {
  color: #66b1ff;
}

.login-btn {
  padding: 14px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-top: 8px;
  letter-spacing: 0.3px;
}

.login-btn:hover {
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(91, 155, 213, 0.35);
}

.login-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(91, 155, 213, 0.25);
}

.register-link {
  text-align: right;
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.register-link a {
  color: var(--primary-color);
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.3s;
}

.register-link a:hover {
  color: #66b1ff;
}

.error-message {
  color: #f56c6c;
  font-size: 13px;
  text-align: center;
  padding: 8px;
  background: #fef0f0;
  border-radius: 6px;
  border: 1px solid #fde2e2;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 注册对话框样式 */
.register-dialog-overlay {
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

.register-dialog {
  background: var(--card-bg);
  border-radius: 14px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.dialog-body {
  padding: 24px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.register-btn {
  padding: 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-top: 8px;
}

.register-btn:hover:not(:disabled) {
  background: var(--primary-light);
  transform: translateY(-1px);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .login-container {
    padding: 32px 24px;
  }
  
  .system-title {
    font-size: 18px;
  }
}
</style>

