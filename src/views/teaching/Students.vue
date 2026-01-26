<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">学员记录管理</h1>
      <button class="btn-primary">新增学员</button>
    </div>

    <div class="filters">
      <input class="search-input" placeholder="搜索姓名/工号/手机号..." />
      <select class="select">
        <option>全部角色</option>
        <option>学员</option>
        <option>讲师</option>
        <option>管理员</option>
      </select>
      <select class="select">
        <option>全部状态</option>
        <option>正常</option>
        <option>停用</option>
      </select>
    </div>

    <div class="card">
      <div class="table">
        <div class="tr th">
          <div class="td">姓名</div>
          <div class="td">工号</div>
          <div class="td">角色</div>
          <div class="td">联系方式</div>
          <div class="td">注册时间</div>
          <div class="td">状态</div>
          <div class="td actions">操作</div>
        </div>
        <div class="tr" v-for="s in students" :key="s.id">
          <div class="td name">
            <div class="title">{{ s.name }}</div>
            <div class="sub">科室：{{ s.dept }}</div>
          </div>
          <div class="td">{{ s.no }}</div>
          <div class="td">{{ s.role }}</div>
          <div class="td">{{ s.phone }}</div>
          <div class="td">{{ s.createdAt }}</div>
          <div class="td">
            <span class="badge" :class="s.status === '正常' ? 'ok' : 'muted'">{{ s.status }}</span>
          </div>
          <div class="td actions">
            <button class="btn">详情</button>
            <button class="btn">编辑</button>
            <button class="btn danger">重置密码</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type UserRole = '学员' | '讲师' | '管理员'
type UserStatus = '正常' | '停用'
type StudentRow = {
  id: string
  name: string
  dept: string
  no: string
  role: UserRole
  phone: string
  createdAt: string
  status: UserStatus
}

const students: StudentRow[] = [
  {
    id: 'u-001',
    name: '张三',
    dept: '外科',
    no: 'SG-1024',
    role: '学员',
    phone: '138****1234',
    createdAt: '2026-01-12',
    status: '正常'
  },
  {
    id: 'u-002',
    name: '李老师',
    dept: '护理部',
    no: 'JS-0007',
    role: '讲师',
    phone: '139****5678',
    createdAt: '2026-01-05',
    status: '正常'
  },
  {
    id: 'u-003',
    name: '王五',
    dept: '外科',
    no: 'SG-2048',
    role: '学员',
    phone: '137****8842',
    createdAt: '2025-12-29',
    status: '停用'
  }
]
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}
.btn-primary {
  padding: 10px 18px;
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
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.search-input,
.select {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.search-input {
  flex: 1;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.tr {
  display: grid;
  grid-template-columns: 1fr 0.9fr 0.8fr 1fr 0.9fr 0.8fr 1.4fr;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}
.tr:last-child {
  border-bottom: none;
}
.th {
  background: #f7f9fc;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}
.td {
  color: var(--text-regular);
  font-size: 14px;
}
.name .title {
  font-weight: 600;
  color: var(--text-primary);
}
.name .sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--text-secondary);
}
.badge.ok {
  border-color: rgba(103, 194, 58, 0.35);
  background: rgba(103, 194, 58, 0.1);
  color: #3f9c1f;
}
.badge.muted {
  background: #f5f7fa;
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.btn {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}
.btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}
.btn.danger:hover {
  border-color: var(--danger-color);
  color: var(--danger-color);
}
.hint {
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 12px;
}
@media (max-width: 980px) {
  .filters {
    flex-direction: column;
  }
  .tr {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .th {
    display: none;
  }
  .actions {
    justify-content: flex-start;
  }
}
</style>


