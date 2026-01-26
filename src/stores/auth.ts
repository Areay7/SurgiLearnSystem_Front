import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, register as registerApi, getUserInfo as getUserInfoApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const userPhone = ref('')
  const nickname = ref('')
  const token = ref('')
  const loading = ref(false)
  
  // 初始化时检查是否有token
  const initAuth = () => {
    const savedToken = localStorage.getItem('token')
    const savedPhone = localStorage.getItem('userPhone')
    const savedNickname = localStorage.getItem('nickname')
    if (savedToken && savedPhone) {
      token.value = savedToken
      userPhone.value = savedPhone
      nickname.value = savedNickname || ''
      isLoggedIn.value = true
    }
  }
  
  // 获取用户信息
  const fetchUserInfo = async () => {
    if (!userPhone.value) return
    
    try {
      const response = await getUserInfoApi(userPhone.value)
      if (response.code === 200 || response.code === 0) {
        const userInfo = response.data
        if (userInfo) {
          nickname.value = userInfo.nickname || ''
          localStorage.setItem('nickname', nickname.value)
        }
      }
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
    }
  }
  
  // 登录方法
  const login = async (phone: string, password: string, remember: boolean = false) => {
    if (!phone.trim() || !password.trim()) {
      throw new Error('请输入手机号和密码')
    }
    
    loading.value = true
    try {
      console.log('开始登录，手机号:', phone)
      const response = await loginApi({ phone, password })
      console.log('登录响应:', response)
      
      if (response.code === 200 || response.code === 0) {
        // 登录成功
        isLoggedIn.value = true
        userPhone.value = phone
        token.value = response.data || ''
        
        // 保存token和用户信息
        localStorage.setItem('token', token.value)
        localStorage.setItem('userPhone', phone)
        
        // 获取用户信息（包括昵称）
        await fetchUserInfo()
        
        // 如果选择记住我，保存到 localStorage
        if (remember) {
          localStorage.setItem('rememberedPhone', phone)
        } else {
          localStorage.removeItem('rememberedPhone')
        }
        
        return true
      } else {
        throw new Error(response.msg || '登录失败')
      }
    } catch (error: any) {
      console.error('登录错误:', error)
      // 如果错误信息包含网络错误，提供更详细的提示
      if (error.message && error.message.includes('网络错误')) {
        throw new Error('无法连接到服务器，请检查：\n1. 后端服务是否启动（http://127.0.0.1:8080）\n2. 网络连接是否正常\n3. 防火墙设置')
      }
      throw error
    } finally {
      loading.value = false
    }
  }
  
  // 注册方法
  const register = async (phone: string, password: string) => {
    if (!phone.trim() || !password.trim()) {
      throw new Error('请输入手机号和密码')
    }
    
    loading.value = true
    try {
      console.log('开始注册，手机号:', phone)
      const response = await registerApi({ phone, password })
      console.log('注册响应:', response)
      
      if (response.code === 200 || response.code === 0) {
        return true
      } else {
        throw new Error(response.msg || '注册失败')
      }
    } catch (error: any) {
      console.error('注册错误:', error)
      // 如果错误信息包含网络错误，提供更详细的提示
      if (error.message && error.message.includes('网络错误')) {
        throw new Error('无法连接到服务器，请检查：\n1. 后端服务是否启动（http://127.0.0.1:8080）\n2. 网络连接是否正常\n3. 防火墙设置')
      }
      throw error
    } finally {
      loading.value = false
    }
  }
  
  // 登出方法
  const logout = () => {
    isLoggedIn.value = false
    userPhone.value = ''
    nickname.value = ''
    token.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('userPhone')
    localStorage.removeItem('nickname')
    localStorage.removeItem('rememberedPhone')
  }
  
  // 更新昵称
  const updateNickname = (newNickname: string) => {
    nickname.value = newNickname
    localStorage.setItem('nickname', newNickname)
  }
  
  // 检查是否有记住的手机号
  const checkRemembered = () => {
    const remembered = localStorage.getItem('rememberedPhone')
    if (remembered) {
      userPhone.value = remembered
    }
  }
  
  // 初始化认证状态
  initAuth()
  
  return {
    isLoggedIn,
    userPhone,
    nickname,
    token,
    loading,
    login,
    register,
    logout,
    checkRemembered,
    fetchUserInfo,
    updateNickname
  }
})

