import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { API_BASE_URL, REQUEST_TIMEOUT } from '@/config/api'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 打印请求信息，方便调试
    console.log('发送请求:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: (config.baseURL || '') + (config.url || '')
    })
    
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    
    // 如果返回的状态码不是200，则视为错误
    if (res.code !== undefined && res.code !== 200 && res.code !== 0) {
      // token过期或无效
      if (res.code === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userPhone')
        window.location.href = '/login'
      }
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    
    return res
  },
  (error) => {
    console.error('响应错误:', error)
    console.error('错误详情:', {
      message: error.message,
      response: error.response,
      request: error.request,
      config: error.config
    })
    
    let message = '请求失败'
    
    if (error.response) {
      // 服务器返回了响应，但状态码不在2xx范围内
      const status = error.response.status
      const data = error.response.data
      
      // 尝试从响应数据中获取错误信息
      if (data && data.msg) {
        message = data.msg
      } else if (data && data.message) {
        message = data.message
      } else {
        switch (status) {
          case 401:
            message = '未授权，请重新登录'
            localStorage.removeItem('token')
            localStorage.removeItem('userPhone')
            window.location.href = '/login'
            break
          case 403:
            message = '拒绝访问'
            break
          case 404:
            message = '请求地址不存在，请检查API地址是否正确'
            break
          case 500:
            message = '服务器内部错误，请稍后重试'
            break
          default:
            message = `请求失败: ${status}`
        }
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      message = '网络错误，无法连接到服务器。请检查：\n1. 后端服务是否启动\n2. API地址是否正确\n3. 网络连接是否正常'
      console.error('请求未收到响应:', error.request)
    } else {
      // 请求配置出错
      message = error.message || '请求配置错误'
    }
    
    return Promise.reject(new Error(message))
  }
)

export default service
