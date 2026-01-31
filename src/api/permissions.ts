import request from '@/utils/request'

export interface PermissionDef {
  id?: number
  permissionCode: string
  permissionName: string
  module?: string
  description?: string
  sortOrder?: number
}

export interface Role {
  id?: number
  roleCode: string
  roleName: string
  description?: string
  userTypeFlag?: number
}

export interface UserPermission {
  id?: number
  userId?: number | null
  userPhone?: string
  permissionCode: string
  permissionName: string
  isActive?: number
  grantType?: string  // grant | revoke
}

export interface PermissionListParams {
  page?: number
  limit?: number
  searchText?: string
  userId?: number | null
  userPhone?: string
  permissionCode?: string
  permissionName?: string
  isActive?: number | null
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
}

export interface PageResponse<T> {
  code: number
  msg: string
  count: number
  data: T[]
}

export function getPermissionList(params: PermissionListParams): Promise<PageResponse<UserPermission>> {
  const requestParams: any = {
    page: params.page || 1,
    limit: params.limit || 10
  }

  if (params.userId !== undefined && params.userId !== null && params.userId !== ('' as any)) {
    requestParams.userId = params.userId
  }
  if (params.userPhone) requestParams.userPhone = params.userPhone
  if (params.permissionCode) requestParams.permissionCode = params.permissionCode
  if (params.permissionName) requestParams.permissionName = params.permissionName
  if (params.isActive !== undefined && params.isActive !== null && params.isActive !== ('' as any)) {
    requestParams.isActive = params.isActive
  }
  if (params.searchText) requestParams.searchText = params.searchText

  return request({
    url: '/UserPermissionController/list',
    method: 'get',
    params: requestParams
  })
}

export function getPermissionDetail(id: number): Promise<ApiResponse<UserPermission>> {
  return request({
    url: `/UserPermissionController/detail/${id}`,
    method: 'get'
  })
}

export function addPermission(data: UserPermission): Promise<ApiResponse> {
  return request({
    url: '/UserPermissionController/add',
    method: 'post',
    data
  })
}

export function updatePermission(data: UserPermission): Promise<ApiResponse> {
  return request({
    url: '/UserPermissionController/edit',
    method: 'post',
    data
  })
}

export function deletePermission(ids: string): Promise<ApiResponse> {
  return request({
    url: '/UserPermissionController/remove',
    method: 'delete',
    params: { ids }
  })
}

// 权限定义
export function getPermissionDefList(): Promise<ApiResponse<PermissionDef[]>> {
  return request({
    url: '/PermissionManageController/permissionDef/list',
    method: 'get'
  })
}

// 角色
export function getRoleList(): Promise<ApiResponse<Role[]>> {
  return request({
    url: '/PermissionManageController/role/list',
    method: 'get'
  })
}

// 角色权限
export function getRolePermissions(roleId: number): Promise<ApiResponse<string[]>> {
  return request({
    url: `/PermissionManageController/role/${roleId}/permissions`,
    method: 'get'
  })
}

export function setRolePermissions(roleId: number, permissionCodes: string[]): Promise<ApiResponse<number>> {
  return request({
    url: `/PermissionManageController/role/${roleId}/permissions`,
    method: 'post',
    data: permissionCodes
  })
}

// 用户权限（查询）
export function getUserPermissions(userPhone: string): Promise<ApiResponse<string[]>> {
  return request({
    url: `/PermissionManageController/user/${encodeURIComponent(userPhone)}/permissions`,
    method: 'get'
  })
}

