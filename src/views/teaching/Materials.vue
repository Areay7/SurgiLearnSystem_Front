<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">学习资料管理</h1>
      <button class="btn-primary">上传资料</button>
    </div>

    <div class="toolbar">
      <input class="search-input" placeholder="搜索资料名称/关键词..." />
      <select class="select">
        <option>全部分类</option>
        <option>培训课件</option>
        <option>指南规范</option>
        <option>操作流程</option>
        <option>病例资料</option>
      </select>
      <select class="select">
        <option>全部状态</option>
        <option>已发布</option>
        <option>草稿</option>
      </select>
    </div>

    <div class="card">
      <div class="table">
        <div class="tr th">
          <div class="td name">资料名称</div>
          <div class="td">分类</div>
          <div class="td">更新人</div>
          <div class="td">更新时间</div>
          <div class="td">状态</div>
          <div class="td actions">操作</div>
        </div>
        <div class="tr" v-for="item in list" :key="item.id">
          <div class="td name">
            <div class="title">{{ item.title }}</div>
            <div class="sub">标签：{{ item.tags.join(' / ') }}</div>
          </div>
          <div class="td">{{ item.category }}</div>
          <div class="td">{{ item.owner }}</div>
          <div class="td">{{ item.updatedAt }}</div>
          <div class="td">
            <span class="badge" :class="item.status === '已发布' ? 'ok' : 'muted'">{{ item.status }}</span>
          </div>
          <div class="td actions">
            <button class="btn">预览</button>
            <button class="btn">编辑</button>
            <button class="btn danger">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Material = {
  id: string
  title: string
  category: string
  tags: string[]
  owner: string
  updatedAt: string
  status: '已发布' | '草稿'
}

const list: Material[] = [
  {
    id: 'm-001',
    title: '外科护理基础课件（第一章）',
    category: '培训课件',
    tags: ['外科基础', '护理要点'],
    owner: '李讲师',
    updatedAt: '2026-01-18 10:20',
    status: '已发布'
  },
  {
    id: 'm-002',
    title: '围手术期患者评估与风险分级',
    category: '指南规范',
    tags: ['评估', '风险'],
    owner: '王讲师',
    updatedAt: '2026-01-16 14:05',
    status: '已发布'
  },
  {
    id: 'm-003',
    title: '伤口换药标准流程（V1 草稿）',
    category: '操作流程',
    tags: ['换药', '消毒'],
    owner: '管理员',
    updatedAt: '2026-01-15 09:40',
    status: '草稿'
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

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.search-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.select {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.table {
  width: 100%;
}
.tr {
  display: grid;
  grid-template-columns: 2.2fr 1fr 1fr 1.2fr 0.9fr 1.4fr;
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
  color: var(--text-secondary);
  background: #fff;
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

@media (max-width: 900px) {
  .toolbar {
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


