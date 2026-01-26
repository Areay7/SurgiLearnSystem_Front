import request from '@/utils/request'

// 登录请求参数
export interface LoginRequest {
  phone: string
  password: string
}

// 注册请求参数
export interface RegisterRequest {
  phone: string
  password: string
}

// 修改密码请求参数
export interface ChangePasswordRequest {
  phone: string
  oldPassword: string
  newPassword: string
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
}

/**
 * 用户登录
 */
export function login(data: LoginRequest): Promise<ApiResponse<string>> {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

/**
 * 用户注册
 */
export function register(data: RegisterRequest): Promise<ApiResponse> {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

/**
 * 修改密码
 */
export function changePassword(data: ChangePasswordRequest): Promise<ApiResponse> {
  return request({
    url: '/auth/changePassword',
    method: 'post',
    data
  })
}
