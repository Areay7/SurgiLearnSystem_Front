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
            <!-- 基本信息 -->
            <div class="form-section">
              <h3 class="section-title">基本信息</h3>
              <div class="form-grid">
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
                    :disabled="saving"
                  />
                  <span class="form-hint">设置昵称后，系统将显示昵称而不是手机号</span>
                </div>
                
                <div class="form-group">
                  <label>学员姓名 *</label>
                  <input
                    v-model="studentForm.studentName"
                    type="text"
                    placeholder="请输入学员姓名（新用户注册后请及时完善）"
                    class="form-input"
                    maxlength="100"
                    :disabled="saving"
                  />
                  <span class="form-hint" v-if="studentForm.studentName === '待完善'">请将默认「待完善」改为您的真实姓名</span>
                </div>
                
                <div class="form-group">
                  <label>员工编号</label>
                  <input
                    v-model="studentForm.employeeId"
                    type="text"
                    placeholder="请输入员工编号"
                    class="form-input"
                    maxlength="50"
                    :disabled="saving"
                  />
                </div>
                
                <div class="form-group">
                  <label>邮箱</label>
                  <input
                    v-model="studentForm.email"
                    type="email"
                    placeholder="请输入邮箱"
                    class="form-input"
                    maxlength="100"
                    :disabled="saving"
                  />
                </div>
                
                <div class="form-group">
                  <label>性别</label>
                  <select class="form-input" v-model="studentForm.gender" :disabled="saving">
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label>用户类型</label>
                  <select class="form-input" v-model="studentForm.userType" :disabled="saving || !isAdmin">
                    <option :value="1">学员</option>
                    <option :value="2">讲师</option>
                    <option :value="3">其他(管理员)</option>
                  </select>
                  <span class="form-hint" v-if="!isAdmin">用户类型仅管理员可修改</span>
                </div>
              </div>
            </div>
            
            <!-- 工作信息 -->
            <div class="form-section">
              <h3 class="section-title">工作信息</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label>部门</label>
                  <input
                    v-model="studentForm.department"
                    type="text"
                    placeholder="请输入部门"
                    class="form-input"
                    maxlength="100"
                    :disabled="saving"
                  />
                </div>
                
                <div class="form-group">
                  <label>职位</label>
                  <input
                    v-model="studentForm.position"
                    type="text"
                    placeholder="请输入职位"
                    class="form-input"
                    maxlength="100"
                    :disabled="saving"
                  />
                </div>
                
                <div class="form-group">
                  <label>职称</label>
                  <select class="form-input" v-model="studentForm.title" :disabled="saving">
                    <option value="">请选择</option>
                    <option value="护士">护士</option>
                    <option value="护师">护师</option>
                    <option value="主管护师">主管护师</option>
                    <option value="副主任护师">副主任护师</option>
                    <option value="主任护师">主任护师</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label>层级</label>
                  <select class="form-input" v-model="studentForm.level" :disabled="saving">
                    <option value="">请选择</option>
                    <option value="N0">N0</option>
                    <option value="N1">N1</option>
                    <option value="N2">N2</option>
                    <option value="N3">N3</option>
                    <option value="N4">N4</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label>状态</label>
                  <select class="form-input" v-model="studentForm.status" :disabled="saving">
                    <option value="正常">正常</option>
                    <option value="停用">停用</option>
                  </select>
                </div>
                
                <div class="form-group"></div>
              </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getUserInfo, updateUserInfo, getStudentInfo, updateStudentInfo, type UserInfo, type StudentInfo } from '@/api/auth'

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

const studentForm = ref<StudentInfo>({
  studentName: '',
  phone: authStore.userPhone || '',
  email: '',
  gender: '',
  department: '',
  position: '',
  title: '',
  level: '',
  employeeId: '',
  userType: 1, // 默认学员
  status: '正常',
  enrollmentDate: ''
})

const isAdmin = computed(() => {
  return authStore.userType === 1
})

// 加载用户信息
const loadUserInfo = async () => {
  if (!authStore.userPhone) {
    router.push('/login')
    return
  }
  
  loading.value = true
  try {
    // 加载登录用户信息（昵称等）
    const userResponse = await getUserInfo(authStore.userPhone)
    if (userResponse.code === 200 || userResponse.code === 0) {
      userInfo.value = userResponse.data as UserInfo
      formData.value.nickname = userInfo.value.nickname || ''
    } else {
      console.warn('获取用户信息失败：', userResponse.msg)
    }
    
    // 加载学员详细信息
    const studentResponse = await getStudentInfo(authStore.userPhone)
    if (studentResponse.code === 200 || studentResponse.code === 0) {
      const student = studentResponse.data as StudentInfo
      if (student) {
        // 填充表单数据
        studentForm.value = {
          studentName: student.studentName || '',
          phone: student.phone || authStore.userPhone || '',
          email: student.email || '',
          gender: student.gender || '',
          department: student.department || '',
          position: student.position || '',
          title: student.title || '',
          level: student.level || '',
          employeeId: student.employeeId || '',
          userType: student.userType || 1,
          status: student.status || '正常',
          enrollmentDate: student.enrollmentDate ? student.enrollmentDate.split('T')[0] : ''
        }
      }
    } else {
      console.warn('获取学员信息失败：', studentResponse.msg)
      // 如果学员记录不存在，使用默认值
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
  
  // 验证必填字段
  if (!studentForm.value.studentName?.trim()) {
    alert('请输入学员姓名')
    return
  }
  
  saving.value = true
  try {
    // 保存昵称（登录用户信息）
    if (formData.value.nickname !== userInfo.value.nickname) {
      const userResponse = await updateUserInfo({
        username: authStore.userPhone,
        nickname: formData.value.nickname.trim()
      })
      
      if (userResponse.code === 200 || userResponse.code === 0) {
        // 更新store中的昵称
        authStore.updateNickname(formData.value.nickname.trim())
      } else {
        console.warn('更新昵称失败：', userResponse.msg)
      }
    }
    
    // 保存学员详细信息
    const studentData: any = {
      phone: authStore.userPhone,
      studentName: studentForm.value.studentName.trim(),
      email: studentForm.value.email?.trim() || undefined,
      gender: studentForm.value.gender || undefined,
      department: studentForm.value.department?.trim() || undefined,
      position: studentForm.value.position?.trim() || undefined,
      title: studentForm.value.title || undefined,
      level: studentForm.value.level || undefined,
      employeeId: studentForm.value.employeeId?.trim() || undefined,
      status: studentForm.value.status || '正常',
      enrollmentDate: studentForm.value.enrollmentDate ? new Date(studentForm.value.enrollmentDate).toISOString() : undefined
    }
    
    // 只有管理员可以修改用户类型
    if (isAdmin.value && studentForm.value.userType) {
      studentData.userType = studentForm.value.userType
    }
    
    const studentResponse = await updateStudentInfo(studentData)
    
    if (studentResponse.code === 200 || studentResponse.code === 0) {
      alert('保存成功')
      // 重新加载用户信息
      await loadUserInfo()
    } else {
      alert('保存失败：' + (studentResponse.msg || '未知错误'))
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
  loadUserInfo()
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
  max-width: 1000px;
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
  gap: 32px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border-color);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
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
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
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

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-card {
    max-width: 100%;
  }
}
</style>
