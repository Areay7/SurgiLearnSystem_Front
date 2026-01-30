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

// 管理员重置密码请求参数
export interface AdminResetPasswordRequest {
  phone: string
  newPassword: string
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
}

// 登录返回数据
export interface LoginResponseData {
  token: string
  userType: number // 0普通用户 1管理员
}

/**
 * 用户登录
 */
export function login(data: LoginRequest): Promise<ApiResponse<LoginResponseData>> {
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

/**
 * 管理员重置任意用户密码
 */
export function adminResetPassword(data: AdminResetPasswordRequest): Promise<ApiResponse> {
  return request({
    url: '/auth/adminResetPassword',
    method: 'post',
    data
  })
}

// 用户信息类型
export interface UserInfo {
  id?: number
  username: string
  nickname?: string
  userType?: number
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

// 学员详细信息类型（来自 students 表）
export interface StudentInfo {
  id?: number
  studentId?: number
  studentName?: string
  phone?: string
  email?: string
  gender?: string
  department?: string
  position?: string
  title?: string
  level?: string
  employeeId?: string
  userType?: number // 1-学员 2-讲师 3-其他(管理员)
  status?: string
  enrollmentDate?: string
  createTime?: string
  updateTime?: string
}

/**
 * 获取学员详细信息
 */
export function getStudentInfo(phone: string): Promise<ApiResponse<StudentInfo>> {
  return request({
    url: '/auth/studentInfo',
    method: 'get',
    params: { phone }
  })
}

/**
 * 更新学员详细信息
 */
export function updateStudentInfo(data: {
  phone: string
  studentName?: string
  email?: string
  gender?: string
  department?: string
  position?: string
  title?: string
  level?: string
  employeeId?: string
  userType?: number
  status?: string
  enrollmentDate?: string
}): Promise<ApiResponse> {
  return request({
    url: '/auth/updateStudentInfo',
    method: 'post',
    data
  })
}
