<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">考试系统</h1>
      <button class="btn-primary">创建考试</button>
    </div>

    <div class="stats">
      <div class="stat card">
        <div class="k">今日考试场次</div>
        <div class="v">3</div>
      </div>
      <div class="stat card">
        <div class="k">进行中</div>
        <div class="v">1</div>
      </div>
      <div class="stat card">
        <div class="k">待阅卷</div>
        <div class="v">12</div>
      </div>
      <div class="stat card">
        <div class="k">合格率</div>
        <div class="v">86%</div>
      </div>
    </div>

    <div class="card">
      <div class="table">
        <div class="tr th">
          <div class="td name">考试名称</div>
          <div class="td">时间</div>
          <div class="td">对象</div>
          <div class="td">题量</div>
          <div class="td">状态</div>
          <div class="td actions">操作</div>
        </div>
        <div class="tr" v-for="e in exams" :key="e.id">
          <div class="td name">
            <div class="title">{{ e.title }}</div>
            <div class="sub">组卷：{{ e.paper }}</div>
          </div>
          <div class="td">{{ e.time }}</div>
          <div class="td">{{ e.target }}</div>
          <div class="td">{{ e.count }}</div>
          <div class="td">
            <span class="badge" :class="statusClass(e.status)">{{ e.status }}</span>
          </div>
          <div class="td actions">
            <button class="btn">进入</button>
            <button class="btn">阅卷</button>
            <button class="btn">详情</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type ExamStatus = '未开始' | '进行中' | '已结束' | '待阅卷'
type ExamRow = {
  id: string
  title: string
  paper: string
  time: string
  target: string
  count: number
  status: ExamStatus
}

const exams: ExamRow[] = [
  {
    id: 'e-001',
    title: '外科护理基础考核（第一阶段）',
    paper: '随机抽题（基础/提高）',
    time: '2026-01-22 19:30',
    target: '2026 春季班',
    count: 50,
    status: '未开始'
  },
  {
    id: 'e-002',
    title: '感染控制专项测验',
    paper: '固定卷（感染控制）',
    time: '2026-01-20 14:00',
    target: '外科专项班',
    count: 30,
    status: '进行中'
  },
  {
    id: 'e-003',
    title: '围手术期护理复盘测验',
    paper: '混合卷（含简答题）',
    time: '2026-01-18 10:00',
    target: '全员',
    count: 20,
    status: '待阅卷'
  }
]

function statusClass(s: ExamStatus) {
  if (s === '进行中') return 'warn'
  if (s === '待阅卷') return 'info'
  if (s === '已结束') return 'muted'
  return 'muted'
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
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.stat {
  padding: 16px;
}
.k {
  color: var(--text-secondary);
  font-size: 12px;
}
.v {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
}
.table .tr {
  display: grid;
  grid-template-columns: 2.2fr 1.2fr 1fr 0.8fr 0.9fr 1.4fr;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}
.table .tr:last-child {
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
.badge.warn {
  border-color: rgba(230, 162, 60, 0.35);
  background: rgba(230, 162, 60, 0.12);
  color: #b36a00;
}
.badge.info {
  border-color: rgba(64, 158, 255, 0.35);
  background: rgba(64, 158, 255, 0.12);
  color: #1d7fd7;
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
.hint {
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 12px;
}
@media (max-width: 900px) {
  .table .tr {
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


