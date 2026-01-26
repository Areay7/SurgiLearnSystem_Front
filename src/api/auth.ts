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

// 用户信息类型
export interface UserInfo {
  id?: number
  username: string
  nickname?: string
}

/**
 * 获取用户信息
 */
export function getUserInfo(username: string): Promise<ApiResponse<UserInfo>> {
  return request({
    url: '/auth/userInfo',
    method: 'get',
    params: { username }
  })
}

/**
 * 更新用户信息
 */
export function updateUserInfo(data: { username: string; nickname: string }): Promise<ApiResponse> {
  return request({
    url: '/auth/updateUserInfo',
    method: 'post',
    data
  })
}

/**
 * 批量获取用户信息（用于显示昵称）
 */
export function batchUserInfo(usernames: string[]): Promise<ApiResponse<Record<string, string>>> {
  return request({
    url: '/auth/batchUserInfo',
    method: 'post',
    data: { usernames }
  })
}
