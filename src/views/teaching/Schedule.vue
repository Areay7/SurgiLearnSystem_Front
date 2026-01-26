<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">课程安排设置</h1>
      <button class="btn-primary">新建课程安排</button>
    </div>

    <div class="filters">
      <select class="select">
        <option>全部班级</option>
        <option>2026 春季班</option>
        <option>外科专项班</option>
      </select>
      <select class="select">
        <option>全部状态</option>
        <option>未开始</option>
        <option>进行中</option>
        <option>已结束</option>
      </select>
      <input class="search-input" placeholder="搜索课程/讲师..." />
    </div>

    <div class="grid">
      <div class="card" v-for="c in courses" :key="c.id">
        <div class="card-head">
          <div>
            <div class="title">{{ c.title }}</div>
            <div class="sub">讲师：{{ c.instructor }} · 地点：{{ c.location }}</div>
          </div>
          <span class="badge" :class="badgeClass(c.status)">{{ c.status }}</span>
        </div>
        <div class="meta">
          <div class="meta-item">
            <div class="k">日期</div>
            <div class="v">{{ c.date }}</div>
          </div>
          <div class="meta-item">
            <div class="k">时间</div>
            <div class="v">{{ c.time }}</div>
          </div>
          <div class="meta-item">
            <div class="k">班级</div>
            <div class="v">{{ c.className }}</div>
          </div>
        </div>
        <div class="actions">
          <button class="btn">查看</button>
          <button class="btn">编辑</button>
          <button class="btn danger">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type CourseStatus = '未开始' | '进行中' | '已结束'
type Course = {
  id: string
  title: string
  instructor: string
  location: string
  date: string
  time: string
  className: string
  status: CourseStatus
}

const courses: Course[] = [
  {
    id: 'c-001',
    title: '外科护理基础：术前评估',
    instructor: '李讲师',
    location: '线上直播',
    date: '2026-01-22',
    time: '19:30-21:00',
    className: '2026 春季班',
    status: '未开始'
  },
  {
    id: 'c-002',
    title: '伤口处理与感染控制',
    instructor: '王讲师',
    location: '培训室 A',
    date: '2026-01-20',
    time: '14:00-16:00',
    className: '外科专项班',
    status: '进行中'
  },
  {
    id: 'c-003',
    title: '围手术期护理要点复盘',
    instructor: '周讲师',
    location: '线上录播',
    date: '2026-01-10',
    time: '自学',
    className: '2026 春季班',
    status: '已结束'
  }
]

function badgeClass(status: CourseStatus) {
  if (status === '进行中') return 'warn'
  if (status === '未开始') return 'info'
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
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.select,
.search-input {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.search-input {
  flex: 1;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
}
.card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}
.title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}
.sub {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 12px;
}
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  background: #fff;
  white-space: nowrap;
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
.meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}
.meta-item .k {
  font-size: 12px;
  color: var(--text-secondary);
}
.meta-item .v {
  margin-top: 4px;
  color: var(--text-regular);
}
.actions {
  display: flex;
  gap: 8px;
}
.btn {
  padding: 8px 12px;
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
  .meta {
    grid-template-columns: 1fr;
  }
}
</style>


