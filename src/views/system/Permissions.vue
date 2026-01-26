<template>
  <div class="permissions-page">
    <div class="page-header">
      <h1 class="page-title">用户权限管理</h1>
      <button class="btn-primary">添加用户</button>
    </div>
    
    <div class="permissions-content">
      <div class="filter-bar">
        <input type="text" placeholder="搜索用户..." class="search-input" />
        <select class="filter-select">
          <option>全部角色</option>
          <option>管理员</option>
          <option>讲师</option>
          <option>学员</option>
        </select>
      </div>
      
      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>用户名</th>
              <th>姓名</th>
              <th>角色</th>
              <th>邮箱</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in 8" :key="i">
              <td>user{{ i }}</td>
              <td>用户{{ i }}</td>
              <td>
                <span class="role-badge" :class="getRoleClass(i)">
                  {{ getRole(i) }}
                </span>
              </td>
              <td>user{{ i }}@example.com</td>
              <td>
                <span class="status-badge" :class="i % 3 === 0 ? 'inactive' : 'active'">
                  {{ i % 3 === 0 ? '禁用' : '启用' }}
                </span>
              </td>
              <td>
                <button class="btn-edit">编辑</button>
                <button class="btn-permission">权限</button>
                <button class="btn-delete">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="pagination">
        <button class="page-btn">上一页</button>
        <span class="page-info">第 1 页，共 2 页</span>
        <button class="page-btn">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const getRole = (index: number) => {
  const roles = ['管理员', '讲师', '学员']
  return roles[index % 3]
}

const getRoleClass = (index: number) => {
  const classes = ['admin', 'instructor', 'student']
  return classes[index % 3]
}
</script>

<style scoped>
.permissions-page {
  max-width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-primary {
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #66b1ff;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.users-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f5f7fa;
}

th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

td {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  color: var(--text-regular);
  font-size: 14px;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.admin {
  background: #fef0f0;
  color: var(--danger-color);
}

.role-badge.instructor {
  background: #f0f9ff;
  color: var(--primary-color);
}

.role-badge.student {
  background: #f0f9ff;
  color: var(--info-color);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #f0f9ff;
  color: var(--success-color);
}

.status-badge.inactive {
  background: #fef0f0;
  color: var(--danger-color);
}

.btn-edit, .btn-permission, .btn-delete {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 8px;
  transition: all 0.3s;
}

.btn-edit:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-permission:hover {
  border-color: var(--warning-color);
  color: var(--warning-color);
}

.btn-delete:hover {
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}

@media (max-width: 768px) {
  .users-table {
    font-size: 12px;
  }
  
  th, td {
    padding: 8px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>

