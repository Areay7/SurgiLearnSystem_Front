<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">在线题库</h1>
      <button class="btn-primary">新增试题</button>
    </div>

    <div class="filters">
      <input class="search-input" placeholder="搜索题目关键字..." />
      <select class="select">
        <option>全部题型</option>
        <option>单选题</option>
        <option>多选题</option>
        <option>判断题</option>
        <option>简答题</option>
      </select>
      <select class="select">
        <option>全部难度</option>
        <option>基础</option>
        <option>提高</option>
        <option>挑战</option>
      </select>
    </div>

    <div class="card">
      <div class="table">
        <div class="tr th">
          <div class="td stem">题目</div>
          <div class="td">题型</div>
          <div class="td">难度</div>
          <div class="td">知识点</div>
          <div class="td actions">操作</div>
        </div>
        <div class="tr" v-for="q in questions" :key="q.id">
          <div class="td stem">
            <div class="title">{{ q.stem }}</div>
            <div class="sub">来源：{{ q.source }}</div>
          </div>
          <div class="td">{{ q.type }}</div>
          <div class="td">
            <span class="badge" :class="levelClass(q.level)">{{ q.level }}</span>
          </div>
          <div class="td">{{ q.topic }}</div>
          <div class="td actions">
            <button class="btn">预览</button>
            <button class="btn">编辑</button>
            <button class="btn danger">禁用</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Question = {
  id: string
  stem: string
  type: '单选题' | '多选题' | '判断题' | '简答题'
  level: '基础' | '提高' | '挑战'
  topic: string
  source: string
}

const questions: Question[] = [
  {
    id: 'q-001',
    stem: '外科伤口换药时，无菌操作的关键步骤是？',
    type: '单选题',
    level: '基础',
    topic: '无菌技术',
    source: '护理培训题库'
  },
  {
    id: 'q-002',
    stem: '下列哪些属于围手术期感染风险因素？',
    type: '多选题',
    level: '提高',
    topic: '感染控制',
    source: '外科专项班'
  },
  {
    id: 'q-003',
    stem: '术后疼痛评估应覆盖疼痛部位、性质与评分。',
    type: '判断题',
    level: '基础',
    topic: '疼痛管理',
    source: '课程配套练习'
  }
]

function levelClass(level: Question['level']) {
  if (level === '基础') return 'ok'
  if (level === '提高') return 'warn'
  return 'danger'
}
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
  grid-template-columns: 2.4fr 0.9fr 0.9fr 1fr 1.4fr;
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
.stem .title {
  font-weight: 600;
  color: var(--text-primary);
}
.stem .sub {
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
.badge.warn {
  border-color: rgba(230, 162, 60, 0.35);
  background: rgba(230, 162, 60, 0.12);
  color: #b36a00;
}
.badge.danger {
  border-color: rgba(245, 108, 108, 0.35);
  background: rgba(245, 108, 108, 0.12);
  color: #d64545;
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


